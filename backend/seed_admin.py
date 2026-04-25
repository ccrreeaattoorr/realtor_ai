import os
from elasticsearch import Elasticsearch
from passlib.context import CryptContext

ES_API_KEY = os.getenv("ES_API_KEY")
ES_API_URL = os.getenv("ES_API_URL")
ADMIN_PHONE = os.getenv("ADMIN_PHONE")

if not all([ES_API_KEY, ES_API_URL, ADMIN_PHONE]):
    print("Error: ES_API_KEY, ES_API_URL, and ADMIN_PHONE must be set in environment.")
    exit(1)

es = Elasticsearch(ES_API_URL, api_key=ES_API_KEY)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    # Normalize the admin phone
    import re
    clean = re.sub(r"\D", "", ADMIN_PHONE)
    if clean.startswith("05") and len(clean) == 10:
        clean = "972" + clean[1:]
    
    admin_user = {
        "phone": clean,
        "password": pwd_context.hash("90lomik1"),
        "role": "admin",
        "full_name": "System Admin",
        "is_verified": True
    }
    res = es.index(index="users", id=clean, document=admin_user, refresh=True)
    print(f"Admin seed for {clean} result: {res['result']}")

if __name__ == "__main__":
    seed()
