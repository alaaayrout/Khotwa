import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { API_BASE } from "../../config"
import CompanyLayout from "../../components/company/CompanyLayout"

// ===== Lookup tables (same values used in PostJob.jsx / CompanyDashboard.jsx) =====
// TODO(Farah): لما توصلي لمرحلة استخراج shared components، انقلي هاد الجدولين مع GOVERNORATES
// لملف constants/ مشترك بدل ما يتكرروا بكل صفحة
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

const STATUS_TABS = ["all", "active", "closed", "expired"]

function daysLeft(expiresAt) {
  if (!expiresAt) return null
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  return Math.max(Math.ceil(diffMs / 86400000), 0)
}

// ── تحديد حالة الوظيفة: active / closed / expired ─────────
function getJobStatus(job) {
  // TODO(Farah): عدّلي هون لو أسماء/قيم الحقول (status, is_active) مختلفة عن الـ response الفعلي
  if (job.status && job.status !== "open") return "closed"
  if (job.is_active === false) return "closed"
  if (job.expires_at) {
    const left = daysLeft(job.expires_at)
    if (left !== null && left <= 0) return "expired"
  }
  return "active"
}

const STATUS_STYLES = {
  active:  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  closed:  { bg: "bg-gray-100",   text: "text-gray-500",    dot: "bg-gray-400"    },
  expired: { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500"     },
}

// ===== Icons (inline SVG, نفس ستايل زر + الموجود بالداشبورد) =====
const IconEye = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconEdit = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/>
  </svg>
)
const IconPause = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>
)
const IconPlay = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 4v16l14-8L6 4Z"/>
  </svg>
)
const IconTrash = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
)
const IconSearch = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
  </svg>
)
const IconPlus = (props) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

