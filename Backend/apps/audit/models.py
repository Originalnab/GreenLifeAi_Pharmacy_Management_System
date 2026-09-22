from django.db import models
from apps.core.models import UUIDModel

class AuditEvent(UUIDModel):
    branch = models.ForeignKey(
        'administration.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_events'
    )
    actor = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_audits'
    )
    actor_name = models.CharField(max_length=255)
    actor_role = models.CharField(max_length=100)
    module = models.CharField(max_length=50) # 'pos', 'sales', 'inventory', 'administration', 'security'
    action_type = models.CharField(max_length=100) # 'USER_CREATED', 'PASSWORD_RESET', 'SALE_COMPLETED'
    target_identifier = models.CharField(max_length=100)
    description = models.TextField()
    ip_address = models.CharField(max_length=50, blank=True, null=True)
    payload_before = models.JSONField(blank=True, null=True)
    payload_after = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['module', 'action_type']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M:%S}] {self.action_type} by {self.actor_name}"
