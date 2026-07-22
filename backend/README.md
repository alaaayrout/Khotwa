# Backend Project Documentation

This backend is built with **Python** and the **Django** framework, leveraging **Django REST Framework (DRF)** to provide robust, secure, and scalable RESTful APIs. It implements a clean architectural pattern with separated business logic, custom multi-role authentication, semantic AI-powered job recommendations, and comprehensive admin controls.

---

## Technologies Used

| Technology | Purpose |
| --- | --- |
| **Python** | Core programming language used to build the entire backend logic and data processing pipelines. |
| **Django** | High-level web framework providing project structure, the built-in ORM for database management, the Django Admin panel, and request-response lifecycle management. |
| **Django REST Framework (DRF)** | Toolkit built on top of Django for creating REST APIs, providing Serializers, authentication classes, and custom error handling. |
| **django-allauth** | Handles external provider integration settings (such as Google authentication flow configuration). |
| **dj-rest-auth** | Provides ready-to-use API endpoints for authentication tasks like registration and password recovery, integrated with DRF and allauth. |
| **sentence-transformers** | Provides pre-trained Transformer models (specifically `paraphrase-multilingual-MiniLM-L12-v2`) to generate semantic embeddings for short texts. |
| **numpy** | Handles numerical arrays and computes Cosine Similarity between vector representations for the recommendation engine. |
| **python-dotenv** | Loads environment variables from a `.env` file to centralize configurations and protect sensitive credentials. |
| **dj-database-url** | Parses the `DATABASE_URL` environment variable to configure Django database settings, allowing seamless switching between SQLite and PostgreSQL. |
| **django-cors-headers** | Manages Cross-Origin Resource Sharing (CORS) policies to allow the frontend application to access the API from a different domain. |
| **dnspython (dns)** | Validates email domain authenticity by checking MX records during input validation. |
| **Pillow** | Handles image processing and validation for profile pictures and storage security. |
| **psycopg2 / pg8000** | Database drivers for PostgreSQL to support production deployment environments. |
| **gunicorn** | WSGI application server used to run the project in production environments. |
| **django-extensions** | Developer utility tools including `shell_plus` and advanced management commands. |
| **Postman** | Used for organizing request collections to manually test and verify API endpoints. |

---

## Project Structure

```text
backend/
├── jobportal/             (project settings, urls, wsgi/asgi)
├── users/
├── jobs/
├── applications/
├── seeker_profiles/
├── company_profile/
├── recommendations/
├── admin_dashboard/
└── postman/

```

### App Responsibilities

| App | Responsibility |
| --- | --- |
| **jobportal** | General project configurations, main URL routing, WSGI/ASGI settings, and static/media files handling. |
| **users** | Custom user model logic, registration workflows, OTP verification, generic serializers, and base authentication tools. |
| **jobs** | Job posting models, categories, public/company-specific job views, and access control permissions. |
| **applications** | `JobApplication` model and endpoints connecting job seekers to the positions they apply for. |
| **seeker_profiles** | Job seeker profiles, CV and image validation, and custom `JobSeekerAuthToken` mechanism. |
| **company_profile** | Endpoints and permissions specifically scoped for company profiles. |
| **recommendations** | Generates text embeddings and serves endpoints calculating personalized job suggestions for each seeker. |
| **admin_dashboard** | Endpoints for the administrative dashboard, such as company account approvals and admin privilege controls. |
| **postman** | Contains Postman collection files used for manual API endpoint testing. |

---

## Architectural Pattern

The backend follows a strict separation of concerns across distinct layers to maintain high testability and clean code organization:

* **Apps:** The system is divided into modular Django apps, each dedicated to a specific domain (users, jobs, applications, recommendations, etc.).
* **Models:** Represents data structures and relationships handled via the Django ORM.
* **Serializers:** Responsible for validating incoming data and serializing models to and from JSON.
* **Views:** Thin presentation layers that receive HTTP requests, coordinate with serializers and services, and return responses.
* **Services:** Dedicated layers containing actual business logic (such as token generation, recommendation algorithms, and OTP handling).
* **Permissions:** Custom rules controlling access rights based on user type and account status.

---

## Database & Models

### Database Management

The project uses the **Django ORM** to manage data via Python models. The database engine is configured dynamically via `DATABASE_URL` using `dj-database-url`:

* **SQLite** is used in local development environments.
* **PostgreSQL** is utilized in production environments.

### Core Models & Relationships