export default function CompanyJobs() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = i18n.language === "ar"

  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch]       = useState("")

  const [actionError, setActionError]   = useState(null)
  const [busyId, setBusyId]             = useState(null)   // job id لعملية جارية عليه
  const [deleteTarget, setDeleteTarget] = useState(null)    // الوظيفة اللي بننتظر تأكيد حذفها

  // ── جلب وظائف الشركة ─────────────────────────────────────
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE}/jobs/company/jobs/`, {
          headers: { Authorization: `CompanyToken ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          // TODO(Farah): نفس ملاحظة الداشبورد - تأكدي هل response array مباشر أو {results: [...]}
          setJobs(Array.isArray(data) ? data : data.results || [])
        } else {
          setError(await res.text())
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const jobsWithStatus = useMemo(
    () => jobs.map(job => ({ ...job, _status: getJobStatus(job) })),
    [jobs]
  )

  const counts = useMemo(() => ({
    all:     jobsWithStatus.length,
    active:  jobsWithStatus.filter(j => j._status === "active").length,
    closed:  jobsWithStatus.filter(j => j._status === "closed").length,
    expired: jobsWithStatus.filter(j => j._status === "expired").length,
  }), [jobsWithStatus])

  const filteredJobs = useMemo(() => {
    return jobsWithStatus.filter(job => {
      if (activeTab !== "all" && job._status !== activeTab) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        if (!(job.title || "").toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [jobsWithStatus, activeTab, search])

  // ── إغلاق / إعادة فتح وظيفة ────────────────────────────────
  // TODO(Farah): تأكدي مع رفيقتك: شو الـ endpoint الصح؟ هل PATCH /jobs/company/jobs/{id}/
  // بحقل is_active كافي، ولا في endpoint مخصص متل /jobs/company/jobs/{id}/close/ ؟
  const handleToggleStatus = async (job) => {
    setActionError(null)
    setBusyId(job.id)
    const reactivating = job._status !== "active"
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE}/jobs/company/jobs/${job.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `CompanyToken ${token}`,
        },
        body: JSON.stringify({ is_active: reactivating }),
      })
      if (res.ok) {
        const updated = await res.json()
        setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, ...updated } : j)))
      } else {
        setActionError(await res.text())
      }
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  // ── حذف وظيفة ──────────────────────────────────────────────
  // TODO(Farah): تأكدي إذا في DELETE endpoint فعلي، أو إذا المفروض "أرشفة" بدل حذف نهائي
  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionError(null)
    setBusyId(deleteTarget.id)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE}/jobs/company/jobs/${deleteTarget.id}/`, {
        method: "DELETE",
        headers: { Authorization: `CompanyToken ${token}` },
      })
      if (res.ok || res.status === 204) {
        setJobs(prev => prev.filter(j => j.id !== deleteTarget.id))
        setDeleteTarget(null)
      } else {
        setActionError(await res.text())
      }
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <CompanyLayout>
      <div className="px-8 py-8 space-y-6">

        {/* ===== Header ===== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {t("company.jobs.title")}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {t("company.jobs.subtitle", { count: counts.all })}
            </p>
          </div>
          <button
            onClick={() => navigate("/company/dashboard/postJob")}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-sm font-medium rounded-xl transition"
          >
            <IconPlus />
            {t("company.jobs.post_new")}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            {t("company.jobs.load_error")}: {error}
          </div>
        )}
        {actionError && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
            <span>{t("company.jobs.action_error")}: {actionError}</span>
            <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 px-2">✕</button>
          </div>
        )}

        {/* ===== Tabs + Search ===== */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
            {STATUS_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t(`company.jobs.tabs.${tab}`)} <span className="text-gray-400">({counts[tab]})</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <IconSearch className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-300 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("company.jobs.search_placeholder")}
              className="w-64 ps-9 pe-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
        </div>

        {/* ===== Table ===== */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="px-6 py-14 text-center text-sm text-gray-400">
              {t("company.jobs.loading")}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="text-3xl mb-3">📭</div>
              <p className="text-sm text-gray-500">
                {t("company.jobs.empty")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[13%]" />
                <col className="w-[28%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-400">{t("company.jobs.columns.job")}</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-400">{t("company.jobs.columns.status")}</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-400">{t("company.jobs.columns.applicants")}</th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-gray-400">{t("company.jobs.columns.expires")}</th>
                  <th className="text-end px-6 py-3 text-xs font-medium text-gray-400">{t("company.jobs.columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredJobs.map(job => {
                  const empType = JOB_TYPE_LABELS[job.employment_type]
                  const city    = CITY_LABELS[job.city] || job.city
                  const left    = daysLeft(job.expires_at)
                  const apps    = job.applications_count ?? null
                  const style   = STATUS_STYLES[job._status]
                  const isBusy  = busyId === job.id

                  return (
                    <tr key={job.id} className="hover:bg-gray-50/40 transition">
                      <td className="px-6 py-4 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{job.title || "-"}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {city}{empType ? ` · ${isAr ? empType.ar : empType.en}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {t(`company.jobs.status.${job._status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {apps !== null ? apps : "-"}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {left !== null ? (isAr ? `${left} يوم` : `${left}d`) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title={t("company.jobs.actions.view")}
                            onClick={() => navigate(`/company/jobs/${job.id}/applications`)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <IconEye />
                          </button>
                          <button
                            title={t("company.jobs.actions.edit")}
                            onClick={() => navigate(`/company/jobs/${job.id}/edit`)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <IconEdit />
                          </button>
                          <button
                            title={t(job._status === "active" ? "company.jobs.actions.close" : "company.jobs.actions.reactivate")}
                            disabled={isBusy || job._status === "expired"}
                            onClick={() => handleToggleStatus(job)}
                            className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {job._status === "active" ? <IconPause /> : <IconPlay />}
                          </button>
                          <button
                            title={t("company.jobs.actions.delete")}
                            disabled={isBusy}
                            onClick={() => setDeleteTarget(job)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== Delete confirmation modal ===== */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {t("company.jobs.delete_modal.title")}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {t("company.jobs.delete_modal.body", { title: deleteTarget.title })}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition"
              >
                {t("company.jobs.delete_modal.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={busyId === deleteTarget.id}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50"
              >
                {busyId === deleteTarget.id ? t("company.jobs.delete_modal.deleting") : t("company.jobs.delete_modal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </CompanyLayout>
  )
}
