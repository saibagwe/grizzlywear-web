import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'apps', 'ai-service'))
from config import GEMINI_API_KEY
import google.generativeai as genai
from gemini_service import get_query_embedding

genai.configure(api_key=GEMINI_API_KEY)

try:
    vec = get_query_embedding("hello")
    print(f"Success! Vector dimension: {len(vec)}")
except Exception as e:
    print(f"Error during get_query_embedding: {e}")
    import traceback
    traceback.print_exc()
