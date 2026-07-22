from django.urls import path
from .views import (
    home,
    get_choices,
    job_seeker_register,
    verify_otp,
    company_verify_otp,
    company_register,
    google_login,
    login_user,
    password_reset_request,
    password_reset_validate,
    password_reset_confirm,
    JobSeekerCountView,
)
 
urlpatterns = [
    path("", home, name="home"),
    path("choices/", get_choices, name="get_choices"),

    path("auth/job-seeker/register/", job_seeker_register, name="job_seeker_register"),
    path("auth/job-seeker/verify-otp/", verify_otp, name="verify_otp"),
   
    path("auth/login/", login_user, name="login_user"),

    path("auth/company/register/", company_register, name="company_register"),
    path("auth/company/verify-otp/", company_verify_otp, name="company_verify_otp"),
    path("auth/google/login/", google_login, name="google_login"),

    path("auth/password/reset/", password_reset_request, name="password_reset_request"),
    path("auth/password/reset/validate/", password_reset_validate, name="password_reset_validate"),
    path("auth/password/reset/confirm/", password_reset_confirm, name="password_reset_confirm"),
    path("jobseekers/count/", JobSeekerCountView.as_view()),

]