| Model | Description & Relationship |
| --- | --- |
| **CustomUser** | Extends Django's `AbstractUser` to define core user attributes and distinct roles (Job Seeker, Company). |
| **JobSeeker & Company** | Separate models storing role-specific profile data for job seekers and corporate accounts. |
| **SeekerProfile** | One-to-One relationship with `JobSeeker`, containing CVs, profile images, skills, experience, and educational background. |
| **JobPosting** | Foreign Key relationship with `Company`, representing positions published by each corporate entity. |
| **JobApplication** | Foreign Key relationship with both `JobSeeker` and `JobPosting`, secured with a `unique_together` constraint to prevent duplicate applications. |
| **JobSeekerAuthToken** | Custom model storing authentication tokens for job seekers within a dedicated request header. |
| **EmailVerification** | Stores encrypted OTP codes, pending registration payload data, and expiration timestamps with rate-limiting support. |
| **RecommendationSettings** | Caches configurations for the embedding model used within the AI recommendation framework. |

---

## Authentication & Security

### Multi-Role Custom User System

The platform handles three distinct user categories: **Job Seekers**, **Companies**, and **Admins**. Authentication inspects the respective role tables, validates credentials, and confirms account statuses (e.g., active seeker or admin-approved company) before issuing role-scoped tokens.

### Google Login Integration

Supports Google authentication by receiving a Google ID Token, validating it directly against Google verification servers to guarantee email verification and target audience match, and safely binding the session to existing accounts.

### Custom Authentication Classes & Permissions

DRF custom authentication classes read unique authorization headers depending on the user type. Custom permission classes strictly control access:

* `IsJobSeekerAuthenticated`: Restricts endpoints strictly to verified job seekers.
* `IsCompanyAuthenticated`: Restricts access to company profile endpoints.
* `IsApprovedCompany`: Ensures corporate operations (like publishing a job) are executed only after administrative approval.
* `IsAdminUser`: Limits access exclusively to active administrator accounts.

### Email Verification (OTP) & Account Lifecycle

* **OTP Service:** Generates cryptographically secure OTP tokens, encrypts them prior to storage, tracks expiration times, and enforces rate-limiting rules against repeated requests.
* **Account Activation Flow:**
* *Job Seekers:* Accounts are created immediately upon successful OTP validation, granting instant system access.
* *Companies:* Registration payloads are stored as pending records in the verification table. Once OTP verification passes, the profile awaits admin review. Upon admin approval, the official Company record is generated; upon rejection, the request is purged and an email notification is dispatched.



### Password Recovery & Helpers

Provides token-based password reset links sent via email. A shared utility helper safely queries across separate seeker and company models to resolve matching accounts by email address during authentication and recovery routines.

---

## API Architecture & Error Handling

### Endpoints Structure

All API routes are prefixed under `/api/` and organized by application domain:

| Endpoint Path Prefix | App Module | Description |
| --- | --- | --- |
| `/api/auth/` | `users` / `dj-rest-auth` | Authentication and registration operations |
| `/api/jobs/` | `jobs` | Job browsing and management |
| `/api/applications/` | `applications` | Job application submissions and tracking |
| `/api/seeker-profiles/` | `seeker_profiles` | Job seeker portfolio and profile controls |
| `/api/company-profile/` | `company_profile` | Corporate profile management |
| `/api/recommendations/` | `recommendations` | Calculation and retrieval of suggested jobs |
| `/api/admin-dashboard/` | `admin_dashboard` | Administrative dashboard operations |

### Centralized Error Handling

A custom exception handler is bound to REST framework settings to normalize all error responses across every endpoint, ensuring uniform structures for common issues such as 404 lookups and internal server exceptions.

---

## AI Recommendation System

### Pipeline & Technologies

The recommendation engine uses **sentence-transformers** (`paraphrase-multilingual-MiniLM-L12-v2`) and **numpy**:

1. **Text Representation:** Aggregates a seeker's attributes (skills, experience, education) into a unified string, and combines a job's details (title, description, required skills, category, job type) into another.
2. **Semantic Embedding:** Both text bundles are converted into vector representations using the pre-trained transformer model via batch processing to optimize compute efficiency.
3. **Similarity & Ranking:** Computes **Cosine Similarity** between vectors, sorting active job listings in descending order of match percentage, and enriches results with company metadata before returning to the frontend.

---

## Input Validation & File Handling

* **Inputs:** Validates email formats and confirms domain reachability via MX records. Phone numbers must follow strict international formats starting with `+`. Strict password length checks and cross-table email uniqueness validations are enforced.
* **File Uploads:**
* **CVs:** Restricted strictly to PDF format with a maximum size limit of 5 MB.
* **Profile Images:** Accepted formats include JPG, JPEG, and PNG, capped at a maximum size of 2 MB.


## Shared & Modular Components (Backend Architecture)

The backend design divides system logic into cohesive, reusable architectural blocks, utility modules, and role-scoped services. This modular layout prevents code duplication, simplifies maintenance, and ensures uniform behavior across all system endpoints.

### Core Architectural Building Blocks

