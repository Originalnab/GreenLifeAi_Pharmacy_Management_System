from django.urls import path
from .views import audit_events_list_view

urlpatterns = [
    path('events/', audit_events_list_view, name='audit-events-list'),
]
