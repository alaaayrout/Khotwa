// src/api/companyApplicationsApi.js
import { API_BASE } from "../config"

function authHeaders() {
  const token = localStorage.getItem("token")
  return { Authorization: `CompanyToken ${token}` }
}

export async function fetchCompanyApplications() {
  const res = await fetch(`${API_BASE}/jobs/company/jobs/applications/`, {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : data.results || []
}

// ── قبول / رفض / تحديد كمُراجَع ──────────────────────────────────────────
// مؤكّد من الباك إند: PATCH مباشر على نفس الـ endpoint + { status: "..." }
// القيم المسموحة: "applied" | "reviewed" | "accepted" | "rejected"
export async function updateApplicationStatus(applicationId, status) {
  const res = await fetch(
    `${API_BASE}/jobs/company/jobs/applications/${applicationId}/`,
    {
      method: "PATCH",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }
  return res.json()
}