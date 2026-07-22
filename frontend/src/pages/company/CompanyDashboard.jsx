import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { API_BASE } from "../../config"
import CompanyLayout from "../../components/company/CompanyLayout"

// ===== Lookup tables (same values used in PostJob.jsx) =====
const JOB_TYPE_LABELS = {
  full_time:  { ar: "دوام كامل", en: "Full Time"  },
  part_time:  { ar: "دوام جزئي", en: "Part Time"  },
  contract:   { ar: "عقد مؤقت",  en: "Contract"   },
  internship: { ar: "تدريب",     en: "Internship" },
  freelance:  { ar: "عمل حر",    en: "Freelance"  },
}

const CITY_LABELS = {
  damascus:       "دمشق",
  aleppo:         "حلب",
  homs:           "حمص",
  latakia:        "اللاذقية",
  tartus:         "طرطوس",
  hama:           "حماة",
  deir_ezzor:     "دير الزور",
  raqqa:          "الرقة",
  suwayda:        "السويداء",
  daraa:          "درعا",
  idlib:          "إدلب",
  hasakah:        "الحسكة",
  quneitra:       "القنيطرة",
  rural_damascus: "ريف دمشق",
}

const QUICK_ACTIONS = [
  { icon: "📋", key: "manage_jobs",     path: "/company/jobs" },
  { icon: "👥", key: "review_apps",     path: "/company/applications" },
  { icon: "🏢", key: "company_profile", path: "/company/profile" },
]

// ── helper: days left until expires_at ───────────────────
function daysLeft(expiresAt) {
  if (!expiresAt) return null
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  return Math.max(Math.ceil(diffMs / 86400000), 0)
}

// ── هل الوظيفة نشطة؟ (status = open, is_active = true, ولسا ما انتهت مدتها) ─
function isJobActive(job) {
  // TODO(Farah): عدّلي هون لو أسماء/قيم الحقول مختلفة عن الـ response الفعلي
  if (job.status && job.status !== "open") return false
  if (job.is_active === false) return false
  if (job.expires_at) {
    const left = daysLeft(job.expires_at)
    if (left !== null && left <= 0) return false
  }
  return true
}

