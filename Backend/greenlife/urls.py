from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        'status': 'ONLINE',
        'service': 'GreenLife AI Pharmacy Management System Backend API',
        'version': '1.0.0-rc',
        'database': 'PostgreSQL 16 (Authoritative)',
        'timestamp': None
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def root_view(request):
    return Response({
        'service': 'GreenLife AI Pharmacy Management System Backend API',
        'status': 'ONLINE',
        'frontend_url': 'http://localhost:5173',
        'admin_portal': '/admin/',
        'health_check': '/api/v1/health/',
        'endpoints': {
            'auth': '/api/v1/auth/',
            'admin': '/api/v1/admin/',
            'audit': '/api/v1/audit/',
            'catalogue': '/api/v1/catalogue/',
            'parties': '/api/v1/parties/',
            'inventory': '/api/v1/inventory/',
            'procurement': '/api/v1/procurement/',
            'sales': '/api/v1/sales/',
            'finance': '/api/v1/finance/',
            'reports': '/api/v1/reports/',
        }
    })

urlpatterns = [
    path('', root_view, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='health-check'),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/admin/', include('apps.administration.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
    path('api/v1/catalogue/', include('apps.catalogue.urls')),
    path('api/v1/parties/', include('apps.parties.urls')),
    path('api/v1/inventory/', include('apps.inventory.urls')),
    path('api/v1/procurement/', include('apps.procurement.urls')),
    path('api/v1/sales/', include('apps.sales.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
]
