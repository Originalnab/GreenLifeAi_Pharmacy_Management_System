from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExpenseCategoryViewSet, ExpenseViewSet,
    DailyCashUpViewSet, BusinessLoanViewSet
)

router = DefaultRouter()
router.register(r'expense-categories', ExpenseCategoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'cash-ups', DailyCashUpViewSet)
router.register(r'loans', BusinessLoanViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
