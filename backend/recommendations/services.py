# matching/services.py
import numpy as np
from sentence_transformers import SentenceTransformer


class EmbeddingService:
    """Semantic embedding service using multilingual Sentence-BERT."""

    _model = None
    MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

    def __init__(self, model_name: str = None):
        self.model_name = model_name or self.MODEL_NAME

    @classmethod
    def _get_model(cls) -> SentenceTransformer:
        if cls._model is None:
            cls._model = SentenceTransformer(cls.MODEL_NAME)
        return cls._model

    def encode_batch(self, texts: list[str]) -> np.ndarray:
        model = self._get_model()
        cleaned = [(t or "").strip() or " " for t in texts]  # نص فاضي بيكسر الموديل أحياناً
        return model.encode(
            cleaned,
            convert_to_numpy=True,
            normalize_embeddings=True,
            batch_size=32,
            show_progress_bar=False,
        )

    def encode(self, text: str) -> np.ndarray:
        return self.encode_batch([text])[0]

    def cosine_similarity(self, left: np.ndarray, right: np.ndarray) -> float:
        # الفيكتورز أصلاً normalized (طولها 1)، فالـ dot product = cosine similarity مباشرة
        left = np.asarray(left)
        right = np.asarray(right)
        left_norm = np.linalg.norm(left)
        right_norm = np.linalg.norm(right)
        if left_norm == 0.0 or right_norm == 0.0:
            return 0.0
        return float(np.dot(left, right) / (left_norm * right_norm))

    def serialize_vector(self, vector: np.ndarray) -> str:
        import json
        return json.dumps(np.asarray(vector).tolist())

    def deserialize_vector(self, value: str | None) -> np.ndarray:
        import json
        if not value:
            return np.array([])
        try:
            return np.array(json.loads(value))
        except (TypeError, json.JSONDecodeError):
            return np.array([])