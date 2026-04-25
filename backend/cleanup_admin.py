import os
from elasticsearch import Elasticsearch

ES_API_KEY = os.getenv("ES_API_KEY")
ES_API_URL = os.getenv("ES_API_URL")
ADMIN_PHONE = os.getenv("ADMIN_PHONE")

if not ES_API_KEY or not ES_API_URL:
    print("Error: ES_API_KEY and ES_API_URL must be set.")
    exit(1)

es = Elasticsearch(ES_API_URL, api_key=ES_API_KEY)

def cleanup():
    if not ADMIN_PHONE:
        print("ADMIN_PHONE not set. Cleanup skipped.")
        return

    admin_phones = ["+972546546855", "972546546855", "0546546855", ADMIN_PHONE]
    query = {"terms": {"phone.keyword": admin_phones}}
    
    res = es.delete_by_query(index="users", query=query, refresh=True)
    print(f"Cleanup result: deleted {res['deleted']} duplicate admin records.")

if __name__ == "__main__":
    cleanup()
