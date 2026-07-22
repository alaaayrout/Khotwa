# Frontend Function Documentation

This document lists the functions defined in the frontend codebase and summarizes their purpose.

## frontend/src/App.jsx
- `App()`
  - Root router component.
  - Sets application routes and updates `document.documentElement.dir` when the selected i18n language changes.

## frontend/src/api/auth.js
- `jobSeekerRegister(data)`
  - Sends registration data for job seekers to the backend.
- `jobSeekerLogin(data)`
  - Sends login credentials for job seekers to the backend.
- `companyRegister(data)`
  - Sends registration data for companies to the backend.
- `companyLogin(data)`
  - Sends login credentials for companies to the backend.

## frontend/src/api/seekerProfile.js
- `authHeaders(token)`
  - Builds authenticated request headers for seeker endpoints.
- `getProfile(token)`
  - Fetches the seeker profile.
- `updateProfile(profileData, token)`
  - Updates seeker profile fields.
- `uploadCV(file, token)`
  - Uploads a CV file for the seeker.
- `deleteCV(token)`
  - Deletes the seeker CV.
- `uploadPicture(file, token)`
  - Uploads a seeker profile picture.
- `getSkills(token)`
  - Fetches the seeker skill list.
- `createSkill(name, token)`
  - Creates a new seeker skill.
- `deleteSkill(id, token)`
  - Deletes a seeker skill.
- `getExperience(token)`
  - Fetches seeker experience entries.
- `createExperience(data, token)`
  - Creates a seeker experience entry.
- `updateExperience(id, data, token)`
  - Updates a seeker experience entry.
- `deleteExperience(id, token)`
  - Deletes a seeker experience entry.
- `getEducation(token)`
  - Fetches seeker education entries.
- `createEducation(data, token)`
  - Creates a seeker education entry.
- `updateEducation(id, data, token)`
  - Updates a seeker education entry.
- `deleteEducation(id, data, token)`
  - Deletes a seeker education entry.

## frontend/src/components/company/CompanyLayout.jsx
- `CompanyLayout({ children })`
  - Layout wrapper for company dashboard pages.
  - Renders company sidebar navigation and responsive layout.
- `handleLogout()`
  - Clears auth token and redirects the user to the home page.

## frontend/src/components/CountryCodeSelect.jsx
- `isValidDialCode(code)`
  - Validates phone dial codes against a `+` followed by 1-4 digits.
- `CountryCodeSelect({ value, onChange, className, required })`
  - Displays a localized country-code dropdown.
  - Uses `Intl.DisplayNames` when available.

## frontend/src/components/EyeIcon.jsx
- `EyeIcon({ open })`
  - Renders an eye icon for password visibility toggles.

## frontend/src/components/LangToggle.jsx
- `LangToggle()`
  - Renders a language toggle control.

## frontend/src/components/Navbar.jsx
- `Navbar()`
  - Main navigation bar component used at the top of the app.
  - Shows navigation links, login/logout controls, and language switching.
- `handleLogout()`
  - Clears the auth token from localStorage and navigates to home.

## frontend/src/pages/Companies.jsx
- `getCompanyLogo(job)`
  - Chooses the best available company logo URL from job data.
- `CompanyAvatar({ name, logoUrl, imgSize, rounded, fallbackClassName })`
  - Displays a company logo if available; otherwise falls back to initials.
- `Companies()`
  - Company directory page that fetches jobs and derives companies from them.
- `fetchJobs()`
  - Requests public jobs for company listing data.
- `companies`
  - Memoized derived list of companies and company aggregates.
- `filteredCompanies`
  - Filters companies by search query.

## frontend/src/pages/company/CompanyDashboard.jsx
- `daysLeft(expiresAt)`
  - Computes days remaining until a job expires.
- `isJobActive(job)`
  - Determines whether a job should be considered active.
- `CompanyDashboard()`
  - Company dashboard page that lists company jobs and stats.
- `fetchJobs()`
  - Fetches company jobs from the backend.

