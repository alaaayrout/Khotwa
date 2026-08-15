
import numpy as np
from sentence_transformers import SentenceTransformer


class EmbeddingService:
    """Semantic embedding service using multilingual Sentence-BERT."""

    _models = {}
    MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

    def __init__(self, model_name: str = None):
        self.model_name = model_name or self.MODEL_NAME

    def _get_model(self) -> SentenceTransformer:
        if self.model_name not in self.__class__._models:
            self.__class__._models[self.model_name] = SentenceTransformer(self.model_name)
        return self.__class__._models[self.model_name]

    def encode_batch(self, texts: list[str]) -> np.ndarray:
        model = self._get_model()
        cleaned = [(t or "").strip() or " " for t in texts]  
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
    
        left = np.asarray(left)
        right = np.asarray(right)
        left_norm = np.linalg.norm(left)
        right_norm = np.linalg.norm(right)
        if left_norm == 0.0 or right_norm == 0.0:
            return 0.0
        return float(np.dot(left, right) / (left_norm * right_norm))

    def best_skill_similarity(self, seeker_skills: list[str], job_skills: list[str]) -> float:
        if not seeker_skills or not job_skills:
            return 0.0

        seeker_vectors = self.encode_batch(seeker_skills)
        job_vectors = self.encode_batch(job_skills)

        similarities = []

        for seeker_vector in seeker_vectors:
            scores = [
                self.cosine_similarity(seeker_vector, job_vector)
                for job_vector in job_vectors
            ]
            similarities.append(max(scores))

        return float(np.mean(similarities))

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
