// src/services/adminApi.js
//
// محدّث حسب authentication.py الحقيقي (admin_dashboard app):
// الهيدر شكله Authorization: Token <key>  (مش AdminToken متل ما كان مفترض قبل).
// التوكن نفسه لسا لازم ينحط يدوياً بالـ localStorage تحت مفتاح "admin_token"
// لحتى نبني صفحة admin login (ما في UI تسجيل دخول للأدمن لهلق، بس create_admin
// عالترمينال عم يطلع توكن جاهز — حطيه مؤقتاً هيك من الـ console:
//   localStorage.setItem("admin_token", "PASTE_TOKEN_HERE")

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const TOKEN_STORAGE_KEY = "admin_token";
const AUTH_HEADER_PREFIX = "Token";

function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `${AUTH_HEADER_PREFIX} ${token}` } : {};
}

async function request(path, { method = "GET", body, params } = {}) {
  let url = `${API_BASE}${path}`;

  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null)
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ممكن الرد يكون فاضي (204 مثلاً) وهاد طبيعي
  }

  if (!res.ok) {
    const error = new Error("API_ERROR");
    error.status = res.status;
    error.data = data; // بيانات الخطأ الفعلية من DRF (رح تفيدك بالفورمات)
    throw error;
  }

  return data;
}

/* ---------------------------- 1) Job Seekers ---------------------------- */
export const seekersApi = {
  list: (params) => request("/admin/seekers/", { params }),
  // params مقترحة: { search, is_active, page, page_size }
  delete: (id) => request(`/admin/seekers/${id}/`, { method: "DELETE" }),
  toggleActive: (id, is_active) =>
    request(`/admin/seekers/${id}/`, { method: "PATCH", body: { is_active } }),
};

/* ------------------------------ 2) Companies ----------------------------- */
export const companiesApi = {
  list: (params) => request("/admin/companies/", { params }),
  // params مقترحة: { search, status: 'pending' | 'approved' | 'rejected', page }
  approve: (id) => request(`/admin/companies/${id}/approve/`, { method: "POST" }),
  reject: (id, reason) =>
    request(`/admin/companies/${id}/reject/`, { method: "POST", body: { reason } }),
  delete: (id) => request(`/admin/companies/${id}/`, { method: "DELETE" }),
};

/* --------------------------------- 3) Jobs -------------------------------- */
export const jobsApi = {
  list: (params) => request("/admin/jobs/", { params }),
  // params مقترحة: { search, status, company, page }
  get: (id) => request(`/admin/jobs/${id}/`),
  update: (id, payload) => request(`/admin/jobs/${id}/`, { method: "PATCH", body: payload }),
  suspend: (id) => request(`/admin/jobs/${id}/suspend/`, { method: "POST" }),
  activate: (id) => request(`/admin/jobs/${id}/activate/`, { method: "POST" }),
  // الحذف هلق إلزامي معه "reason" (سجل تدقيق JobDeletionLog بالباك اند)
  delete: (id, reason) => request(`/admin/jobs/${id}/`, { method: "DELETE", body: { reason } }),
};

/* ---------------------------------- 4) CVs -------------------------------- */
export const cvsApi = {
  list: (params) => request("/admin/cvs/", { params }),
  // params مقترحة: { search, seeker, page }
  delete: (id) => request(`/admin/cvs/${id}/`, { method: "DELETE" }),
};

/* ------------------------------ 5) Categories ----------------------------- */
export const categoriesApi = {
  list: () => request("/admin/categories/"),
  create: (payload) => request("/admin/categories/", { method: "POST", body: payload }),
  update: (id, payload) =>
    request(`/admin/categories/${id}/`, { method: "PATCH", body: payload }),
  delete: (id) => request(`/admin/categories/${id}/`, { method: "DELETE" }),
};