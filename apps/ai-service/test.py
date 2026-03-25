from gemini_service import get_query_embedding, chat_with_context
from pinecone_service import query_vectors
from config import GEMINI_API_KEY, PINECONE_API_KEY
import sys

print(f"GEMINI_API_KEY present: {bool(GEMINI_API_KEY)}")
print(f"PINECONE_API_KEY present: {bool(PINECONE_API_KEY)}")

try:
    print("Testing get_query_embedding...")
    vec = get_query_embedding("hello")
    print("Embedding length:", len(vec))
    
    print("Testing query_vectors...")
    res = query_vectors(vec, top_k=2)
    print("Query results:", res)
    
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
