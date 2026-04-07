"""
Gemini helpers for embeddings and chat generation.
"""

import google.generativeai as genai

from config import (
    GEMINI_API_KEY,
    EMBEDDING_MODEL,
    CHAT_MODEL,
)

genai.configure(api_key=GEMINI_API_KEY)


def get_embedding(text: str) -> list[float]:
    """Generate a 512-dim embedding for a single text string."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="RETRIEVAL_DOCUMENT",
        output_dimensionality=512,
    )
    embedding = result["embedding"]
    if len(embedding) != 512:
        raise ValueError(f"Gemini embedding dimension mismatch: {len(embedding)}")
    return embedding


def get_query_embedding(text: str) -> list[float]:
    """Generate an embedding optimised for query retrieval."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="RETRIEVAL_QUERY",
        output_dimensionality=512,
    )
    embedding = result["embedding"]
    if len(embedding) != 512:
        raise ValueError(f"Gemini query embedding dimension mismatch: {len(embedding)}")
    return embedding


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

    generation_config = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 65536,
    }

    model = genai.GenerativeModel(CHAT_MODEL, system_instruction=system_prompt)
    try:
        response = model.generate_content(user_message, generation_config=generation_config)
    except Exception:
        # Fallback for SDK variants with stricter/older GenerationConfig schemas.
        response = model.generate_content(user_message, generation_config={"temperature": 1})

    if response.text:
        return response.text
    raise RuntimeError("Gemini returned an empty response")
