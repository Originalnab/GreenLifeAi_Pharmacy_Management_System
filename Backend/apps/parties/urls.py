from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, CustomerViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
