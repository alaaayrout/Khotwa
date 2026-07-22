from django.contrib import admin
from django.urls import path, include, re_path
from dj_rest_auth.views import PasswordResetConfirmView
from users.views import api_404_handler
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),

    # Your app's API routes
    path('api/', include('users.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/recommendations/', include('recommendations.urls')),

    path("api/", include("company_profile.urls")),

    # dj-rest-auth routes (password reset etc.)
    path('api/auth/', include('dj_rest_auth.urls')),
    path(
        'api/auth/password/reset/confirm/<str:uidb64>/<str:token>/',
        PasswordResetConfirmView.as_view(),
        name='password_reset_confirm'
    ),
    # allauth (needed for social login / email confirmation)
    path('accounts/', include('allauth.urls')),
     path("api/", include("seeker_profiles.urls")),
     path("api/admin/", include("admin_dashboard.urls")),
     path("api/applications/",include("applications.urls")),

]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


urlpatterns += [
    re_path(r'^.*$', api_404_handler),
]