## frontend/src/pages/company/CompanyJobs.jsx
- `daysLeft(expiresAt)`
  - Calculates how many days remain before expiration.
- `getJobStatus(job)`
  - Returns the current status label for a job.
- `IconEye(props)`, `IconEdit(props)`, `IconPause(props)`, `IconPlay(props)`, `IconTrash(props)`, `IconSearch(props)`, `IconPlus(props)`
  - Small icon components used in the company jobs table.
- `CompanyJobs()`
  - Company jobs management page.
- `fetchJobs()`
  - Retrieves the company job list.
- `jobsWithStatus`
  - Adds computed status labels to jobs.
- `counts`
  - Computes job counts grouped by status.
- `filteredJobs`
  - Filters jobs by the selected status.
- `handleToggleStatus(job)`
  - Toggles job active/inactive status.
- `handleDelete()`
  - Deletes a selected company job.

## frontend/src/pages/company/CompanyProfile.jsx
- `calcCompletion(form, hasLogo)`
  - Calculates profile completion percentage.
- `parseApiError(rawText)`
  - Parses DRF error response text into field and general errors.
- `CompanyProfile()`
  - Company profile settings page.
- `fetchProfile()`
  - Loads company profile data from the API.
- `handleChange(field)`
  - Returns a change handler for form inputs.
- `handleBeforeUnload()`
  - Prevents navigation if there are unsaved changes.
- `handleSave()`
  - Saves company profile fields to the backend.
- `handleLogoPick(e)`
  - Validates and stages a picked logo file.
- `handleLogoCancel()`
  - Clears the staged logo selection.
- `handleLogoUpload()`
  - Uploads company logo image to the backend.

## frontend/src/pages/company/PostJob.jsx
- `Field({ label, required, error, children })`
  - Reusable input wrapper with label and error text.
- `Section({ title, children })`
  - Reusable card-style section wrapper.
- `PostJob()`
  - Company job creation page.
- `fetchSpecs()`
  - Loads specializations from the backend.
- `set(key, value)`
  - Updates local form data state.
- `validate()`
  - Validates the job form before submission.
- `handleSubmit()`
  - Submits a new job to the backend.
- `labelOf(arr, val)`
  - Resolves a label from a list by value.
- `specLabel(id)`
  - Gets a specialization label from fetched specialization data.

## frontend/src/pages/Home.jsx
- `Counter({ from = 0, to })`
  - Animated counter using Framer Motion.
- `getCompanyLogo(job)`
  - Chooses a company logo URL from available job payload fields.
- `CompanyAvatar({ name, logoUrl, imgSize, rounded, fallbackClassName })`
  - Displays a company logo or initials fallback.
- `Home()`
  - Homepage component.
- `fetchJobs()`
  - Loads latest jobs from the API.
- `fetchSpecializations()`
  - Loads specialization categories from the API.
- `fetchSeekersCount()`
  - Loads job seeker count metric from the API.
- `handleSearch()`
  - Navigates to the jobs listing with search filters.
- `featuredCompanies`
  - Derives featured company data from jobs.
- `totalCompaniesCount`
  - Counts unique companies from the job list.

## frontend/src/pages/JobDetails.jsx
- `JobDetails()`
  - Job detail page.
- `fetchJob()`
  - Loads a single job by ID.
- `handleApply()`
  - Handles the apply action for a job.

## frontend/src/pages/JobListings.jsx
- `FilterPill({ label, active, onClick })`
  - Button pill used to filter by status.
- `SelectFilter({ value, onChange, options, isAr, plainLabels })`
  - Select dropdown for filter options.
- `JobCard({ job, isAr, onClick })`
  - Job card preview component.
- `JobListings()`
  - Job search and listing page.
- `fetchJobs()`
  - Fetches job list data.
- `fetchSpecializations()`
  - Fetches specialization options.
- `specializationOptions`
  - Memoized specialization dropdown options.
- `handleSearch()`
  - Applies the search query.
- `filtered`
  - Frontend-filtered and sorted job list.
