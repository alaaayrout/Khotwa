from django.urls import path

from . import views

urlpatterns = [
    path("auth/login/", views.AdminLoginView.as_view()),
    path("seekers/", views.AdminSeekerListView.as_view()),
    path("seekers/<int:pk>/", views.AdminSeekerDetailView.as_view()),

    path("companies/", views.AdminCompanyListView.as_view()),
    path("companies/<int:pk>/", views.AdminCompanyDetailView.as_view()),
    path("companies/<int:pk>/approve/", views.AdminCompanyApproveView.as_view()),
    path("companies/<int:pk>/reject/", views.AdminCompanyRejectView.as_view()),

    path("jobs/", views.AdminJobListView.as_view()),
    path("jobs/<int:pk>/", views.AdminJobDetailView.as_view()),
    path("jobs/<int:pk>/suspend/", views.AdminJobSuspendView.as_view()),
    path("jobs/<int:pk>/activate/", views.AdminJobActivateView.as_view()),

    path("cvs/", views.AdminCVListView.as_view()),
    path("cvs/<int:pk>/", views.AdminCVDetailView.as_view()),

    path("categories/", views.AdminCategoryListCreateView.as_view()),
    path("categories/<int:pk>/", views.AdminCategoryDetailView.as_view()),
]
