from django.urls import path
from .views import (
    login_view, logout_view, lock_screen_view, unlock_screen_view,
    change_password_view, me_profile_view, dismiss_password_notice_view
)

urlpatterns = [
    path('login/', login_view, name='auth-login'),
    path('logout/', logout_view, name='auth-logout'),
    path('lock/', lock_screen_view, name='auth-lock'),
    path('unlock/', unlock_screen_view, name='auth-unlock'),
    path('change-password/', change_password_view, name='auth-change-password'),
    path('me/', me_profile_view, name='auth-me'),
    path('dismiss-notice/', dismiss_password_notice_view, name='auth-dismiss-notice'),
]
