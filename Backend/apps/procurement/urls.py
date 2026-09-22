from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseOrderViewSet, GoodsReceiptNoteViewSet

router = DefaultRouter()
router.register(r'orders', PurchaseOrderViewSet)
router.register(r'receipts', GoodsReceiptNoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
