from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Supplier, Customer
from .serializers import SupplierSerializer, CustomerSerializer
from apps.administration.models import Organization, Branch

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        org = Organization.objects.first()
        serializer.save(organization=org)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('name')
    serializer_class = CustomerSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        branch = Branch.objects.first()
        serializer.save(branch=branch)
