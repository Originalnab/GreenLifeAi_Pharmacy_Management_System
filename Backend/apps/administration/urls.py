from django.urls import path
from .views import (
    premises_profile_view, storage_locations_view, staff_users_view,
    staff_user_reset_password_view, staff_user_status_view, staff_user_assign_roles_view,
    custom_roles_view, purge_production_data_view
)

urlpatterns = [
    path('profile/', premises_profile_view, name='admin-profile'),
    path('locations/', storage_locations_view, name='admin-locations'),
    path('storage-locations/', storage_locations_view, name='admin-storage-locations'),
    path('users/', staff_users_view, name='admin-users'),
    path('users/<uuid:user_id>/reset-password/', staff_user_reset_password_view, name='admin-user-reset-password'),
    path('users/<uuid:user_id>/status/', staff_user_status_view, name='admin-user-status'),
    path('users/<uuid:user_id>/assign-roles/', staff_user_assign_roles_view, name='admin-user-assign-roles'),
    path('roles/', custom_roles_view, name='admin-roles'),
    path('purge-production-data/', purge_production_data_view, name='admin-purge-production-data'),
]

