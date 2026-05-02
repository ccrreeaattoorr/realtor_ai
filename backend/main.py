import os
import json
import time
import random
import re
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from elasticsearch import Elasticsearch, NotFoundError
from openai import OpenAI
import requests
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel

# Configuration from environment variables
ES_API_KEY = os.getenv("ES_API_KEY")
ES_API_URL = os.getenv("ES_API_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GREEN_API_URL = os.getenv("GREEN_API_URL", "https://7107.api.greenapi.com")
GREEN_API_INSTANCE = os.getenv("GREEN_API_INSTANCE")
GREEN_API_TOKEN = os.getenv("GREEN_API_TOKEN")
ADMIN_PHONE = os.getenv("ADMIN_PHONE")
SECRET_KEY = os.getenv("SECRET_KEY", "prod-secret-fallback-change-this")
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Clients
if not ES_API_URL or not ES_API_KEY:
    print("WARNING: ES_API_URL or ES_API_KEY not set")
es = Elasticsearch(ES_API_URL, api_key=ES_API_KEY) if ES_API_URL else None
openai_client = OpenAI(api_key=OPENAI_API_KEY)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Realtor Hebrew API")

# Setup CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if FRONTEND_URL and FRONTEND_URL != "*":
    origins.append(FRONTEND_URL)
    # Also add version without trailing slash just in case
    if FRONTEND_URL.endswith("/"):
        origins.append(FRONTEND_URL[:-1])
else:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class User(BaseModel):
    phone: str
    password: str
    full_name: Optional[str] = None
    role: str = "user"
    is_verified: bool = False
    otp: Optional[str] = None
    otp_expires: Optional[datetime] = None

class Listing(BaseModel):
    id: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    rooms: Optional[float] = None
    price: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    has_elevator: Optional[bool] = None
    has_parking: Optional[bool] = None
    has_mamad: Optional[bool] = False
    raw_text: Optional[str] = None
    created_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

# Helper Functions
def normalize_phone(phone: str) -> str:
    clean = re.sub(r"\D", "", phone)
    if clean.startswith("05") and len(clean) == 10:
        clean = "972" + clean[1:]
    elif clean.startswith("5") and len(clean) == 9:
        clean = "972" + clean
    return clean

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return payload

def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

def _green_api_send_url() -> Optional[str]:
    if not GREEN_API_INSTANCE or not GREEN_API_TOKEN:
        return None
    base = GREEN_API_URL.rstrip("/")
    return f"{base}/waInstance{GREEN_API_INSTANCE}/sendMessage/{GREEN_API_TOKEN}"

def send_whatsapp_otp(phone: str, otp: str):
    url = _green_api_send_url()
    if not url:
        print("WARNING: GREEN_API_INSTANCE/GREEN_API_TOKEN not set; skipping WhatsApp send")
        return False
    clean_phone = normalize_phone(phone)
    payload = {
        "chatId": f"{clean_phone}@c.us",
        "message": f"קוד האימות שלך לריאלטור הוא: {otp}"
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        return response.status_code == 200
    except requests.RequestException as e:
        print(f"WhatsApp send failed: {e}")
        return False

# Initialization
@app.on_event("startup")
def startup_db():
    if es is None:
        print("WARNING: Elasticsearch client not configured; skipping startup init")
        return
    if not es.indices.exists(index="users"):
        es.indices.create(index="users")
    if not es.indices.exists(index="listings"):
        es.indices.create(index="listings")
    
    # Seed Admin
    admin_phone = normalize_phone("0546546855")
    if not es.exists(index="users", id=admin_phone):
        admin_user = {
            "phone": admin_phone,
            "password": get_password_hash("90lomik1"),
            "role": "admin",
            "full_name": "System Admin",
            "is_verified": True
        }
        es.index(index="users", id=admin_phone, document=admin_user, refresh=True)

# Auth Endpoints
@app.post("/api/auth/register")
def register(user: User):
    user.phone = normalize_phone(user.phone)
    try:
        existing = es.get(index="users", id=user.phone)
        if existing['_source'].get('is_verified'):
            raise HTTPException(status_code=400, detail="User already registered and verified")
    except NotFoundError:
        pass

    otp = str(random.randint(1000, 9999))
    expires = datetime.utcnow() + timedelta(minutes=5)
    
    send_whatsapp_otp(user.phone, otp) 
    
    hashed_pwd = get_password_hash(user.password)
    user_doc = user.dict()
    user_doc["password"] = hashed_pwd
    user_doc["otp"] = otp
    user_doc["otp_expires"] = expires.isoformat()
    user_doc["is_verified"] = False
    
    es.index(index="users", id=user.phone, document=user_doc, refresh=True)
    return {"message": "OTP sent via WhatsApp."}

@app.post("/api/auth/verify")
def verify_otp(phone: str = Form(...), otp: str = Form(...)):
    normalized = normalize_phone(phone)
    try:
        res = es.get(index="users", id=normalized)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = res['_source']
    if user_data.get('is_verified'):
        return {"message": "User already verified"}
    
    if user_data.get('otp') != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    expires_str = user_data.get('otp_expires')
    if not expires_str:
        raise HTTPException(status_code=400, detail="No OTP pending")
        
    expires = datetime.fromisoformat(expires_str)
    if datetime.utcnow() > expires:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    user_data['is_verified'] = True
    user_data['otp'] = None
    user_data['otp_expires'] = None
    es.index(index="users", id=normalized, document=user_data, refresh=True)
    
    return {"message": "Phone number verified successfully"}

@app.post("/api/auth/login", response_model=Token)
def login(phone: str = Form(...), password: str = Form(...)):
    normalized = normalize_phone(phone)
    print(f"LOGIN DEBUG: phone={phone}, normalized={normalized}")
    # Search for user by phone field (normalized)
    res = es.search(index="users", query={"term": {"phone.keyword": normalized}})
    
    if res['hits']['total']['value'] == 0:
        print(f"LOGIN DEBUG: user not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = res['hits']['hits'][0]['_source']
    print(f"LOGIN DEBUG: user={user.get('phone')}, verified={user.get('is_verified')}")

    if not user.get('is_verified'):
        print(f"LOGIN DEBUG: user not verified")
        raise HTTPException(status_code=403, detail="Phone number not verified")
    
    if not verify_password(password, user['password']):
        print(f"LOGIN DEBUG: password mismatch")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    print(f"LOGIN DEBUG: success")
    access_token = create_access_token(data={
        "sub": user['phone'], 
        "role": user['role'],
        "full_name": user.get('full_name', '')
    })
    return {"access_token": access_token, "token_type": "bearer"}

# Listings Endpoints
@app.get("/api/listings")
def get_listings(
    city: Optional[str] = None,
    min_rooms: Optional[float] = None,
    max_price: Optional[int] = None,
    has_elevator: Optional[bool] = None,
    has_parking: Optional[bool] = None,
    has_mamad: Optional[bool] = None,
    free_text: Optional[str] = None,
    page: int = 1,
    size: int = 5
):
    must = []
    if city:
        must.append({"match": {"city": city}})
    if min_rooms:
        must.append({"range": {"rooms": {"gte": min_rooms}}})
    if max_price:
        must.append({"range": {"price": {"lte": max_price}}})
    if has_elevator is not None:
        must.append({"term": {"has_elevator": has_elevator}})
    if has_parking is not None:
        must.append({"term": {"has_parking": has_parking}})
    if has_mamad is not None:
        must.append({"term": {"has_mamad": has_mamad}})
    if free_text:
        must.append({"multi_match": {"query": free_text, "fields": ["city", "street", "raw_text"]}})
    
    if not must:
        must.append({"match_all": {}})
    
    query = {"bool": {"must": must}}
    
    start_from = (page - 1) * size
    res = es.search(index="listings", query=query, from_=start_from, size=size, sort=[{"created_at": "desc"}])
    
    total = res['hits']['total']['value']
    results = []
    for hit in res['hits']['hits']:
        doc = hit['_source']
        doc['id'] = hit['_id']
        results.append(doc)
        
    return {
        "total": total,
        "page": page,
        "size": size,
        "listings": results
    }

@app.put("/api/listings/{listing_id}")
def update_listing(listing_id: str, listing: Listing, _: dict = Depends(require_admin)):
    doc = listing.dict(exclude={"id"})
    es.index(index="listings", id=listing_id, document=doc, refresh=True)
    return {"message": "Listing updated"}

@app.delete("/api/listings/{listing_id}")
def delete_listing(listing_id: str, _: dict = Depends(require_admin)):
    es.delete(index="listings", id=listing_id, refresh=True)
    return {"message": "Listing deleted"}

# Admin Stats & Bulk Actions
@app.get("/api/admin/stats")
def get_stats(_: dict = Depends(require_admin)):
    res = es.count(index="listings")
    return {"total_listings": res['count']}

@app.delete("/api/admin/listings/bulk")
def bulk_delete_listings(start_date: str, end_date: str, _: dict = Depends(require_admin)):
    query = {
        "range": {
            "created_at": {
                "gte": start_date,
                "lte": end_date
            }
        }
    }
    res = es.delete_by_query(index="listings", query=query, refresh=True)
    return {"message": f"Deleted {res['deleted']} listings"}

# Global progress tracker
upload_progress = {"status": "idle", "percent": 0, "message": ""}

@app.get("/api/admin/upload-status")
def get_upload_status(_: dict = Depends(require_admin)):
    return upload_progress

@app.post("/api/admin/upload-listings")
async def upload_listings(file: UploadFile = File(...), _: dict = Depends(require_admin)):
    global upload_progress
    content = await file.read()
    text = content.decode("utf-8")
    
    message_pattern = r"\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2} - .*?:"
    messages = re.split(message_pattern, text)
    messages = [m.strip() for m in messages if m.strip()]
    
    total_messages = len(messages)
    chunk_size = 100
    all_parsed_listings = []

    if total_messages == 0:
        upload_progress = {"status": "idle", "percent": 100, "message": "No messages found in file."}
        return {"message": "No messages found in file.", "indexed": 0}

    upload_progress = {"status": "processing", "percent": 0, "message": f"Starting upload of {total_messages} messages..."}
    last_notified_percent = 0
    now = datetime.utcnow().isoformat()
    admin_phone = normalize_phone("0546546855")

    try:
        for i in range(0, total_messages, chunk_size):
            chunk = messages[i:i + chunk_size]
            chunk_text = "\n---\n".join(chunk)
            
            current_percent = int((i / total_messages) * 100)
            upload_progress["percent"] = current_percent
            upload_progress["message"] = f"Processing messages {i} to {min(i+chunk_size, total_messages)}..."

            # Notify admin via WhatsApp every 5%
            if current_percent >= last_notified_percent + 5:
                last_notified_percent = current_percent
                notification_msg = f"התקדמות העלאת מודעות: {current_percent}% ({i}/{total_messages})"
                url = _green_api_send_url()
                if url:
                    try:
                        requests.post(url, json={"chatId": f"{admin_phone}@c.us", "message": notification_msg}, timeout=10)
                    except requests.RequestException: pass

            prompt = """
            Extract real estate data from these Hebrew WhatsApp messages. 
            Return a JSON object with a "listings" key containing an array.
            Each object MUST have: city, street, rooms (float), price (int), floor (int), total_floors (int), has_elevator (bool), has_parking (bool), has_mamad (bool), raw_text (string).
            Use null for missing.
            """            
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a real estate data extraction assistant specializing in Hebrew."},
                        {"role": "user", "content": f"{prompt}\n\nMessages:\n{chunk_text}"}
                    ],
                    response_format={ "type": "json_object" }
                )
                
                data = json.loads(response.choices[0].message.content)
                listings = data.get("listings", [])
                
                import hashlib
                for listing in listings:
                    listing['created_at'] = now
                    # room and price parsing
                    rooms = listing.get('rooms')
                    try:
                        if isinstance(rooms, str):
                            if '-' in rooms:
                                parts = [float(p.strip()) for p in rooms.split('-') if p.strip()]
                                listing['rooms'] = sum(parts) / len(parts) if parts else None
                            else: listing['rooms'] = float(rooms)
                        elif rooms is not None: listing['rooms'] = float(rooms)
                        else: listing['rooms'] = None
                    except: listing['rooms'] = None

                    try:
                        if listing.get('price'):
                            listing['price'] = int(float(str(listing['price']).replace(',', '')))
                    except: listing['price'] = None

                    raw_text = listing.get('raw_text', '')
                    if raw_text:
                        listing_id = hashlib.sha256(raw_text.encode('utf-8')).hexdigest()
                        es.index(index="listings", id=listing_id, document=listing)
                    else:
                        es.index(index="listings", document=listing)
                    all_parsed_listings.append(listing)
                    
            except Exception as e:
                print(f"ERROR processing chunk {i//chunk_size}: {str(e)}")
                continue

        es.indices.refresh(index="listings")
        upload_progress = {"status": "idle", "percent": 100, "message": "Upload complete!"}
        
        # Success Notification
        url = _green_api_send_url()
        if url:
            try:
                msg = f"✅ העלאת הקובץ הושלמה ב-100%! נוספו/עודכנו {len(all_parsed_listings)} מודעות מתוך {total_messages} הודעות."
                requests.post(url, json={"chatId": f"{admin_phone}@c.us", "message": msg}, timeout=10)
            except requests.RequestException: pass

    except Exception as fatal_e:
        upload_progress = {"status": "error", "percent": 0, "message": f"Fatal error: {str(fatal_e)}"}
        # Failure Notification
        url = _green_api_send_url()
        if url:
            try:
                msg = f"❌ שגיאה קריטית בהעלאת הקובץ: {str(fatal_e)}"
                requests.post(url, json={"chatId": f"{admin_phone}@c.us", "message": msg}, timeout=10)
            except requests.RequestException: pass
        raise fatal_e

    return {"message": f"Successfully parsed and indexed {len(all_parsed_listings)} listings."}

# Serve built frontend (SPA) — keep this AFTER all /api/* routes
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.isdir(FRONTEND_DIST):
    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = os.path.normpath(os.path.join(FRONTEND_DIST, full_path))
        if full_path and candidate.startswith(FRONTEND_DIST) and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
