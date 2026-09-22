from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CashShiftViewSet, SaleViewSet, DraftSaleViewSet,
    SaleReturnViewSet, CustomerCreditNoteViewSet, CreditPaymentViewSet
)

router = DefaultRouter()
router.register(r'shifts', CashShiftViewSet)
router.register(r'orders', SaleViewSet)
router.register(r'drafts', DraftSaleViewSet)
router.register(r'returns', SaleReturnViewSet)
router.register(r'credit-notes', CustomerCreditNoteViewSet)
router.register(r'credit-payments', CreditPaymentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
