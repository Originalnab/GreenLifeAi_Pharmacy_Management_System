import uuid
from django.db import models

class UUIDModel(models.Model):
    """Abstract base model enforcing universal UUID v4 primary keys."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True

class TimestampedModel(models.Model):
    """Abstract base model tracking creation and modification timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class BranchAwareModel(models.Model):
    """Abstract base model linking records directly to an operating branch."""
    branch = models.ForeignKey(
        'administration.Branch',
        on_delete=models.CASCADE,
        related_name='%(class)s_records',
        null=True,
        blank=True
    )

    class Meta:
        abstract = True
