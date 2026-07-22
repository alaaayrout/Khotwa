# Frontend Project Documentation

This frontend is built with React and Vite, using Tailwind CSS for styling and React Router for navigation. It also includes internationalization, animation, API integration, and admin-focused UI components.

## Technologies Used

| Technology | Version | Purpose |
| --- | --- | --- |
| React | 19.2.4 | Core UI library for building the interactive component-based interfaces used throughout the application. |
| React DOM | 19.2.4 | Renders React components into the browser DOM for the client-side experience. |
| Vite | 8.0.1 | Provides the fast development server and production build pipeline for the frontend project. |
| @vitejs/plugin-react | 6.0.1 | Enables React support and Fast Refresh inside the Vite environment. |
| React Router DOM | 7.13.2 | Handles client-side routing for authentication, job browsing, company pages, and admin screens. |
| Tailwind CSS | 4.2.2 | Utility-first CSS framework used for responsive layouts and consistent visual styling. |
| @tailwindcss/vite | 4.2.2 | Integrates Tailwind CSS directly with the Vite build tool. |
| Axios | 1.18.1 | Sends HTTP requests to the backend for authentication, profile management, and job-related APIs. |
| Framer Motion | 12.42.2 | Adds animation and motion effects for transitions and interactive UI moments. |
| i18next | 26.0.6 | Provides the core internationalization framework for managing translations and locales. |
| react-i18next | 17.0.4 | Connects i18next with React components so the UI can render translated content. |
| lucide-react | 1.25.0 | Supplies the icon set used in navigation and admin action buttons. |
| Web Storage API (localStorage) | Built-in | Stores authentication tokens and UI state such as company information in the browser for persistence across sessions. |
| FormData API | Built-in | Builds multipart payloads for file uploads such as CV and profile image submission. |
| Intl API | Built-in | Formats localized country names and display values in the phone number selection experience. |
| Vite Environment Variables | Built-in | Loads runtime API configuration through import.meta.env.VITE_API_URL for backend connectivity. |
| React Custom Hooks | N/A | Encapsulates reusable logic such as admin list fetching and state management in custom hook modules. |
| ESLint | 9.39.4 | Enforces coding standards and catches common issues during development. |
| eslint-plugin-react-hooks | 7.0.1 | Adds React Hooks linting rules to improve component correctness and reliability. |
| eslint-plugin-react-refresh | 0.5.2 | Supports Vite React Fast Refresh compatibility and helps prevent stale refresh issues. |

## Project Structure

```text
frontend/
├── index.html
├── package.json
├── vite.config.js
├── public/
├── scripts/
└── src/
    ├── App.jsx
    ├── App.css
    ├── index.css
    ├── main.jsx
    ├── config.js
    ├── i18n.js
    ├── api/
    │   ├── auth.js
    │   └── seekerProfile.js
    ├── assets/
    ├── components/
    │   ├── Navbar.jsx
    │   ├── CountryCodeSelect.jsx
    │   ├── admin/
    │   └── company/
    ├── locales/
    │   ├── ar/
    │   └── en/
    ├── pages/
    │   ├── admin/
    │   ├── company/
    │   ├── seeker/
    │   ├── Home.jsx
    │   ├── JobListings.jsx
    │   └── ...
    ├── services/
    │   └── adminApi.js
    └── utils/
        ├── styles.js
        └── validation.js
```

### Folder Responsibilities

| Folder/File | Description |
| --- | --- |
| src/pages | Contains the main route-level screens for the application, including the home page, authentication pages, job listings, company dashboards, seeker profile, and admin pages. |
| src/pages/admin | Houses the admin-specific interfaces and the shared admin list hook used for managing seekers, companies, jobs, CVs, and categories. |
| src/pages/company | Contains company-focused screens such as dashboard, job posting, company profile, and company job management. |
| src/pages/seeker | Holds the seeker profile experience and related UI for updating personal information and portfolio data. |
| src/components | Stores reusable UI elements that are shared across pages, such as the navigation bar, language toggle, country code selector, and company/admin layout components. |
| src/components/admin | Provides reusable admin UI building blocks like confirmation modal, data table, and status badge. |
| src/components/company | Contains shared layout components specific to the company dashboard experience. |
| src/api | Provides lightweight API modules for authentication and seeker profile operations using Axios. These modules act as the frontend’s integration layer with the backend. |
| src/services | Contains the admin service layer, mainly built around fetch-based requests for administrative operations. |
| src/utils | Includes helper modules for input validation and shared styling classes used throughout forms and UI components. |
| src/locales | Stores translation resources for Arabic and English, enabling internationalization across the application. |
| src/assets | Contains static images and visual assets used by the interface. |
| src/config.js | Centralizes the backend API base URL from environment variables. |
| src/App.jsx | Defines the application routing structure using React Router and connects the main pages. |
| src/main.jsx | Acts as the application entry point, initializes React, enables routing, and mounts the app into the root DOM element. |
| src/i18n.js | Configures the internationalization setup for the project, including language resources and default language. |
| vite.config.js | Configures Vite, React integration, Tailwind support, and the development proxy for API calls. |
| public | Stores static files that are served directly by the app without bundling. |
| scripts | Contains helper scripts used for frontend maintenance or project automation tasks. |