| Component / Layer | Location / Module | Purpose |
| --- | --- | --- |
| **Custom Auth Classes** | `users/authentication.py` | Scoped token authentication classes (`JobSeekerAuthToken`, Company, Admin) reading from unique request headers. |
| **Permission Classes** | `users/permissions.py` | Role-based and state-based access guards (`IsJobSeekerAuthenticated`, `IsApprovedCompany`, `IsAdminUser`). |
| **OTP Service** | `users/services/otp.py` | Cryptographic OTP generation, encryption, expiration tracking, and rate-limiting enforcement. |
| **Email Service** | `users/services/email.py` | Shared utility handling dynamic transactional emails (verification, status notifications, recovery links). |
| **Recommendation Pipeline** | `recommendations/services.py` | Batch text aggregation, embedding generation via Sentence-Transformers, and Cosine Similarity calculation. |
| **Exception Handler** | `jobportal/exceptions.py` | Centralized exception mapping ensuring uniform JSON error responses across all API endpoints. |

### Role-Specific Backend Modules

| Role / Domain | Core Apps & Services | Purpose |
| --- | --- | --- |
| **Job Seeker** | `users`, `seeker_profiles`, `applications` | Handles seeker registration, portfolio file validation (CV/image), tracking job applications, and personalized recommendations. |
| **Company** | `company_profile`, `jobs` | Manages corporate profiles, multi-step pending approvals, job posting ownership control, and applicant management. |
| **Admin** | `admin_dashboard` | Implements administrative controls for company account approvals/rejections and system-wide data management via Django Admin. |

---

## Forms, Validation & Data Sanitization

The backend utilizes Django REST Framework Serializers alongside native Django validators to enforce strict data integrity before database persistence.

### Validation Strategies & Layers

1. **Serializer-Level Validation:** Ensures incoming JSON payloads match expected field types, structural constraints, and uniqueness rules (such as cross-table email availability checks).
2. **Field-Specific Custom Validators:** Custom logic enforces strict formatting rules for complex data attributes.
3. **Database Constraints:** Relies on unique constraints (e.g., `unique_together` on `JobApplication`) to prevent duplicate records at the storage level.

### Validation Utilities & Rules

| Input / Field | Validation Rules & Sanitization Approach |
| --- | --- |
| **Email Address** | Regex format verification combined with DNS MX record checks to ensure the domain can receive emails. |
| **Phone Number** | Strict international format validation starting with `+` followed by numerical strings within a defined length range. |
| **Password** | Enforces minimum length constraints, rejects empty values, and applies default Django security rules. |
| **Experience / Education** | Requires a valid end date unless marked as current; validates academic years within a logical range ($1950\text{--}2100$). |
| **File Uploads (CV)** | Restricted strictly to PDF format with a maximum size limit of $5\text{ MB}$. |
| **File Uploads (Images)** | Accepted formats include JPG, JPEG, and PNG, capped at a maximum size of $2\text{ MB}$. |

---

## Error Handling and User Feedback

The backend communicates failures and successful operations through structured HTTP status codes and consistent error response formats.

* **Centralized Exception Handler:** Intercepts standard DRF and Django exceptions to return uniform error keys.
* **Validation Error Mapping:** Field-specific errors return descriptive keys mapped directly to form input fields.
* **Http Status Codes:** Standardized usage of status codes ($200\text{ OK}$, $201\text{ Created}$, $400\text{ Bad Request}$, $401\text{ Unauthorized}$, $403\text{ Forbidden}$, $404\text{ Not Found}$).

---

## Authentication & Authorization Flow

### Authentication Process

The backend processes authentication requests by inspecting role-specific records. Credentials are verified against passwords and account statuses (active for job seekers, admin-approved for companies). Upon success, a role-scoped token is issued.

### Token Management & Security Headers

* **Job Seekers:** Uses custom tokens stored in dedicated header structures (`JobSeekerAuthToken`).
* **Companies & Admins:** Uses dedicated authentication headers for session identification.
* **Token Expiration & Security:** Tokens are securely stored and validated per request cycle by custom authentication classes.

### Role-Based Access Control (RBAC)

Access control is enforced via custom permission classes:

* `IsJobSeekerAuthenticated`: Grants access exclusively to verified job seekers.
* `IsCompanyAuthenticated`: Restricts access to company dashboard and profile endpoints.
* `IsApprovedCompany`: Prevents unapproved companies from publishing or editing jobs.
* `IsAdminUser`: Restricts access exclusively to administrative accounts.

### Account Lifecycle & Verification Flow

* **Job Seekers:** Instant account generation and activation upon successful OTP code verification.
* **Companies:** Registration data is stored as a pending verification record. Following OTP confirmation, the account undergoes manual administrative review. Approval creates the official company entry; rejection purges the record and triggers a notification email.