- `clearFilters()`
  - Clears active filters and search.

## frontend/src/pages/login.jsx
- `handlePostLoginRedirect(data)`
  - Redirects users after login based on response data.
- `Login()`
  - Login page component.
- `handleSubmit(e)`
  - Handles login form submission.
- `handleGoogleLogin(response)`
  - Handles Google OAuth login response.

## frontend/src/pages/OtpVerification.jsx
- `OtpVerification()`
  - OTP verification page for registration.
- `handleOtpChange(value, idx)`
  - Updates one OTP input digit and advances focus.
- `handleOtpKeyDown(event, idx)`
  - Handles OTP backspace navigation.
- `handleOtpPaste(event)`
  - Handles pasted OTP values.
- `handleSubmit(event)`
  - Submits the OTP verification request.

## frontend/src/pages/PendingApproval.jsx
- `PendingApproval()`
  - Static page displayed while company approval is pending.

## frontend/src/pages/ForgotPassword.jsx
- `ForgotPassword()`
  - Forgot password page.
- `handleSubmit(e)`
  - Sends password-reset email request.

## frontend/src/pages/ResetPassword.jsx
- `ResetPassword()`
  - Password reset page.
- `validateToken()`
  - Validates reset token on load.
- `handleSubmit(e)`
  - Submits the new password.

## frontend/src/pages/SeekerSignup.jsx
- `SeekerSignup()`
  - Job seeker registration page.
- `handleChange(field, value)`
  - Updates registration form values.
- `handleOtpChange(val, idx)`
  - Updates OTP digit and advances focus.
- `handleOtpKeyDown(e, idx)`
  - Handles OTP backspace navigation.
- `handleOtpPaste(e)`
  - Handles OTP paste events.
- `resolveApiError(data, fallback)`
  - Maps backend error codes to translation keys.
- `handleSubmit(e)`
  - Submits seeker registration.
- `handleVerifyOtp(e)`
  - Verifies the seeker OTP.
- `handleResendOtp()`
  - Resends OTP to the user.

## frontend/src/pages/signup.jsx
- `Signup()`
  - Signup selection page.

## frontend/src/pages/company/CompanyJobs.jsx
- `daysLeft(expiresAt)`
  - Calculates remaining days for expiration.
- `getJobStatus(job)`
  - Returns a human-readable job status.
- `IconEye(props)`
  - Eye icon used in action buttons.
- `IconEdit(props)`
  - Edit icon used in action buttons.
- `IconPause(props)`
  - Pause icon used in action buttons.
- `IconPlay(props)`
  - Play icon used in action buttons.
- `IconTrash(props)`
  - Trash icon used in action buttons.
- `IconSearch(props)`
  - Search icon used in action buttons.
- `IconPlus(props)`
  - Plus icon used for add buttons.
- `CompanyJobs()`
  - Company job listings and management page.
- `fetchJobs()`
  - Loads jobs for the company.
- `jobsWithStatus`
  - Adds status metadata to jobs.
- `counts`
  - Counts jobs by status category.
- `filteredJobs`
  - Applies selected filters to company jobs.
- `handleToggleStatus(job)`
  - Toggles active/inactive status on a job.
- `handleDelete()`
  - Deletes the selected job.

## frontend/src/pages/company/CompanyDashboard.jsx
- `daysLeft(expiresAt)`
  - Computes expiration countdown.
- `isJobActive(job)`
  - Returns whether a job should be displayed as active.
- `CompanyDashboard()`
  - Company dashboard overview page.
- `fetchJobs()`
  - Fetches dashboard job data.

## frontend/src/pages/company/CompanyProfile.jsx
- `calcCompletion(form, hasLogo)`
  - Computes company profile completeness.
- `parseApiError(rawText)`
  - Parses DRF error payloads.
- `CompanyProfile()`
  - Company profile editing page.
- `fetchProfile()`
  - Loads the current company profile.
- `handleChange(field)`
  - Creates an input change handler.
- `handleBeforeUnload()`
  - Warns before leaving with unsaved changes.
