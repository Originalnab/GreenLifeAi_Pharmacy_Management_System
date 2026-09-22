from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse

from .models import (
    Category, DosageForm, UnitOfMeasure, DosagePreset,
    Product, ProductPackagingUnit, StockAlertRule, ImportJob
)
from .serializers import (
    CategorySerializer, DosageFormSerializer, UnitOfMeasureSerializer,
    DosagePresetSerializer, ProductSerializer, ProductPackagingUnitSerializer,
    StockAlertRuleSerializer, ImportJobSerializer
)
from .services import MultiUnitPricingEngine, BulkImportService
from apps.administration.models import Branch

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class DosageFormViewSet(viewsets.ModelViewSet):
    queryset = DosageForm.objects.all().order_by('name')
    serializer_class = DosageFormSerializer
    permission_classes = [AllowAny]

class UnitOfMeasureViewSet(viewsets.ModelViewSet):
    queryset = UnitOfMeasure.objects.all().order_by('name')
    serializer_class = UnitOfMeasureSerializer
    permission_classes = [AllowAny]

class DosagePresetViewSet(viewsets.ModelViewSet):
    queryset = DosagePreset.objects.all().order_by('name')
    serializer_class = DosagePresetSerializer
    permission_classes = [AllowAny]

class ProductPackagingUnitViewSet(viewsets.ModelViewSet):
    queryset = ProductPackagingUnit.objects.all()
    serializer_class = ProductPackagingUnitSerializer
    permission_classes = [AllowAny]

class StockAlertRuleViewSet(viewsets.ModelViewSet):
    queryset = StockAlertRule.objects.all()
    serializer_class = StockAlertRuleSerializer
    permission_classes = [AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related('category', 'dosage_form', 'branch').prefetch_related('packaging_units').order_by('brand_name')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        cat_id = self.request.query_params.get('category')
        if cat_id:
            qs = qs.filter(category_id=cat_id)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(brand_name__icontains=search) | qs.filter(generic_name__icontains=search) | qs.filter(product_code__icontains=search)
        return qs

    def perform_create(self, serializer):
        branch = Branch.objects.first()
        product = serializer.save(branch=branch)
        MultiUnitPricingEngine.sync_packaging_units(product)

    def perform_update(self, serializer):
        product = serializer.save()
        MultiUnitPricingEngine.sync_packaging_units(product)

# --- Bulk Import Wizard Endpoints ---

@api_view(['GET'])
@permission_classes([AllowAny])
def download_import_template(request):
    """Provides downloadable CSV template formatted for pharmaceutical bulk import."""
    csv_data = BulkImportService.get_template_csv()
    response = HttpResponse(csv_data, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="greenlife_catalogue_template.csv"'
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def preview_bulk_import(request):
    """Receives CSV file or text payload, parses validation rules, and generates preview data with auto UUIDs."""
    csv_file = request.FILES.get('file')
    raw_content = None
    
    if csv_file:
        raw_content = csv_file.read().decode('utf-8-sig', errors='ignore')
    elif request.data.get('csv_content'):
        raw_content = request.data.get('csv_content')
    else:
        return Response({'error': 'No CSV file or csv_content provided.'}, status=status.HTTP_400_BAD_REQUEST)

    branch = Branch.objects.first()
    result = BulkImportService.parse_preview(raw_content, branch)
    return Response(result)

@api_view(['POST'])
@permission_classes([AllowAny])
def commit_bulk_import(request):
    """Transactionally commits previewed products and auto-generates packaging tiers."""
    items = request.data.get('items', [])
    if not items:
        return Response({'error': 'No items to commit.'}, status=status.HTTP_400_BAD_REQUEST)

    branch = Branch.objects.first()
    actor = request.user if request.user.is_authenticated else None
    
    try:
        created = BulkImportService.commit_import(items, branch, actor)
        return Response({
            'success': True,
            'imported_count': len(created),
            'message': f"Successfully imported {len(created)} pharmaceutical products into master catalogue."
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