### Relationship Between Folders

The frontend follows a clear separation of concerns:

- Pages are responsible for route-level user experiences and compose reusable UI from the components folder.
- Components provide reusable visual blocks such as navigation, forms, and layout wrappers.
- API modules in the api folder handle backend requests for authentication and seeker-related features.
- The services folder contains the admin API layer for backend operations that are separate from the main auth/profile APIs.
- Utility modules in utils support validation and styling across forms and shared components.
- Localization files in locales are consumed by pages and components to provide Arabic and English interfaces.
- The app entry files, App.jsx and main.jsx, wire the entire structure together by defining routes and mounting the UI.

There is no dedicated hooks folder in the current structure; instead, reusable logic is implemented as custom hooks in the admin pages area, such as useAdminList.js.

## Application Routing

The frontend uses React Router through BrowserRouter in the application entry point and route declarations in App.jsx. Navigation between pages is handled using Route definitions for static and dynamic paths, while Link, NavLink, and useNavigate are used inside the UI to move between screens.

| Route | Component/Page | Description | Access |
| --- | --- | --- | --- |
| / | Home | Main landing page of the platform | Public |
| /login | Login | Authentication page for existing users | Public |
| /signup | Signup | General sign-up entry page | Public |
| /signup/seeker | SeekerSignup | Registration form for job seekers | Public |
| /signup/company | CompanySignup | Registration form for companies | Public |
| /forgot-password | ForgotPassword | Password recovery request page | Public |
| /reset-password/:uidb64/:token | ResetPassword | Password reset page using a token received by email | Public |
| /otp | OtpVerification | OTP verification step during account flow | Public |
| /pending | PendingApproval | Status page for users waiting for approval | Public / role-based status |
| /company/pending | PendingApproval | Approval status page for companies | Role-based (company) |
| /company/dashboard | CompanyDashboard | Main dashboard for company accounts | Role-based (company) |
| /company/dashboard/postJob | PostJob | Page for creating a new job posting | Role-based (company) |
| /company/profile | CompanyProfile | Company profile management page | Role-based (company) |
| /company/jobs | CompanyJobs | Page for viewing and managing company job postings | Role-based (company) |
| /company/jobs/:id/edit | PostJob | Page used to edit an existing job posting | Role-based (company) |
| /seeker/profile | SeekerProfile | Profile and portfolio management page for job seekers | Role-based (seeker) |
| /jobs | JobListings | Page for browsing job listings | Public |
| /jobs/:id | JobDetails | Detailed view of a specific job posting | Public |
| /companies | Companies | Page for browsing registered companies | Public |
| /about | About | Informational page about the platform | Public |
| /admin/* | AdminLayout | Admin layout shell for the administrator area | Role-based (admin) |
| /admin/seekers | AdminSeekers | Admin page for managing seekers | Role-based (admin) |

The current routing configuration does not define explicit route guards in App.jsx. Instead, access is implied by the URL structure and the role-specific pages available in the application.

## API Communication

### Communication Method

The frontend communicates with the backend through browser-based HTTP requests issued from React components and pages. In the current implementation, the client uses two main approaches:

- Axios is used in the dedicated API modules under src/api for authentication and seeker-profile operations.
- The native fetch API is used directly in many page-level components for job listings, authentication flows, company dashboards, and profile management.

These requests are sent to the backend using the configured API base URL and, when needed, include role-specific authorization headers.

### API Layer Structure

The API-related logic is organized into separate frontend layers:

- src/api contains reusable request modules such as auth.js and seekerProfile.js. These modules centralize request creation for common authentication and profile-related workflows.
- src/services contains adminApi.js, which provides a separate service layer for admin-specific operations using fetch-based requests.
- src/config.js defines the shared API base URL through the VITE_API_URL environment variable.
- Page components and UI modules call these modules or use fetch directly when they need data from the backend.

This structure keeps backend calls separated from the visual components and makes the frontend easier to maintain.

### Request Handling

Frontend request handling is primarily asynchronous and follows a consistent pattern:

- Requests are triggered inside useEffect, event handlers, or form submission logic.
- Responses are parsed as JSON when available, or read as text for error handling.
- Success responses update component state, while failed requests are captured in local error state and displayed to the user.
- Authentication data is stored in localStorage and attached to requests through Authorization headers. The frontend uses prefixes such as CompanyToken, JobSeekerToken, and AdminToken depending on the user role.

This approach allows the UI to respond dynamically to loading, success, and error states while preserving session information across pages.

### File Upload Handling

The frontend supports file uploads for profile-related content using FormData. This is used for:

- CV upload in the seeker profile flow.
- Profile picture upload in both seeker and company profile flows.

In the Axios-based modules, FormData is created and submitted with multipart content, while the fetch-based implementations also send FormData without manually setting the Content-Type header. This allows the browser to generate the correct multipart boundary automatically.

## Authentication & Authorization Flow

### Authentication Process

The frontend authentication flow begins with the user choosing an account type during sign-up. From the signup page, the user is directed to either the seeker registration form or the company registration form. The seeker registration flow collects personal information, sends the registration request, and then moves the user through an OTP verification step before showing a success screen that redirects them to the login page. The company registration flow follows a similar path, but after successful OTP verification it redirects the user to the company pending approval page.

For login, the user submits an email and password on the login page. On success, the application stores a token in localStorage and redirects the user based on the returned user type. Company accounts are redirected to the company dashboard, while job seeker accounts are redirected to the home page. The frontend also supports Google login through a separate authentication request that stores the same token and follows the same redirect logic.

### Token Management

Authentication tokens are managed on the frontend through browser localStorage. The main application stores the current user token under the key token after a successful login or Google login. This token is later read from localStorage and attached to protected requests through Authorization headers.

In addition, the admin service layer uses a separate key named admin_token for admin-related requests. The frontend reads this value and includes it in Authorization headers using the AdminToken prefix. There is no central authentication context or state manager in the current implementation; token handling is performed directly in page components and service modules.

### Role-Based Access

The frontend distinguishes between three main user roles through route structure and navigation behavior:

- Seeker users are directed to the public/home experience after login and can access the seeker profile page at /seeker/profile.
- Company users are redirected to the company area through routes such as /company/dashboard, /company/profile, and /company/jobs.
- Admin users access the admin-specific area through the /admin/* route structure and the admin layout interface.

The role-based experience is reflected in the UI through different layouts and navigation menus. For example, the company layout provides company-specific navigation links, while the admin layout provides an admin sidebar. However, the current implementation does not include a dedicated protected-route guard component in App.jsx; access is primarily organized through route paths and page-level navigation.

### Logout Process

Logout is implemented directly in the navigation components. When the user logs out, the frontend removes the token from localStorage and redirects the user to the home page. This behavior is currently implemented in the main navbar and the company layout. No additional session clearing or token refresh mechanism is implemented in the current frontend code.

## Components & Reusable UI

### Component Organization

The frontend component architecture is organized around two main levels:

- Reusable UI components stored in src/components, which provide shared building blocks used across multiple pages.
- Page-specific components located under src/pages, which implement route-level screens and contain the business logic and layout for each user experience.

This separation helps keep the application modular: shared components handle common presentation needs, while page components focus on the user flow for a specific feature.

### Shared Components

| Component | Location | Purpose |
| --- | --- | --- |
| Navbar | src/components/Navbar.jsx | Main navigation bar used across public pages such as Home, JobListings, Companies, and About. |
| LangToggle | src/components/LangToggle.jsx | Reusable language switcher used in authentication and other pages for Arabic/English toggling. |
| EyeIcon | src/components/EyeIcon.jsx | Shared password visibility toggle icon used in login and signup forms. |
| CountryCodeSelect | src/components/CountryCodeSelect.jsx | Reusable country-code selector used in signup forms for phone number input. |
| CompanyLayout | src/components/company/CompanyLayout.jsx | Shared layout wrapper for company pages with sidebar navigation and branding. |
| DataTable | src/components/admin/DataTable.jsx | Generic table component used by admin pages to display lists of seekers, companies, jobs, and CVs. |
| ConfirmModal | src/components/admin/ConfirmModal.jsx | Reusable confirmation dialog for admin actions such as delete, approve, or reject. |
| StatusBadge | src/components/admin/StatusBadge.jsx | Shared label component for showing statuses such as active, pending, approved, or rejected. |

### Role-Specific Components

| Role | Components | Purpose |
| --- | --- | --- |
| Seeker | SeekerProfile page, Navbar, CountryCodeSelect, EyeIcon | Supports seeker-oriented flows such as profile management, authentication, and navigation. |
| Company | CompanyLayout, CompanyDashboard, CompanyJobs, CompanyProfile, PostJob | Provides the company dashboard experience and company-specific administrative screens. |
| Admin | AdminLayout, DataTable, ConfirmModal, StatusBadge, admin page components | Enables reusable admin dashboards and list-based management interfaces. |

The use of reusable components improves maintainability by reducing duplication, standardizing the UI structure, and making updates easier across the application. When a shared component changes, the update is automatically reflected in all pages that use it, which improves consistency and reduces development effort.

## Forms & Validation

The frontend relies on controlled React forms for authentication, registration, profile management, and job posting. Most forms keep their state locally with useState and update the UI immediately as the user types, submits, or receives server feedback.

### Form Patterns in the Application

The project uses several form patterns depending on the complexity of the workflow:

- Simple forms such as login, forgot password, and reset password rely on a compact local state object and a submit handler that validates the fields before sending a request.
- Multi-step registration flows for seekers and companies use step-based state, OTP input handling, resend cooldown timers, and inline field errors.
- Profile and job management forms such as seeker profile, company profile, and post job use controlled inputs, dropdowns, and error state mapping for both frontend and backend validation.
- File-based forms use FormData for multipart submissions, especially for CV upload and profile image upload.

### Validation Strategy

Validation is handled in two layers:

1. Frontend validation for basic input correctness and user experience.
2. Backend error mapping so server-side validation messages can be displayed directly in the form.

The shared validation utilities in src/utils/validation.js provide reusable helpers for:

- Full name sanitization and formatting.
- Phone number sanitization and length checking.
- Email format validation.
- Password length validation.
- Password confirmation matching.

These helpers are used by the authentication and signup screens to prevent malformed input before submission.

### Error Handling and User Feedback

Forms provide clear feedback through several patterns:

- Inline validation messages appear underneath the relevant field when a required or malformed value is entered.
- Global error banners are used for network failures and submission issues.
- Success states are shown for OTP verification and password reset completion.
- Password visibility toggles are implemented through the reusable EyeIcon component.

### OTP and Multi-Step Flow Handling

The seeker and company registration flows include a dedicated OTP verification step. These forms manage:

- A six-digit OTP input grid.
- Keyboard navigation and paste support for the OTP fields.
- A countdown-based resend mechanism.
- Conditional rendering between the registration form, OTP form, and success state.

### Examples of Main Form Flows

| Form | Main Features | Validation Approach |
| --- | --- | --- |
| Login | Email/password fields, password visibility toggle, API submission | Required-field checks and backend error display |
| Seeker Signup | Full name, email, phone, password, confirm password, OTP verification | Shared validation helpers plus field-level backend error mapping |
| Company Signup | Company details, governorate/sector selection, password confirmation, OTP verification | Custom field validation and mapped backend errors |
| Forgot Password / Reset Password | Email validation and password reset token validation | Email format checks, password length checks, mismatch handling |
| Seeker/Company Profile | Editable profile fields and file uploads | Controlled inputs with inline validation and multipart submission |
| Post Job | Job details, specialization selection, date selection, backend validation | Required-field validation and server-side error mapping |

Overall, the frontend’s form system is designed to be user-friendly, localized, and easy to maintain by keeping validation logic reusable and separating presentation from submission behavior.

## Internationalization (i18n)

### Implementation

The frontend uses i18next together with react-i18next for internationalization. The setup is centralized in [frontend/src/i18n.js](frontend/src/i18n.js), where the library is initialized, the translation resources are registered, Arabic is set as the default language, and English is configured as the fallback language.

Translated content is consumed directly inside React components through the useTranslation hook. This approach is used across pages and shared UI components such as the navbar, auth screens, company dashboard layouts, admin interfaces, and the about page.

### Translation Structure

Translation resources are organized as JSON files under [frontend/src/locales](frontend/src/locales):

- [frontend/src/locales/ar/translation.json](frontend/src/locales/ar/translation.json) for Arabic strings
- [frontend/src/locales/en/translation.json](frontend/src/locales/en/translation.json) for English strings

The translation files are grouped by feature or page area rather than by a single global file. In practice, the app uses keys such as navbar, company.layout, seeker_signup, about, and login, which keeps the content modular and easier to maintain.

### Language Switching

Users switch languages through dedicated UI controls such as the reusable language toggle component in [frontend/src/components/LangToggle.jsx](frontend/src/components/LangToggle.jsx), and through inline language buttons in the navbar and other page-level layouts. These controls call i18n.changeLanguage(...) to switch the active locale dynamically.

The selected language is also reflected in the UI through the current i18n.language value, which components use to decide how to render labels, buttons, and direction-aware layout behavior.

### RTL/LTR Support

RTL and LTR behavior is handled in a component-aware way. The app updates the document root direction in [frontend/src/App.jsx](frontend/src/App.jsx) based on the active language, so the HTML document direction stays in sync with the selected locale.

Several pages and layout components also set their own container direction explicitly using values such as rtl or ltr, and some layouts adjust alignment or sidebar positioning accordingly. For example, the company layout uses the active language to switch the sidebar position and navigation direction, while profile and authentication views often use the current language to control text alignment.

In short, the frontend implements bilingual support with Arabic as the default language, English as the fallback, and direction-aware rendering for RTL and LTR interfaces.
