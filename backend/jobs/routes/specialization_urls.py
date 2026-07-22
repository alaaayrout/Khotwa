from django.urls import path

from ..views.specialization_views import (
    specialization_list,
    specialization_detail,
    specialization_create,
    specialization_update,
    specialization_delete,
)

urlpatterns = [
    path('', specialization_list, name='specialization_list'),
    path('create/', specialization_create, name='specialization_create'),
    path('<int:pk>/', specialization_detail, name='specialization_detail'),
    path('<int:pk>/update/', specialization_update, name='specialization_update'),
    path('<int:pk>/delete/', specialization_delete, name='specialization_delete'),
]
