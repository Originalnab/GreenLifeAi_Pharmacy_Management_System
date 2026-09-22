from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .services import DashboardAnalyticsService
from apps.administration.models import Branch, Organization
from apps.catalogue.models import Product
from apps.authentication.models import User
from apps.inventory.models import Batch
from apps.sales.models import Sale

@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_kpis_view(request):
    branch = Branch.objects.first()
    data = DashboardAnalyticsService.get_dashboard_kpis(branch)
    return Response(data)

@api_view(['GET'])
@permission_classes([AllowAny])
def fast_slow_movers_view(request):
    branch = Branch.objects.first()
    days = int(request.query_params.get('days', 30))
    data = DashboardAnalyticsService.get_fast_slow_movers(branch, days=days)
    return Response(data)

@api_view(['GET'])
@permission_classes([AllowAny])
def expiry_risk_view(request):
    branch = Branch.objects.first()
    data = DashboardAnalyticsService.get_expiry_risk_matrix(branch)
    return Response(data)

@api_view(['GET'])
@permission_classes([AllowAny])
def pnl_summary_view(request):
    branch = Branch.objects.first()
    data = DashboardAnalyticsService.get_pnl_summary(branch)
    return Response(data)

@api_view(['GET'])
@permission_classes([AllowAny])
def launcher_status_view(request):
    branch = Branch.objects.first()
    org = Organization.objects.first()

    return Response({
        'status': 'HEALTHY',
        'database_engine': 'PostgreSQL 16 (Authoritative) with SQLite Fallback',
        'organization': org.trading_name if org else 'Greenlife Health Group',
        'active_branch': branch.name if branch else 'Central Branch',
        'total_products': Product.objects.count(),
        'total_batches': Batch.objects.count(),
        'total_sales': Sale.objects.count(),
        'total_staff_users': User.objects.count(),
        'environment': 'Production / Development Simulation Live'
    })
