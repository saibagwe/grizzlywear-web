"""
Pinecone vector-store helpers — upsert product embeddings \u0026 query them.
"""

from pinecone import Pinecone, ServerlessSpec
from config import PINECONE_API_KEY, PINECONE_INDEX_NAME, EMBEDDING_DIMENSION

_pc: Pinecone | None = None
_index = None


def _get_index():
    global _pc, _index
    if _index is not None:
        return _index

    _pc = Pinecone(api_key=PINECONE_API_KEY)

    # Create the index if it doesn't exist yet, or recreate if dimension mismatches
    existing = {idx.name: idx for idx in _pc.list_indexes()}
    if PINECONE_INDEX_NAME in existing:
        idx_info = existing[PINECONE_INDEX_NAME]
        if idx_info.dimension != EMBEDDING_DIMENSION:
            print(f"⚠️  Index dimension {idx_info.dimension} != {EMBEDDING_DIMENSION}. Recreating...")
            _pc.delete_index(PINECONE_INDEX_NAME)
            import time
            time.sleep(5)  # Wait for deletion to propagate
            _create_index(_pc)
    else:
        _create_index(_pc)

    _index = _pc.Index(PINECONE_INDEX_NAME)
    return _index


def _create_index(pc: Pinecone):
    import time
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=EMBEDDING_DIMENSION,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    print(f"✅ Created Pinecone index '{PINECONE_INDEX_NAME}' (dim={EMBEDDING_DIMENSION})")
    # Wait until the index is ready
    while True:
        info = pc.describe_index(PINECONE_INDEX_NAME)
        if info.status.ready:
            break
        print("   Waiting for index to be ready...")
        time.sleep(3)
    print("   Index is ready!")



def upsert_vectors(vectors: list[dict]):
    """
    Upsert a batch of vectors.
    Each dict must have: { id, values, metadata }
    """
    index = _get_index()
    # Pinecone recommends batches of 100
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        index.upsert(vectors=[(v["id"], v["values"], v["metadata"]) for v in batch])


def query_vectors(query_embedding: list[float], top_k: int = 5) -> list[dict]:
    """
    Query the index and return the top_k most similar results with metadata.
    """
    index = _get_index()
    results = index.query(vector=query_embedding, top_k=top_k, include_metadata=True)
    return [
        {
            "id": match.id,
            "score": match.score,
            "metadata": match.metadata,
        }
        for match in results.matches
    ]


def delete_vector(product_id: str):
    """Delete a single vector by product ID."""
    index = _get_index()
    index.delete(ids=[product_id])
