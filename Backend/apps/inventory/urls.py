from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BatchViewSet, StockBalanceViewSet,
    StockMovementViewSet, StockAdjustmentViewSet,
    fefo_allocate_view
)

router = DefaultRouter()
router.register(r'batches', BatchViewSet)
router.register(r'balances', StockBalanceViewSet)
router.register(r'movements', StockMovementViewSet)
router.register(r'adjustments', StockAdjustmentViewSet)

urlpatterns = [
    path('fefo-allocate/', fefo_allocate_view, name='fefo-allocate'),
    path('', include(router.urls)),
]
