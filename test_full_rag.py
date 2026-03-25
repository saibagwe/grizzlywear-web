import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'apps', 'ai-service'))
from config import GEMINI_API_KEY
import google.generativeai as genai
from gemini_service import get_query_embedding, chat_with_context
from pinecone_service import query_vectors

genai.configure(api_key=GEMINI_API_KEY)

try:
    print("1. Embedding query...")
    vec = get_query_embedding("hello")
    print(f"   Success! Dim: {len(vec)}")

    print("2. Querying Pinecone...")
    results = query_vectors(vec, top_k=5)
    print(f"   Success! Found {len(results)} results.")

    print("3. Building context...")
    product_context = "test context"

    print("4. Chatting with Gemini...")
    reply = chat_with_context("hello", product_context)
    print(f"   Success! Reply length: {len(reply)}")
    print(reply)

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
