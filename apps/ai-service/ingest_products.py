"""
Ingestion script — fetches all products from Firestore,
generates Gemini embeddings, and upserts them into Pinecone.

Usage:
    python ingest_products.py
"""

from firebase_client import fetch_all_products
from gemini_service import get_embedding
from pinecone_service import upsert_vectors


def product_to_text(p: dict) -> str:
    """
    Convert a Firestore product document into a plain-text string
    suitable for embedding.
    """
    parts = [
        f"Product: {p.get('name', 'Unnamed')}",
        f"Category: {p.get('category', 'N/A')}",
        f"Subcategory: {p.get('subcategory', 'N/A')}",
        f"Price: ₹{p.get('price', 0)}",
    ]

    if p.get("comparePrice"):
        parts.append(f"Compare Price: ₹{p['comparePrice']}")
    if p.get("discount"):
        parts.append(f"Discount: {p['discount']}% off")

    parts.append(f"Description: {p.get('description', '')}")

    if p.get("shortDescription"):
        parts.append(f"Short Description: {p['shortDescription']}")
    if p.get("material"):
        parts.append(f"Material: {p['material']}")
    if p.get("fit"):
        parts.append(f"Fit: {p['fit']}")
    if p.get("sizes"):
        parts.append(f"Available Sizes: {', '.join(p['sizes'])}")
    if p.get("features"):
        parts.append(f"Features: {', '.join(p['features'])}")
    if p.get("tags"):
        parts.append(f"Tags: {', '.join(p['tags'])}")
    if p.get("careInstructions"):
        parts.append(f"Care: {', '.join(p['careInstructions'])}")

    parts.append(f"In Stock: {'Yes' if p.get('inStock', False) else 'No'}")
    parts.append(f"Featured: {'Yes' if p.get('isFeatured', False) else 'No'}")
    parts.append(f"New Arrival: {'Yes' if p.get('isNew', False) else 'No'}")

    return "\n".join(parts)


def build_pinecone_product_metadata(p: dict) -> dict:
    """Build Pinecone metadata with the strict product schema."""
    return {
        "productId": p.get("id", ""),
        "name": p.get("name", ""),
        "slug": p.get("slug", ""),
        "price": float(p.get("price", 0)),
        "comparePrice": float(p.get("comparePrice", 0) or 0),
        "category": p.get("category", ""),
        "imageUrl": (p.get("images") or [""])[0],
        "inStock": p.get("inStock", False),
    }


# Backward-compatible alias for existing imports.
build_metadata = build_pinecone_product_metadata


def ingest():
    print("📦 Fetching products from Firestore...")
    products = fetch_all_products()
    print(f"   Found {len(products)} products.\n")

    if not products:
        print("⚠️  No products found. Nothing to ingest.")
        return

    vectors = []
    for i, p in enumerate(products, 1):
        text = product_to_text(p)
        print(f"[{i}/{len(products)}] Embedding: {p.get('name', 'Unnamed')}...")
        embedding = get_embedding(text)
        if len(embedding) != 512:
            raise ValueError(f"Embedding dimension mismatch for {p.get('id', 'unknown')}: {len(embedding)}")
        vectors.append({
            "id": p["id"],
            "values": embedding,
            "metadata": build_pinecone_product_metadata(p),
        })

    print(f"\n⬆️  Upserting {len(vectors)} vectors to Pinecone...")
    upsert_vectors(vectors)
    print("✅ Ingestion complete!")


if __name__ == "__main__":
    ingest()
