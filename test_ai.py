import os
import sys

# add current dir to path
sys.path.append(os.path.join(os.getcwd(), 'apps', 'ai-service'))

from apps.ai_service.gemini_service import get_query_embedding, chat_with_context
from apps.ai_service.pinecone_service import query_vectors
from dotenv import load_dotenv

load_dotenv('apps/ai-service/.env')

print("Testing get_query_embedding...")
try:
    vec = get_query_embedding("hello")
    print("Embedding length:", len(vec))
    print("Testing query_vectors...")
    res = query_vectors(vec, top_k=2)
    print("Query results:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
