from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, DosageFormViewSet, UnitOfMeasureViewSet,
    DosagePresetViewSet, ProductViewSet, ProductPackagingUnitViewSet,
    StockAlertRuleViewSet, download_import_template,
    preview_bulk_import, commit_bulk_import
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'dosage-forms', DosageFormViewSet)
router.register(r'units', UnitOfMeasureViewSet)
router.register(r'dosage-presets', DosagePresetViewSet)
router.register(r'products', ProductViewSet)
router.register(r'packaging-units', ProductPackagingUnitViewSet)
router.register(r'alert-rules', StockAlertRuleViewSet)

urlpatterns = [
    path('import/template/', download_import_template, name='import-template'),
    path('import/preview/', preview_bulk_import, name='import-preview'),
    path('import/commit/', commit_bulk_import, name='import-commit'),
    path('', include(router.urls)),
]
