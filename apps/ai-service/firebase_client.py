"""
Firebase Admin SDK — reads products from Firestore.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from config import FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL

_app = None
_db = None


def _init_firebase():
    global _app, _db
    if _app is not None:
        return

    if FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL:
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": FIREBASE_PROJECT_ID,
            "private_key": FIREBASE_PRIVATE_KEY,
            "client_email": FIREBASE_CLIENT_EMAIL,
            "token_uri": "https://oauth2.googleapis.com/token",
        })
        _app = firebase_admin.initialize_app(cred)
    else:
        # Fall back to default credentials (works on GCP / local emulator)
        _app = firebase_admin.initialize_app()

    _db = firestore.client()


def get_firestore_db():
    """Return a Firestore client, initialising on first call."""
    _init_firebase()
    return _db


def fetch_all_products() -> list[dict]:
    """Fetch every document from the 'products' collection."""
    db = get_firestore_db()
    docs = db.collection("products").stream()
    products = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        products.append(data)
    return products
