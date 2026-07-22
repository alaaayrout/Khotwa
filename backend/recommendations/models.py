from django.db import models


class RecommendationSettings(models.Model):
    name = models.CharField(max_length=100, unique=True, default='default')
    embedding_model = models.CharField(max_length=100, default='paraphrase-multilingual-MiniLM-L12-v2')
    embedding_version = models.CharField(max_length=50, default='v1')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Recommendation Settings'
        verbose_name_plural = 'Recommendation Settings'

    def __str__(self):
        return self.name
