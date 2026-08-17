import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams, useNavigate } from "react-router-dom"
import CompanyLayout from "../../components/company/CompanyLayout"
import {
  fetchCompanyApplications,
  updateApplicationStatus,
} from "../../api/companyApplicationsApi"
import {
  groupApplicationsByJob,
  filterApplicationsByJob,
  sortApplications,
  getMatchScore,
  getAppliedAt,
  getJobTitle,
  getSeekerName,
  getSeekerEmail,
  getSeekerPhone,
  getSeekerGovernorate,
  getSeekerBio,
  getSeekerCv,
  getSeekerProfilePicture,
  getSeekerSkills,
  getSeekerExperiences,
  getSeekerEducation,
  getRequiredSkills,
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

const STATUS_TABS = ["all", "applied", "reviewed", "accepted"]

// حالات غير نهائية بعدها الطلب "قيد المراجعة" (لسا فيها إمكانية قبول/رفض)
function isOpenStatus(status) {
  return status !== "accepted" && status !== "rejected"
}

function IconArrowBack(props) {
  const isAr = props.isAr
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {isAr ? <path d="M5 12h14M13 6l6 6-6 6" /> : <path d="M19 12H5M11 18l-6-6 6-6" />}
    </svg>
  )
}

function StatusBadge({ status, t }) {
  const cls = STATUS_BADGE[status] || STATUS_BADGE.applied
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${cls}`}>
      {t(`company.applications.status.${status}`)}
    </span>
  )
}

// ===== مودال تفاصيل نسبة التطابق =====
function MatchScoreModal({ score, app, t, onClose }) {
  const seekerSkills = getSeekerSkills(app)
  const requiredSkills = getRequiredSkills(app)
  const hasSkillsData = requiredSkills.length > 0
  const matched = requiredSkills.filter(s =>
    seekerSkills.some(ss => String(ss).toLowerCase().trim() === String(s).toLowerCase().trim())
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("company.applications.match_modal.title")}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold ${
            score >= 70 ? "bg-emerald-50 text-emerald-600" : score >= 40 ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-500"
          }`}>
            {score}%
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {t("company.applications.match_modal.description")}
          </p>
        </div>

        {hasSkillsData ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">
              {t("company.applications.match_modal.matched_skills")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matched.length > 0 ? matched.map(skill => (
                <span key={skill} className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700">
                  {skill}
                </span>
              )) : (
                <span className="text-xs text-gray-400">{t("company.applications.match_modal.no_shared_skills")}</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            {t("company.applications.match_modal.skills_unavailable")}
          </p>
        )}
      </div>
    </div>
  )
}

