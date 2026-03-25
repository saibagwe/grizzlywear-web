import os
import sys

# Add path so we can import config
sys.path.append(os.path.join(os.getcwd(), 'apps', 'ai-service'))

from config import GEMINI_API_KEY
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)

try:
    print("Testing models/text-embedding-004...")
    res = genai.embed_content(
        model="models/text-embedding-004",
        content="hello",
        task_type="RETRIEVAL_QUERY"
    )
    print("Success. Dim:", len(res["embedding"]))
except Exception as e:
    print("Failed:")
    print(e)

try:
    print("Testing models/embedding-001...")
    res = genai.embed_content(
        model="models/embedding-001",
        content="hello",
        task_type="RETRIEVAL_QUERY"
    )
    print("Success. Dim:", len(res["embedding"]))
except Exception as e:
    print("Failed:")
    print(e)
