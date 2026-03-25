import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'apps', 'ai-service'))
from config import GEMINI_API_KEY
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)

for m in genai.list_models():
    if 'embedContent' in m.supported_generation_methods:
        print(f"Embedding model: {m.name}")
