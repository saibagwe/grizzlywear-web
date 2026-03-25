"""
Gemini embedding + chat helpers.
"""

import google.generativeai as genai
from config import GEMINI_API_KEY, EMBEDDING_MODEL, CHAT_MODEL

genai.configure(api_key=GEMINI_API_KEY)


def get_embedding(text: str) -> list[float]:
    """Generate a 768-dim embedding for a single text string."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="RETRIEVAL_DOCUMENT",
    )
    return result["embedding"]


def get_query_embedding(text: str) -> list[float]:
    """Generate an embedding optimised for query retrieval."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="RETRIEVAL_QUERY",
    )
    return result["embedding"]


def chat_with_context(user_message: str, product_context: str) -> str:
    """
    Send the user message + retrieved product context to Gemini and
    return the assistant reply.
    """
    system_prompt = (
        "You are **Grizz**, the friendly AI shopping assistant for Grizzlywear, "
        "a premium Indian streetwear brand.\n\n"
        "RULES:\n"
        "• Answer helpfully and concisely based ONLY on the product information provided below.\n"
        "• If the user asks about something not covered by the product data, politely say you don't have "
        "that information and suggest they contact support.\n"
        "• Use markdown formatting: **bold** for emphasis, bullet lists where helpful.\n"
        "• Always mention product names, prices (₹), and key details.\n"
        "• Keep responses under 150 words unless the user asks for more detail.\n"
        "• Be warm, use 1-2 emojis max per message.\n\n"
        "PRODUCT CATALOG CONTEXT:\n"
        f"{product_context}\n"
    )

    model = genai.GenerativeModel(
        CHAT_MODEL,
        system_instruction=system_prompt,
    )

    response = model.generate_content(user_message)
    return response.text
