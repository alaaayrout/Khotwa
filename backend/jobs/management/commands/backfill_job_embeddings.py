from django.core.management.base import BaseCommand

from jobs.models import JobPosting
from jobs.signals import _build_job_embedding_text
from recommendations.services import EmbeddingService


class Command(BaseCommand):
    help = "حساب المتجهات الدلالية (embeddings) لكل وظيفة لا تملك متجهاً محسوباً بعد"

    def handle(self, *args, **options):
        service = EmbeddingService()


        # jobs = JobPosting.objects.all()
        jobs = JobPosting.objects.filter(embedding__isnull=True)
        total = jobs.count()

        if total == 0:
            self.stdout.write(self.style.SUCCESS("جميع الوظائف تملك متجهاً دلالياً بالفعل."))
            return

        self.stdout.write(f"سيتم حساب المتجه الدلالي لعدد {total} وظيفة...")

        updated = 0
        for job in jobs.iterator():
       
            text = _build_job_embedding_text(job)

            
            vector = service.encode(text)


            JobPosting.objects.filter(pk=job.pk).update(
                embedding=service.serialize_vector(vector)
            )

            updated += 1
            self.stdout.write(f"  [{updated}/{total}] {job.title}")

        self.stdout.write(self.style.SUCCESS(f"اكتملت العملية بنجاح، تم حساب المتجه لعدد {updated} وظيفة."))