// ===== زر نسبة التطابق (تفاعلي: يفتح مودال التفاصيل) =====
function MatchScoreButton({ score, app, t }) {
  const [open, setOpen] = useState(false)

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
    score >= 70 ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" :
    score >= 40 ? "text-amber-700 bg-amber-50 hover:bg-amber-100" :
    "text-gray-500 bg-gray-50 hover:bg-gray-100"

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("company.applications.match_method_tooltip")}
        className={`text-xs font-semibold px-2 py-0.5 rounded-full transition ${color}`}
      >
        {t("company.applications.match_value", { score })}
      </button>
      {open && (
        <MatchScoreModal score={score} app={app} t={t} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

// ===== مودال بروفايل الباحث =====
// البيانات كلها موجودة أصلاً بـ applicant_profile ضمن الـ response (اسم، إيميل،
// تلفون، محافظة، bio، مهارات، خبرات، تعليم، CV) — ما بيحتاج id ولا صفحة منفصلة.
function SeekerProfileModal({ app, t, onClose }) {
  const [imgError, setImgError] = useState(false)
  const name = getSeekerName(app)
  const email = getSeekerEmail(app)
  const phone = getSeekerPhone(app)
  const governorate = getSeekerGovernorate(app)
  const bio = getSeekerBio(app)
  const cv = getSeekerCv(app)
  const picture = getSeekerProfilePicture(app)
  const skills = getSeekerSkills(app)
  const experiences = getSeekerExperiences(app)
  const education = getSeekerEducation(app)
  const initials = (name || "؟").trim().slice(0, 2)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {picture && !imgError ? (
              <img
                src={picture}
                alt={name || ""}
                onError={() => setImgError(true)}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-blue-50"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-gray-900">{name}</h3>
              {governorate && <p className="text-xs text-gray-400 mt-0.5">{governorate}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>

        <div className="space-y-1 mb-4 text-xs text-gray-600">
          {email && <p>✉️ {email}</p>}
          {phone && <p>📞 {phone}</p>}
        </div>

        {bio && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-1">
              {t("company.applications.profile_modal.bio")}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">{bio}</p>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-1.5">
              {t("company.applications.profile_modal.skills")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map(s => (
                <span key={s} className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {experiences.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-1.5">
              {t("company.applications.profile_modal.experience")}
            </p>
            <div className="space-y-2">
              {experiences.map((exp, i) => (
                <div key={i} className="text-xs">
                  <p className="text-gray-800 font-medium">
                    {exp.title} — {exp.company}
                  </p>
                  <p className="text-gray-400">
                    {exp.date_from} - {exp.current ? t("company.applications.profile_modal.current") : exp.date_to}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-1.5">
              {t("company.applications.profile_modal.education")}
            </p>
            <div className="space-y-2">
              {education.map((edu, i) => (
                <div key={i} className="text-xs">
                  <p className="text-gray-800 font-medium">
                    {edu.degree} — {edu.institution}
                  </p>
                  <p className="text-gray-400">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {cv && (
          <a
            href={cv}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
          >
            📄 {t("company.applications.profile_modal.view_cv")}
          </a>
        )}
      </div>
    </div>
  )
}

// ===== صف طلب واحد =====
function ApplicationRow({ app, isAr, t, navigate, onAccept, onReject, onMarkReviewed, busy }) {
  const [showProfile, setShowProfile] = useState(false)
  const [imgError, setImgError] = useState(false)
  const status = app.status || "applied"
  const score = getMatchScore(app)
  const seekerEmail = getSeekerEmail(app)
  const seekerName = getSeekerName(app)
  const seekerCv = getSeekerCv(app)
  const seekerPicture = getSeekerProfilePicture(app)
  const experiencesCount = getSeekerExperiences(app).length
  const initials = (seekerName || "؟").trim().slice(0, 2)

  return (
    <div className="px-6 py-4 hover:bg-gray-50/50 transition">
      <div className="flex items-start gap-3">
        {/* أفاتار الباحث: صورة فعلية لو موجودة وتحمّلت، وإلا الأحرف الأولى */}
        {seekerPicture && !imgError ? (
          <img
            src={seekerPicture}
            alt={seekerName || ""}
            onError={() => setImgError(true)}
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-blue-50"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {seekerName || "-"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-xs text-gray-400">
                  {formatAppliedDate(getAppliedAt(app), isAr)}
                </p>
                {/* نسبة التطابق - موقوفة مؤقتاً، ما بدنا نعرضها حالياً
                <span className="text-gray-200">·</span>
                <MatchScoreButton score={score} app={app} t={t} />
                */}
                {experiencesCount > 0 && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400">
                      💼 {t("company.applications.experience_count", { count: experiencesCount })}
                    </span>
                  </>
                )}
                {seekerCv && (
                  <>
                    <span className="text-gray-200">·</span>
                    <a
                      href={seekerCv}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      📄 {t("company.applications.profile_modal.view_cv")}
                    </a>
                  </>
                )}
              </div>
            </div>
            <StatusBadge status={status} t={t} />
          </div>

          {/* ===== إجراءات ===== */}
          <div className="flex items-center flex-wrap gap-2 mt-3">
            <button
              onClick={() => setShowProfile(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-blue-200 hover:text-blue-700 text-gray-600 font-medium transition inline-flex items-center gap-1.5"
            >
              👤 {t("company.applications.view_profile")}
            </button>

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
      </div>

      {showProfile && (
        <SeekerProfileModal app={app} t={t} onClose={() => setShowProfile(false)} />
      )}
    </div>
  )
}

// ===== مجموعة طلبات وظيفة واحدة =====
function JobApplicationsGroup({
  group,
  sortBy,
  isAr,
  t,
  navigate,
  onAccept,
  onReject,
  onMarkReviewed,
  busyId,
  showHeader = true,
}) {
  const [expanded, setExpanded] = useState(false)

  const sorted = useMemo(
    () => sortApplications(group.applications, sortBy),
    [group.applications, sortBy]
  )

  const visible = expanded ? sorted : sorted.slice(0, PAGE_SIZE)
  const pendingCount = group.applications.filter(a => isOpenStatus(a.status || "applied")).length

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {showHeader && group.jobTitle && group.jobTitle !== "-" && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              {group.jobTitle || t("company.applications.job_scope_fallback_title")}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {t("company.applications.group_summary", {
                total: group.applications.length,
                pending: pendingCount,
              })}
            </p>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">
          {t("company.applications.no_match_filters")}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {visible.map(app => (
            <ApplicationRow
              key={app.id}
              app={app}
              isAr={isAr}
              t={t}
              navigate={navigate}
              onAccept={onAccept}
              onReject={onReject}
              onMarkReviewed={onMarkReviewed}
              busy={busyId === app.id}
            />
          ))}
        </div>
      )}

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
            name: getSeekerName(app) || "-",
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

// ===== شريط ملخّص أرقام سريع =====
function StatsBar({ counts, t }) {
  const items = [
    { key: "all", value: counts.all, cls: "text-gray-900" },
    { key: "applied", value: counts.applied, cls: "text-blue-700" },
    { key: "reviewed", value: counts.reviewed, cls: "text-amber-700" },
    { key: "accepted", value: counts.accepted, cls: "text-emerald-700" },
    { key: "rejected", value: counts.rejected, cls: "text-red-600" },
  ]
  return (
    <div className="grid grid-cols-5 gap-3">
      {items.map(item => (
        <div key={item.key} className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center">
          <p className={`text-lg font-bold ${item.cls}`}>{item.value}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {t(`company.applications.status_plural.${item.key}`)}
          </p>
        </div>
      ))}
    </div>
  )
}

export default function CompanyApplications() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { jobId } = useParams() // موجود فقط لما الصفحة تنفتح من /company/jobs/:jobId/applications
  const isAr = i18n.language === "ar"

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState("newest") // newest | oldest | match
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
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

  // نطاق الصفحة: كل الطلبات، أو طلبات وظيفة وحدة إذا مفتوحة من /company/jobs/:jobId/applications
  // الطلبات المرفوضة (rejected) مستبعدة نهائياً من الصفحة — بمجرد ما ينرفض الطلب بيختفي فوراً
  const scoped = useMemo(() => {
    const base = jobId ? filterApplicationsByJob(applications, jobId) : applications
    return base.filter(a => a.status !== "rejected")
  }, [applications, jobId])

  const scopedJobTitle = useMemo(() => {
    if (!jobId) return null
    return getJobTitle(scoped[0] || {}) || t("company.applications.job_scope_fallback_title")
  }, [jobId, scoped, t])

  const counts = useMemo(
    () => ({
      all: scoped.length,
      applied: scoped.filter(a => (a.status || "applied") === "applied").length,
      reviewed: scoped.filter(a => a.status === "reviewed").length,
      accepted: scoped.filter(a => a.status === "accepted").length,
      rejected: scoped.filter(a => a.status === "rejected").length,
    }),
    [scoped]
  )

  const filtered = useMemo(() => {
    let list = scoped
    if (statusFilter !== "all") {
      list = list.filter(a => (a.status || "applied") === statusFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(a => (getSeekerName(a) || "").toLowerCase().includes(q))
    }
    return list
  }, [scoped, statusFilter, search])

  const groups = useMemo(
    () => (jobId ? [{ jobId, jobTitle: scopedJobTitle, applications: filtered }] : groupApplicationsByJob(filtered)),
    [jobId, scopedJobTitle, filtered]
  )

  // هل في أي match score حقيقي بأي طلب؟ إذا لأ منعطّل خيار الترتيب حسب التطابق
  const hasMatchScores = useMemo(
    () => scoped.some(a => getMatchScore(a) !== null),
    [scoped]
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

  const SORT_OPTIONS = [
    { key: "newest", label: t("company.applications.sort.newest") },
    { key: "oldest", label: t("company.applications.sort.oldest") },
   /*  { key: "match", label: t("company.applications.sort.match") }, */
  ]

  return (
    <CompanyLayout>
      <div className="px-8 py-8 space-y-6">
        {/* ===== Header ===== */}
        <div>
          {jobId && (
            <button
              onClick={() => navigate("/company/jobs")}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-3 transition"
            >
              <IconArrowBack isAr={isAr} />
              {t("company.applications.back_to_jobs")}
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-900">
            {jobId ? scopedJobTitle : t("company.applications.title")}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t("company.applications.subtitle", { count: counts.applied })}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            {t("company.applications.load_error")}: {error}
          </div>
        )}

        {/* ===== ملخّص الأرقام ===== */}
        {!loading && <StatsBar counts={counts} t={t} />}

        {/* ===== أدوات التحكم: تبويبات الحالة + بحث + ترتيب ===== */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    statusFilter === tab
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t(`company.applications.status_plural.${tab}`)}{" "}
                  <span className="text-gray-400">({counts[tab]})</span>
                </button>
              ))}
            </div>

            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("company.applications.search_placeholder")}
              className="w-56 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>

           <div className="flex items-center gap-2 border-t border-gray-50 pt-3">
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
        </div> 

        {/* ===== حالة التحميل ===== */}
        {loading && (
          <div className="bg-white border border-gray-100 rounded-2xl py-14 text-center text-sm text-gray-400">
            {t("company.applications.loading")}
          </div>
        )}

        {/* ===== حالة فارغة ===== */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl py-14 text-center">
            <div className="text-3xl mb-3">📩</div>
            <p className="text-sm text-gray-500">
              {scoped.length === 0
                ? t("company.applications.empty")
                : t("company.applications.no_match_filters")}
            </p>
          </div>
        )}

        {/* ===== المجموعات ===== */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-5">
            {groups.map(group => (
              <JobApplicationsGroup
                key={group.jobId}
                group={group}
                sortBy={sortBy}
                isAr={isAr}
                t={t}
                navigate={navigate}
                showHeader={!jobId}
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