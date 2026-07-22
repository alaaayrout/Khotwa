import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import CompanyLayout from "../../components/company/CompanyLayout"
import {
  fetchCompanyApplications,
  updateApplicationStatus,
} from "../../api/companyApplicationsApi"
import {
  groupApplicationsByJob,
  sortApplications,
  getMatchScore,
  getAppliedAt,
  getSeekerEmail,
  formatAppliedDate,
} from "../../utils/applicationsHelpers"

const PAGE_SIZE = 10 // أول عشرة طلبات لكل وظيفة قبل ما نحتاج "عرض الكل"

// ── مؤكّد من الباك إند: القيم المسموحة هي applied / reviewed / accepted / rejected
const STATUS_BADGE = {
  applied: "bg-blue-50 text-blue-700 border-blue-100",
  reviewed: "bg-amber-50 text-amber-700 border-amber-100",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-red-50 text-red-600 border-red-100",
}

// حالات غير نهائية بعدها الطلب "قيد المراجعة" (لسا فيها إمكانية قبول/رفض)
function isOpenStatus(status) {
  return status !== "accepted" && status !== "rejected"
}

function StatusBadge({ status, t }) {
  const cls = STATUS_BADGE[status] || STATUS_BADGE.applied
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${cls}`}>
      {t(`company.applications.status.${status}`)}
    </span>
  )
}

function MatchScorePill({ score, t }) {
  if (score === null) {
    return (
      <span
        className="text-xs text-gray-300"
        title={t("company.applications.match_unavailable_tooltip")}
      >
        —
      </span>
    )
  }
  const color =
    score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-gray-400"
  return (
    <span
      className={`text-xs font-semibold ${color}`}
      title={t("company.applications.match_method_tooltip")}
    >
      {t("company.applications.match_value", { score })}
    </span>
  )
}

// ===== صف طلب واحد =====
function ApplicationRow({ app, isAr, t, onAccept, onReject, onMarkReviewed, busy }) {
  const status = app.status || "applied"
  const score = getMatchScore(app)
  const seekerEmail = getSeekerEmail(app)

  return (
    <div className="px-6 py-4 hover:bg-gray-50/50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {app.seeker_name || "-"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400">
              {formatAppliedDate(getAppliedAt(app), isAr)}
            </p>
            <span className="text-gray-200">·</span>
            <MatchScorePill score={score} t={t} />
          </div>
        </div>
        <StatusBadge status={status} t={t} />
      </div>

      {/* ===== إجراءات ===== */}
      <div className="flex items-center gap-2 mt-3">
        {isOpenStatus(status) && (
          <>
            <button
              disabled={busy}
              onClick={() => onAccept(app)}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
            >
              {t("company.applications.accept")}
            </button>
            <button
              disabled={busy}
              onClick={() => onReject(app)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-red-200 hover:text-red-600 text-gray-600 font-medium transition disabled:opacity-50"
            >
              {t("company.applications.reject")}
            </button>
            {status === "applied" && (
              <button
                disabled={busy}
                onClick={() => onMarkReviewed(app)}
                className="text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-600 font-medium transition disabled:opacity-50"
              >
                {t("company.applications.mark_reviewed")}
              </button>
            )}
          </>
        )}

        {status === "accepted" &&
          (seekerEmail ? (
            <a
              href={`mailto:${seekerEmail}?subject=${encodeURIComponent(
                t("company.applications.email_subject", { job: app.job_title || "" })
              )}`}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition inline-flex items-center gap-1.5"
            >
              ✉️ {t("company.applications.contact_email")}
            </a>
          ) : (
            // TODO(Farah): ما في إيميل الباحث بالـ response الحالي، لازم يضاف الحقل
            <span className="text-xs text-gray-300">
              {t("company.applications.email_unavailable")}
            </span>
          ))}

        {status === "rejected" && (
          <span className="text-xs text-gray-300">
            {t("company.applications.status_updated")}
          </span>
        )}
      </div>
    </div>
  )
}

// ===== مجموعة طلبات وظيفة واحدة =====
function JobApplicationsGroup({ group, sortBy, isAr, t, onAccept, onReject, onMarkReviewed, busyId }) {
  const [expanded, setExpanded] = useState(false)

  const sorted = useMemo(
    () => sortApplications(group.applications, sortBy),
    [group.applications, sortBy]
  )

  const visible = expanded ? sorted : sorted.slice(0, PAGE_SIZE)
  const pendingCount = group.applications.filter(a => isOpenStatus(a.status || "applied")).length

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{group.jobTitle}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {t("company.applications.group_summary", {
              total: group.applications.length,
              pending: pendingCount,
            })}
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {visible.map(app => (
          <ApplicationRow
            key={app.id}
            app={app}
            isAr={isAr}
            t={t}
            onAccept={onAccept}
            onReject={onReject}
            onMarkReviewed={onMarkReviewed}
            busy={busyId === app.id}
          />
        ))}
      </div>

      {sorted.length > PAGE_SIZE && (
        <div className="px-6 py-3 border-t border-gray-50 text-center">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            {expanded
              ? t("company.applications.show_less")
              : t("company.applications.view_all", { count: sorted.length })}
          </button>
        </div>
      )}
    </div>
  )
}

// ===== تأكيد الرفض =====
function ConfirmRejectModal({ app, t, onConfirm, onCancel }) {
  if (!app) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          {t("company.applications.confirm_reject.title")}
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          {t("company.applications.confirm_reject.message", {
            name: app.seeker_name || "-",
          })}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            {t("company.applications.confirm_reject.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="text-xs px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
          >
            {t("company.applications.confirm_reject.confirm")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CompanyApplications() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === "ar"

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState("newest") // newest | oldest | match
  const [hideRejected, setHideRejected] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCompanyApplications()
      setApplications(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const visibleApplications = useMemo(
    () =>
      hideRejected
        ? applications.filter(a => (a.status || "applied") !== "rejected")
        : applications,
    [applications, hideRejected]
  )

  const groups = useMemo(
    () => groupApplicationsByJob(visibleApplications),
    [visibleApplications]
  )

  // هل في أي match score حقيقي بأي طلب؟ إذا لأ منعطّل خيار الترتيب حسب التطابق
  const hasMatchScores = useMemo(
    () => applications.some(a => getMatchScore(a) !== null),
    [applications]
  )

  async function handleAccept(app) {
    setBusyId(app.id)
    try {
      await updateApplicationStatus(app.id, "accepted")
      setApplications(prev =>
        prev.map(a => (a.id === app.id ? { ...a, status: "accepted" } : a))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleRejectConfirmed() {
    const app = rejectTarget
    setRejectTarget(null)
    setBusyId(app.id)
    try {
      await updateApplicationStatus(app.id, "rejected")
      setApplications(prev =>
        prev.map(a => (a.id === app.id ? { ...a, status: "rejected" } : a))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleMarkReviewed(app) {
    setBusyId(app.id)
    try {
      await updateApplicationStatus(app.id, "reviewed")
      setApplications(prev =>
        prev.map(a => (a.id === app.id ? { ...a, status: "reviewed" } : a))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const totalPending = applications.filter(a => isOpenStatus(a.status || "applied")).length

  const SORT_OPTIONS = [
    { key: "newest", label: t("company.applications.sort.newest") },
    { key: "oldest", label: t("company.applications.sort.oldest") },
    { key: "match", label: t("company.applications.sort.match") },
  ]

  return (
    <CompanyLayout>
      <div className="px-8 py-8 space-y-6">
        {/* ===== Header ===== */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {t("company.applications.title")}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t("company.applications.subtitle", { count: totalPending })}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            {t("company.applications.load_error")}: {error}
          </div>
        )}

        {/* ===== أدوات التحكم: الترتيب + إخفاء المرفوض ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {t("company.applications.sort_label")}:
            </span>
            {SORT_OPTIONS.map(opt => {
              const disabled = opt.key === "match" && !hasMatchScores
              return (
                <button
                  key={opt.key}
                  disabled={disabled}
                  onClick={() => setSortBy(opt.key)}
                  title={
                    disabled
                      ? t("company.applications.sort.match_disabled_tooltip")
                      : undefined
                  }
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    sortBy === opt.key
                      ? "bg-blue-600 text-white"
                      : disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={hideRejected}
              onChange={e => setHideRejected(e.target.checked)}
              className="rounded border-gray-300"
            />
            {t("company.applications.hide_rejected")}
          </label>
        </div>

        {/* ===== حالة التحميل ===== */}
        {loading && (
          <div className="bg-white border border-gray-100 rounded-2xl py-14 text-center text-sm text-gray-400">
            {t("company.applications.loading")}
          </div>
        )}

        {/* ===== حالة فارغة ===== */}
        {!loading && groups.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl py-14 text-center">
            <div className="text-3xl mb-3">📩</div>
            <p className="text-sm text-gray-500">
              {t("company.applications.empty")}
            </p>
          </div>
        )}

        {/* ===== المجموعات ===== */}
        {!loading && groups.length > 0 && (
          <div className="space-y-5">
            {groups.map(group => (
              <JobApplicationsGroup
                key={group.jobId}
                group={group}
                sortBy={sortBy}
                isAr={isAr}
                t={t}
                onAccept={handleAccept}
                onReject={app => setRejectTarget(app)}
                onMarkReviewed={handleMarkReviewed}
                busyId={busyId}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmRejectModal
        app={rejectTarget}
        t={t}
        onConfirm={handleRejectConfirmed}
        onCancel={() => setRejectTarget(null)}
      />
    </CompanyLayout>
  )
}