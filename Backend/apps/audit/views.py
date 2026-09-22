from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Q
from .models import AuditEvent
from .serializers import AuditEventSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def audit_events_list_view(request):
    search = request.query_params.get('search', '').strip()
    module = request.query_params.get('module', '').strip()
    action = request.query_params.get('action', '').strip()

    events = AuditEvent.objects.all().order_by('-timestamp')

    if search:
        events = events.filter(
            Q(actor_name__icontains=search) |
            Q(description__icontains=search) |
            Q(target_identifier__icontains=search)
        )

    if module and module != 'ALL':
        events = events.filter(module=module)

    if action and action != 'ALL':
        events = events.filter(action_type=action)

    # Return top 100 recent events
    events = events[:100]
    return Response(AuditEventSerializer(events, many=True).data)