- `handleSave()`
  - Saves profile edits.
- `handleLogoPick(e)`
  - Picks and validates a new logo file.
- `handleLogoCancel()`
  - Cancels staged logo selection.
- `handleLogoUpload()`
  - Uploads the new company logo.

## frontend/src/pages/company/PostJob.jsx
- `Field()`
  - Reusable input wrapper with label/error state.
- `Section()`
  - Card section wrapper.
- `PostJob()`
  - Company job posting page.
- `fetchSpecs()`
  - Loads specialization options.
- `set(key, value)`
  - Updates form field state.
- `validate()`
  - Validates job posting fields.
- `handleSubmit()`
  - Submits the new job.
- `labelOf(arr, val)`
  - Resolves labels from static option lists.
- `specLabel(id)`
  - Maps specialization ID to label.

## frontend/src/pages/seeker/SeekerProfile.jsx
- `expToApi(d)`
  - Converts local experience form values to API payload.
- `expFromApi(e)`
  - Converts API experience item to local form shape.
- `PlusIcon()`
  - Add icon used in the skill/experience UI.
- `EditIcon()`
  - Edit icon used in entry cards.
- `TrashIcon()`
  - Delete icon used in entry cards.
- `UploadIcon()`
  - Upload icon used for CV/avatar actions.
- `FileIcon()`
  - File icon used for CV preview buttons.
- `SpinIcon()`
  - Loading spinner icon.
- `GlobeIcon()`
  - Globe icon used for location or language badges.
- `CheckIcon()`
  - Check icon used for status indicators.
- `CameraIcon()`
  - Camera icon for avatar upload.
- `Field({ label, required, error, children })`
  - Form field wrapper with label and error text.
- `Panel({ children, action })`
  - Card wrapper used to group profile sections.
- `SkillTag({ label, onRemove })`
  - Renders a skill pill with optional remove button.
- `IconBtn({ onClick, children, danger })`
  - Icon button with optional danger styling.
- `TimelineCard({ top, sub, meta, onEdit, onDelete })`
  - Timeline-style card for experience/education entries.
- `SeekerProfile()`
  - Seeker profile page.
- `toggleLang()`
  - Toggles the application language and direction.
- `asList(data)`
  - Normalizes paginated API results into arrays.
- `fetchProfile()`
  - Loads seeker profile, skills, experience, and education.
- `setField(k, v)`
  - Updates seeker profile fields and clears errors.
- `validate()`
  - Validates mandatory seeker profile fields.
- `handleSave()`
  - Saves seeker profile changes.
- `handleCvFile(file)`
  - Uploads a CV file.
- `removeCv()`
  - Deletes the saved CV.
- `handleAvatarFile(file)`
  - Uploads a seeker profile picture.
- `addSkill()`
  - Adds a new skill.
- `removeSkill(skill)`
  - Removes a skill.
- `saveExp(d)`
  - Saves or updates an experience entry.
- `deleteExp(id)`
  - Deletes an experience entry.
- `saveEdu(d)`
  - Saves or updates an education entry.
- `deleteEdu(id)`
  - Deletes an education entry.
- `Modal({ title, onClose, children })`
  - Modal wrapper for forms.
- `ExpForm({ data, onChange, onSave, onCancel, t })`
  - Experience edit form.
- `EduForm({ data, onChange, onSave, onCancel, t })`
  - Education edit form.
- `ModalActions({ onCancel, onSave, t })`
  - Modal action button row.

## frontend/src/utils/validation.js
- `sanitizeFullName(value)`
  - Removes invalid characters from a full name.
- `sanitizePhoneNumber(value)`
  - Strips non-digits from phone input and limits length.
- `isEmailFormatValid(value)`
  - Validates email syntax.
- `isPasswordLengthValid(value)`
  - Checks minimum password length.
- `doPasswordsMatch(password, confirmPassword)`
  - Verifies password confirmation.
- `getPhoneLengthErrorType(digits)`
  - Returns `min`, `max`, or empty value for phone length validation.
