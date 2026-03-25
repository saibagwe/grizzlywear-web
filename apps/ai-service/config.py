"""
Central configuration — loads from .env
"""

import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "grizzlywear-catalog")

# Firebase Admin credentials
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "grizzlywear")
FIREBASE_PRIVATE_KEY = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL", "")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

# Embedding model
EMBEDDING_MODEL = "models/text-embedding-004"
EMBEDDING_DIMENSION = 768

# Chat model
CHAT_MODEL = "gemini-2.0-flash"