export default function CompanyDashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = i18n.language === "ar"

  const [jobs, setJobs]       = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // ── جلب وظائف الشركة من الباك إند ─────────────────────
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE}/jobs/company/jobs/`, {
          headers: { "Authorization": `CompanyToken ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setJobs(Array.isArray(data) ? data : data.results || [])
        } else {
          const text = await res.text()
          setError(text)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE}/jobs/company/jobs/applications/`, {
          headers: { Authorization: `CompanyToken ${token}` },
        })

        if (res.ok) {
          const data = await res.json()
          setApplications(Array.isArray(data) ? data : data.results || [])
        } else {
          setApplications([])
        }
      } catch (err) {
        setApplications([])
      }
    }

    fetchJobs()
    fetchApplications()
  }, [])

  // ===== وظائف نشطة فقط (بعيد المنتهية والمغلقة) =====
  const activeJobs = jobs.filter(isJobActive)

  // ===== Stats مبنية من بيانات الوظائف الحقيقية فقط =====
  // TODO(Farah): total_apps / pending_review / total_views ما إلها endpoint حالياً.
  // خلّيتهن "-" مؤقتاً لحد ما تجهز نقاط النهاية تبع الطلبات (applications).
  const STATS = [
    { key: "active_jobs",    value: activeJobs.length, icon: "💼", bg: "bg-blue-50",   border: "border-blue-100", real: true  },
    { key: "total_apps",     value: "-",          icon: "📩", bg: "bg-violet-50", border: "border-violet-100", real: false },
    { key: "pending_review", value: "-",          icon: "⏳", bg: "bg-amber-50",  border: "border-amber-100", real: false },
    { key: "total_views",    value: "-",          icon: "👁️", bg: "bg-teal-50",   border: "border-teal-100", real: false },
  ]

  return (
    <CompanyLayout>
      <div className="px-8 py-8 space-y-8">

        {/* ===== Header ===== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {t("company.dashboard.title")}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {t("company.dashboard.welcome")}
            </p>
          </div>
          <button
            onClick={() => navigate("/company/dashboard/postJob")}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-sm font-medium rounded-xl transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t("company.dashboard.post_job")}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            {t("company.dashboard.load_error")}: {error}
          </div>
        )}

        {/* ===== Stats ===== */}
        <div className="grid grid-cols-4 gap-4">
          {STATS.map(stat => (
            <div key={stat.key} className={`bg-white border rounded-2xl p-5 ${stat.border}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${stat.bg}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading && stat.real ? "…" : stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t(`company.dashboard.stats.${stat.key}`)}</p>
            </div>
          ))}
        </div>

        {/* ===== Two Columns ===== */}
        <div className="grid grid-cols-5 gap-6">

          <div className="col-span-3 bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-800">
                {t("company.dashboard.recent_apps.title")}
              </h2>
              <button onClick={() => navigate("/company/applications")} className="text-xs text-blue-600 hover:underline">
                {t("company.dashboard.recent_apps.view_all")}
              </button>
            </div>
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="text-3xl mb-3">📩</div>
                <p className="text-sm text-gray-500">
                  {t("company.dashboard.recent_apps.empty")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {applications.slice(0, 5).map(app => (
                  <div key={app.id} className="px-6 py-4 hover:bg-gray-50/50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{app.job_title || "-"}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{app.seeker_name || "-"}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 shrink-0">
                        {app.status || "-"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {app.company_name || "-"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Jobs — مربوطة بـ /api/jobs/company/jobs/ */}
          <div className="col-span-2 bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-800">
                {t("company.dashboard.active_jobs.title")}
              </h2>
              <button onClick={() => navigate("/company/jobs")} className="text-xs text-blue-600 hover:underline">
                {t("company.dashboard.active_jobs.view_all")}
              </button>
            </div>

            {loading && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                {t("company.dashboard.loading")}
              </div>
            )}

            {!loading && activeJobs.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                {t("company.dashboard.active_jobs.empty")}
              </div>
            )}

            <div className="divide-y divide-gray-50">
              {activeJobs.slice(0, 5).map(job => {
                // TODO(Farah): عدّلي أسماء الحقول هون لو مختلفة عن الـ response الفعلي
                const title   = job.title || "-"
                const city    = CITY_LABELS[job.city] || job.city
                const empType = JOB_TYPE_LABELS[job.employment_type]
                const left    = daysLeft(job.expires_at)
                // apps/views مافي إلهن مصدر حقيقي لسا
                const apps    = job.applications_count ?? null
                const views   = job.views_count ?? null

                return (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/company/jobs/${job.id}/applications`)}
                    className="px-6 py-4 hover:bg-gray-50/50 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">{title}</p>
                      <span className="text-xs text-gray-400">
                        {left !== null
                          ? (isAr ? `${left} يوم متبقي` : `${left}d left`)
                          : "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-2.5">
                      <span>{city}{empType ? ` · ${isAr ? empType.ar : empType.en}` : ""}</span>
                    </div>
                    {apps !== null && (
                      <>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-2.5">
                          <span>{apps} {t("company.dashboard.active_jobs.applicants")}</span>
                          {views !== null && <span>{views} {t("company.dashboard.active_jobs.views")}</span>}
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min((apps / 50) * 100, 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* ===== Quick Actions ===== */}
        <div className="grid grid-cols-3 gap-4">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.key}
              onClick={() => navigate(action.path)}
              className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm rounded-2xl p-5 text-start transition group"
            >
              <div className="text-2xl mb-3">{action.icon}</div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition">
                {t(`company.dashboard.quick_actions.${action.key}`)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {t(`company.dashboard.quick_actions.${action.key}_sub`)}
              </p>
            </button>
          ))}
        </div>

      </div>
    </CompanyLayout>
  )
}
