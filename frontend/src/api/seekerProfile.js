import axios from "axios";
import { API_BASE } from "../config";
// صيغة الـ Authorization مؤكدة من رد الباك إند (WWW-Authenticate: JobSeekerToken)
const AUTH_PREFIX = "JobSeekerToken";

// baseURL نسبي (مش http://127.0.0.1:8000) عشان يمر عبر Vite proxy المضبوط بـ vite.config.js
const api = axios.create({
  baseURL: `${API_BASE}/seeker/`,
});

const authHeaders = (token) => ({
  Authorization: `${AUTH_PREFIX} ${token}`,
});

// ─── Profile ───────────────────────────────────────────────
export const getProfile = (token) =>
  api.get("profile/", { headers: authHeaders(token) });

export const updateProfile = (profileData, token) =>
  api.put("profile/", profileData, { headers: authHeaders(token) });

// ─── CV ────────────────────────────────────────────────────
export const uploadCV = (file, token) => {
  const formData = new FormData();
  formData.append("cv_file", file);
  return api.post("profile/cv/", formData, {
    headers: authHeaders(token),
    // ما منحط Content-Type يدوياً هون - axios بيضيفه لحاله مع الـ boundary الصحيح لـ multipart
  });
};

export const deleteCV = (token) =>
  api.delete("profile/cv/", { headers: authHeaders(token) });

// ─── Profile picture ───────────────────────────────────────
// افترضت اسم الحقل "picture" - تأكدي من الـ serializer عند الزميل قبل التجربة
export const uploadPicture = (file, token) => {
  const formData = new FormData();
  formData.append("profile_picture", file);
  return api.post("profile/picture/", formData, {
    headers: authHeaders(token),
  });
};

// ─── Skills ────────────────────────────────────────────────
// افترضت اسم الحقل "name" - تأكدي من serializers.py عند الزميل أو من الـ DRF Browsable API
export const getSkills = (token) =>
  api.get("skills/", { headers: authHeaders(token) });

export const createSkill = (name, token) =>
  api.post("skills/", { name }, { headers: authHeaders(token) });

export const deleteSkill = (id, token) =>
  api.delete(`skills/${id}/`, { headers: authHeaders(token) });

// ─── Experience ────────────────────────────────────────────
// افترضت نفس أسماء الحقول المستخدمة بالفرونت (title, company, from, to, current)
export const getExperience = (token) =>
  api.get("experience/", { headers: authHeaders(token) });

export const createExperience = (data, token) =>
  api.post("experience/", data, { headers: authHeaders(token) });

export const updateExperience = (id, data, token) =>
  api.patch(`experience/${id}/`, data, { headers: authHeaders(token) });

export const deleteExperience = (id, token) =>
  api.delete(`experience/${id}/`, { headers: authHeaders(token) });

// ─── Education ─────────────────────────────────────────────
// نفس الملاحظة: تأكدي من أسماء الحقول (degree, institution, year)
export const getEducation = (token) =>
  api.get("education/", { headers: authHeaders(token) });

export const createEducation = (data, token) =>
  api.post("education/", data, { headers: authHeaders(token) });

export const updateEducation = (id, data, token) =>
  api.patch(`education/${id}/`, data, { headers: authHeaders(token) });

export const deleteEducation = (id, token) =>
  api.delete(`education/${id}/`, { headers: authHeaders(token) });