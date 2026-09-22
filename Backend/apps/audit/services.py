import logging
from .models import AuditEvent

logger = logging.getLogger(__name__)

def log_audit_event(
    module: str,
    action_type: str,
    target_identifier: str,
    description: str,
    actor=None,
    actor_name: str = 'System',
    actor_role: str = 'System',
    branch=None,
    ip_address: str = None,
    payload_before: dict = None,
    payload_after: dict = None
):
    try:
        if actor:
            actor_name = getattr(actor, 'name', actor_name)
            actor_role = getattr(actor, 'role', actor_role)
            if not branch and hasattr(actor, 'branch'):
                branch = actor.branch

        return AuditEvent.objects.create(
            branch=branch,
            actor=actor if actor and hasattr(actor, 'id') else None,
            actor_name=actor_name,
            actor_role=actor_role,
            module=module,
            action_type=action_type,
            target_identifier=str(target_identifier),
            description=description,
            ip_address=ip_address,
            payload_before=payload_before,
            payload_after=payload_after
        )
    except Exception as e:
        logger.error(f"Failed to record audit event: {e}")
        return None
