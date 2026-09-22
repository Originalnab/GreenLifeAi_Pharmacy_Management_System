from django.urls import path
from .views import (
    dashboard_kpis_view, fast_slow_movers_view,
    expiry_risk_view, pnl_summary_view, launcher_status_view
)

urlpatterns = [
    path('dashboard-kpis/', dashboard_kpis_view, name='dashboard-kpis'),
    path('fast-movers/', fast_slow_movers_view, name='fast-movers'),
    path('expiry-risk/', expiry_risk_view, name='expiry-risk'),
    path('pnl/', pnl_summary_view, name='pnl-summary'),
    path('launcher/status/', launcher_status_view, name='launcher-status'),
]
