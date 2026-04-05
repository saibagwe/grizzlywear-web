"""
Visual search helpers backed by Hugging Face CLIP.
"""

from io import BytesIO

import requests
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

MODEL_ID = "openai/clip-vit-base-patch32"
EMBEDDING_DIMENSION = 512

_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_processor = CLIPProcessor.from_pretrained(MODEL_ID)
_model = CLIPModel.from_pretrained(MODEL_ID).to(_device)
_model.eval()


def get_image_embedding(image_url: str) -> list[float]:
    """Download an image and return a normalized 512-dim CLIP embedding."""
    if not image_url or not image_url.strip():
        raise ValueError("imageUrl is required")

    try:
        response = requests.get(image_url, timeout=20)
        response.raise_for_status()
    except requests.RequestException as err:
        raise ValueError(f"Failed to download image: {err}") from err

    try:
        image = Image.open(BytesIO(response.content)).convert("RGB")
    except Exception as err:
        raise ValueError("Invalid image data at imageUrl") from err

    inputs = _processor(images=image, return_tensors="pt")
    inputs = {key: value.to(_device) for key, value in inputs.items()}

    with torch.no_grad():
        image_features = _model.get_image_features(**inputs)
        image_features = torch.nn.functional.normalize(image_features, p=2, dim=-1)

    embedding = image_features.squeeze(0).detach().cpu().tolist()

    if len(embedding) != EMBEDDING_DIMENSION:
        raise ValueError(
            f"CLIP embedding dimension mismatch: {len(embedding)} != {EMBEDDING_DIMENSION}"
        )

    return embedding
