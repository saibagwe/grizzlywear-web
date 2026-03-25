"""
Grizzlywear AI Service — FastAPI
Handles: RAG Chatbot, Product Embedding, and future AI features.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import traceback

from config import FRONTEND_URL, BACKEND_URL, GEMINI_API_KEY, PINECONE_API_KEY

app = FastAPI(
    title="Grizzlywear AI Service",
    description="AI-powered features for the Grizzlywear fashion platform",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        BACKEND_URL,
        "http://localhost:3000",
        "http://localhost:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ──────────────────────────────────────────────


class ChatRequest(BaseModel):
    message: str
    history: list[dict] | None = None


class ChatResponse(BaseModel):
    reply: str
    sources: list[dict] | None = None
    shouldEscalate: bool = False


class EmbedProductRequest(BaseModel):
    productId: str
    name: str
    slug: str
    price: float
    category: str
    subcategory: str = ""
    description: str = ""
    shortDescription: str = ""
    material: str = ""
    fit: str = ""
    sizes: list[str] = []
    features: list[str] = []
    tags: list[str] = []
    careInstructions: list[str] = []
    images: list[str] = []
    inStock: bool = True
    isFeatured: bool = False
    isNew: bool = False


class DeleteProductRequest(BaseModel):
    productId: str


# ─── Endpoints ───────────────────────────────────────────────────────────────


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "grizzlywear-ai",
        "gemini": bool(GEMINI_API_KEY),
        "pinecone": bool(PINECONE_API_KEY),
    }


@app.post("/ai/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """RAG-powered chatbot — retrieves relevant products then generates answer."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        from gemini_service import get_query_embedding, chat_with_context
        from pinecone_service import query_vectors

        # 1. Embed the user query
        query_vec = get_query_embedding(req.message)

        # 2. Search Pinecone for relevant products
        results = query_vectors(query_vec, top_k=5)

        # 3. Build context string from retrieved products
        if results:
            context_parts = []
            sources = []
            for r in results:
                meta = r["metadata"]
                context_parts.append(
                    f"• **{meta.get('name', 'N/A')}** — ₹{meta.get('price', 0)} | "
                    f"Category: {meta.get('category', '')} | "
                    f"Material: {meta.get('material', '')} | "
                    f"Fit: {meta.get('fit', '')} | "
                    f"Sizes: {meta.get('sizes', '')} | "
                    f"Tags: {meta.get('tags', '')} | "
                    f"Description: {meta.get('description', '')}"
                )
                sources.append({
                    "id": r["id"],
                    "name": meta.get("name", ""),
                    "slug": meta.get("slug", ""),
                    "price": meta.get("price", 0),
                    "image_url": meta.get("image_url", ""),
                    "score": r["score"],
                })
            product_context = "\n".join(context_parts)
        else:
            product_context = "No matching products found in the catalog."
            sources = []

        # 4. Generate response with Gemini
        reply = chat_with_context(req.message, product_context)

        return ChatResponse(reply=reply, sources=sources, shouldEscalate=False)

    except Exception as e:
        traceback.print_exc()
        return ChatResponse(
            reply="I'm having trouble right now 😅 Please try again in a moment or contact support.",
            shouldEscalate=True,
        )


@app.post("/ai/embed-product")
async def embed_product(req: EmbedProductRequest):
    """
    Embed a single product and upsert into Pinecone.
    Called from the frontend after product creation/update.
    """
    try:
        from ingest_products import product_to_text, build_metadata
        from gemini_service import get_embedding
        from pinecone_service import upsert_vectors

        product_dict = req.model_dump()
        product_dict["id"] = req.productId

        text = product_to_text(product_dict)
        embedding = get_embedding(text)

        upsert_vectors([{
            "id": req.productId,
            "values": embedding,
            "metadata": build_metadata(product_dict),
        }])

        return {"success": True, "message": f"Product '{req.name}' embedded."}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/delete-product")
async def delete_product_embedding(req: DeleteProductRequest):
    """Remove a product embedding from Pinecone."""
    try:
        from pinecone_service import delete_vector
        delete_vector(req.productId)
        return {"success": True, "message": f"Product '{req.productId}' removed from index."}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/tryon")
async def try_on():
    """Virtual try-on via Fashn.ai — to be implemented"""
    return {"message": "Virtual try-on coming soon!"}


@app.post("/ai/outfit-match")
async def outfit_match():
    """Outfit matching via Gemini Vision — to be implemented"""
    return {"message": "Outfit matcher coming soon!"}


@app.post("/ai/visual-search")
async def visual_search():
    """Visual search via CLIP + Pinecone — to be implemented"""
    return {"message": "Visual search coming soon!"}


@app.post("/ai/describe-product")
async def describe_product():
    """AI product descriptions via Gemini Vision — to be implemented"""
    return {"message": "AI descriptions coming soon!"}


@app.post("/ai/sales-insights")
async def sales_insights():
    """AI sales insights via Gemini — to be implemented"""
    return {"message": "AI insights coming soon!"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
