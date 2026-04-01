"""
Gemini + Vertex AI helpers for embeddings and chat generation.
"""

import os
import tempfile
import httpx
import google.generativeai as genai
import vertexai
from vertexai.vision_models import Image, MultiModalEmbeddingModel

from config import (
    GEMINI_API_KEY,
    EMBEDDING_MODEL,
    CHAT_MODEL,
    GCP_PROJECT_ID,
    GCP_LOCATION,
    VERTEX_MULTIMODAL_MODEL,
    VERTEX_EMBEDDING_DIMENSION,
)

genai.configure(api_key=GEMINI_API_KEY)

_vertex_model: MultiModalEmbeddingModel | None = None


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


def _get_vertex_model() -> MultiModalEmbeddingModel:
    global _vertex_model
    if _vertex_model is not None:
        return _vertex_model

    if not GCP_PROJECT_ID:
        raise ValueError("GCP_PROJECT_ID is required for Vertex AI multimodal embeddings")

    vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION)
    _vertex_model = MultiModalEmbeddingModel.from_pretrained(VERTEX_MULTIMODAL_MODEL)
    return _vertex_model


def get_vertex_multimodal_embedding(text: str, image_url: str) -> list[float]:
    """
    Generate a 512-dim multimodal embedding from product text + image.
    """
    if not image_url:
        raise ValueError("image_url is required for Vertex multimodal embedding")

    model = _get_vertex_model()
    tmp_path = ""

    try:
        with httpx.Client(timeout=20.0, follow_redirects=True) as client:
            response = client.get(image_url)
            response.raise_for_status()
            image_bytes = response.content

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        image = Image.load_from_file(tmp_path)
        embeddings = model.get_embeddings(
            image=image,
            contextual_text=text,
            dimension=VERTEX_EMBEDDING_DIMENSION,
        )

        vectors: list[list[float]] = []
        image_vec = getattr(embeddings, "image_embedding", None)
        text_vec = getattr(embeddings, "text_embedding", None)

        if image_vec:
            vectors.append(list(image_vec))
        if text_vec:
            vectors.append(list(text_vec))

        if not vectors:
            raise ValueError("Vertex returned no embeddings")

        if len(vectors) == 1:
            return vectors[0]

        # Merge image + text vectors to keep a single cross-modal representation.
        merged = [sum(values) / len(values) for values in zip(*vectors)]
        return merged

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


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

    model = genai.GenerativeModel(CHAT_MODEL, system_instruction=system_prompt)

    generation_config = {
        "temperature": 1,
        "topP": 0.95,
        "topK": 64,
        "maxOutputTokens": 65536,
        "thinking": True,
    }

    try:
        response = model.generate_content(user_message, generation_config=generation_config)
    except Exception:
        # Fallback for SDK variants that don't support `thinking`.
        generation_config.pop("thinking", None)
        response = model.generate_content(user_message, generation_config=generation_config)

    return response.text
