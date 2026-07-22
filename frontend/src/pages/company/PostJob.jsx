import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { API_BASE } from "../../config"
import CompanyLayout from "../../components/company/CompanyLayout"

// ===== Constants =====
const JOB_TYPES = [
  { value: "full_time",  label_ar: "دوام كامل",  label_en: "Full Time"  },
  { value: "part_time",  label_ar: "دوام جزئي",  label_en: "Part Time"  },
  { value: "contract",   label_ar: "عقد مؤقت",   label_en: "Contract"   },
  { value: "internship", label_ar: "تدريب",       label_en: "Internship" },
  { value: "freelance",  label_ar: "عمل حر",      label_en: "Freelance"  },
]

const WORK_TYPES = [
  { value: "onsite",  label_ar: "حضوري",    label_en: "On-site" },
  { value: "remote",  label_ar: "عن بُعد",  label_en: "Remote"  },
  { value: "hybrid",  label_ar: "هجين",     label_en: "Hybrid"  },
]

const STATUSES = [
  { value: "open",   label_ar: "مفتوح",   label_en: "Open"   },
  { value: "closed", label_ar: "مغلق",    label_en: "Closed" },
  { value: "draft",  label_ar: "مسودة",   label_en: "Draft"  },
]

// Cities come from backend constants (value → Arabic label)
const CITIES = [
  { value: "damascus",      label: "دمشق"       },
  { value: "aleppo",        label: "حلب"        },
  { value: "homs",          label: "حمص"        },
  { value: "latakia",       label: "اللاذقية"   },
  { value: "tartus",        label: "طرطوس"      },
  { value: "hama",          label: "حماة"       },
  { value: "deir_ezzor",    label: "دير الزور"  },
  { value: "raqqa",         label: "الرقة"      },
  { value: "suwayda",       label: "السويداء"   },
  { value: "daraa",         label: "درعا"       },
  { value: "idlib",         label: "إدلب"       },
  { value: "hasakah",       label: "الحسكة"     },
  { value: "quneitra",      label: "القنيطرة"   },
  { value: "rural_damascus",label: "ريف دمشق"  },
]

const INITIAL_FORM = {
  title:           "",
  description:     "",
  specialization:  "",   // will send as specialization_id
  city:            "",
  employment_type: "",
  work_mode:       "",
  status:          "open",
  is_active:       true,
  expires_at:      "",
}


// ===== Field wrapper =====
function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ===== Section card =====
function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-5">
        {children}
      </div>
    </div>
  )
}

// ===== Shared input styles =====
const inputCls =
  "w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none " +
  "focus:border-[#1e3a5f] focus:bg-white transition placeholder:text-gray-300"

const selectCls =
  "w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none " +
  "focus:border-[#1e3a5f] focus:bg-white transition appearance-none"

// ===== Main component =====
export default function PostJob() {
  const { t, i18n } = useTranslation()
  const navigate     = useNavigate()
  const { id }       = useParams()
  const isAr         = i18n.language === "ar"
  const isEditMode   = Boolean(id)

  const [form,   setForm]   = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [specializations, setSpecializations] = useState([])
  const [specsLoading, setSpecsLoading] = useState(true)

  // وضع التعديل فقط
  const [jobLoading, setJobLoading] = useState(isEditMode)
  const [jobLoadError, setJobLoadError] = useState(false)

  // ── جلب التخصصات من الباك إند ─────────────────────────
  useEffect(() => {
    const fetchSpecs = async () => {
      console.log("🔵 fetchSpecs: starting...")
      try {
        const res = await fetch(`${API_BASE}/jobs/specializations/`)
        console.log("🔵 fetchSpecs: status =", res.status)
        if (res.ok) {
          const data = await res.json()
          console.log("🟢 fetchSpecs: data =", data)
          setSpecializations(data)
        } else {
          const text = await res.text()
          console.error("🔴 fetchSpecs: error response =", text)
        }
      } catch (err) {
        console.error("🔴 fetchSpecs: network error =", err)
      } finally {
        setSpecsLoading(false)
      }
    }
    fetchSpecs()
  }, [])

  // ── وضع التعديل: نجيب بيانات الوظيفة الموجودة ونعبّي الفورم فيها ─────
  useEffect(() => {
    if (!isEditMode) return
    const fetchJob = async () => {
      setJobLoading(true)
      setJobLoadError(false)
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE}/jobs/company/jobs/${id}/`, {
          headers: { Authorization: `CompanyToken ${token}` },
        })
        if (res.ok) {
          const job = await res.json()
          // TODO(Farah): تأكدي إذا specialization راجعة كـ object {id, name_ar,...} أو رقم مباشر (specialization_id)
          const specId = job.specialization?.id ?? job.specialization_id ?? job.specialization ?? ""
          setForm({
            title:           job.title || "",
            description:     job.description || "",
            specialization:  specId ? String(specId) : "",
            city:            job.city || "",
            employment_type: job.employment_type || "",
            work_mode:       job.work_mode || "",
            status:          job.status || "open",
            is_active:       job.is_active ?? true,
            expires_at:      job.expires_at ? job.expires_at.slice(0, 10) : "",
          })
        } else {
          setJobLoadError(true)
        }
      } catch (err) {
        console.error("🔴 fetchJob (edit): network error =", err)
        setJobLoadError(true)
      } finally {
        setJobLoading(false)
      }
    }
    fetchJob()
  }, [id, isEditMode])

  // ── helpers ──────────────────────────────────────────
  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: "" }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim())        e.title           = t("company.post_job.errors.required")
    if (!form.description.trim())  e.description     = t("company.post_job.errors.required")
    if (!form.specialization)      e.specialization  = t("company.post_job.errors.required")
    if (!form.city)                e.city            = t("company.post_job.errors.required")
    if (!form.employment_type)     e.employment_type = t("company.post_job.errors.required")
    if (!form.work_mode)           e.work_mode       = t("company.post_job.errors.required")
    if (!form.expires_at)          e.expires_at      = t("company.post_job.errors.required")
    else if (form.expires_at <= new Date().toISOString().slice(0, 10))
      e.expires_at = t("company.post_job.errors.expiration_past")
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const payload = {
        title:              form.title.trim(),
        description:        form.description.trim(),
        specialization_id:  form.specialization,
        city:               form.city,
        employment_type:    form.employment_type,
        work_mode:          form.work_mode,
        status:             form.status,
        is_active:          form.is_active,
        expires_at:         form.expires_at,
      }

      const url    = isEditMode ? `${API_BASE}/jobs/company/jobs/${id}/` : `${API_BASE}/jobs/company/jobs/`
      const method = isEditMode ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":   "application/json",
          "Authorization": `CompanyToken ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        navigate(isEditMode ? "/company/jobs" : "/company/dashboard")
        return
      }

      // ── validation errors من الباك إند ─────────────────
      if (res.status === 400) {
        const data = await res.json()
        const backendErrors = {}
        // map backend field names → frontend state keys
        const fieldMap = {
          specialization_id: "specialization",
          employment_type:   "employment_type",
          work_mode:         "work_mode",
          expires_at:        "expires_at",
        }
        Object.entries(data).forEach(([key, msgs]) => {
          const mapped = fieldMap[key] || key
          backendErrors[mapped] = Array.isArray(msgs) ? msgs[0] : msgs
        })
        setErrors(backendErrors)
      }
    } catch {
      // network error — silent for now
    } finally {
      setLoading(false)
    }
  }

  // للـ JOB_TYPES و WORK_TYPES و STATUSES (label_ar/label_en)
  const labelOf = (arr, val) => {
    const found = arr.find(x => x.value === val)
    if (!found) return "—"
    return isAr ? found.label_ar : found.label_en
  }

  // للتخصصات من الباك إند (name_ar/name_en)
  const specLabel = (id) => {
    const found = specializations.find(s => s.id === Number(id))
    if (!found) return "—"
    return isAr ? found.name_ar : found.name_en
  }

  // ──────────────────────────────────────────────────────
  return (
    <CompanyLayout>
      <div className="px-8 py-8 space-y-8 max-w-4xl mx-auto">

        {/* ===== Header ===== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isEditMode ? t("company.post_job.edit_title") : t("company.post_job.title")}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isEditMode ? t("company.post_job.edit_subtitle") : t("company.post_job.subtitle")}
            </p>
          </div>
          <button
            onClick={() => navigate(isEditMode ? "/company/jobs" : "/company/dashboard")}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600
                       text-sm font-medium rounded-xl hover:bg-gray-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isAr
                ? <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>
                : <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>}
            </svg>
            {t("company.post_job.back")}
          </button>
        </div>

        {jobLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-white border border-gray-100 rounded-2xl" />
            <div className="h-48 bg-white border border-gray-100 rounded-2xl" />
            <div className="h-24 bg-white border border-gray-100 rounded-2xl" />
          </div>
        ) : jobLoadError ? (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            {t("company.post_job.load_error")}
          </div>
        ) : (
        <>
        {/* ===== Basic Info ===== */}
        <Section title={t("company.post_job.sections.basic")}>
          <Field label={t("company.post_job.fields.title")} required error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder={t("company.post_job.placeholders.title")}
              className={inputCls + (errors.title ? " border-red-300" : "")}
            />
          </Field>

          <Field label={t("company.post_job.fields.description")} required error={errors.description}>
            <textarea
              rows={5}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder={t("company.post_job.placeholders.description")}
              className={inputCls + " resize-none" + (errors.description ? " border-red-300" : "")}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label={t("company.post_job.fields.specialization")} required error={errors.specialization}>
              <div className="relative">
                <select
                  value={form.specialization}
                  onChange={e => set("specialization", e.target.value)}
                  className={selectCls + (errors.specialization ? " border-red-300" : "")}
                >
                  <option value="">{t("company.post_job.placeholders.select")}</option>
                  {specsLoading
                    ? <option disabled>{isAr ? "جاري التحميل..." : "Loading..."}</option>
                    : specializations.map(s => (
                        <option key={s.id} value={s.id}>
                          {isAr ? s.name_ar : s.name_en}
                        </option>
                      ))
                  }
                </select>
                <svg className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3 text-gray-400"
                     width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </Field>

            <Field label={t("company.post_job.fields.city")} required error={errors.city}>
              <div className="relative">
                <select
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  className={selectCls + (errors.city ? " border-red-300" : "")}
                >
                  <option value="">{t("company.post_job.placeholders.select")}</option>
                  {CITIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3 text-gray-400"
                     width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </Field>
          </div>
        </Section>

        {/* ===== Job Details ===== */}
        <Section title={t("company.post_job.sections.details")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <Field label={t("company.post_job.fields.job_type")} required error={errors.employment_type}>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map(jt => (
                  <button
                    key={jt.value}
                    type="button"
                    onClick={() => set("employment_type", jt.value)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-xl border transition
                      ${form.employment_type === jt.value
                        ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40"}`}
                  >
                    {isAr ? jt.label_ar : jt.label_en}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t("company.post_job.fields.work_type")} required error={errors.work_mode}>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map(wt => (
                  <button
                    key={wt.value}
                    type="button"
                    onClick={() => set("work_mode", wt.value)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-xl border transition
                      ${form.work_mode === wt.value
                        ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40"}`}
                  >
                    {isAr ? wt.label_ar : wt.label_en}
                  </button>
                ))}
              </div>
            </Field>

          </div>
        </Section>

        {/* ===== Publish Settings ===== */}
        <Section title={t("company.post_job.sections.publish")}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

            <Field label={t("company.post_job.fields.status")}>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={e => set("status", e.target.value)}
                  className={selectCls}
                >
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>
                      {isAr ? s.label_ar : s.label_en}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3 text-gray-400"
                     width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </Field>

            <Field label={t("company.post_job.fields.expiration_date")} required error={errors.expires_at}>
              <input
                type="date"
                value={form.expires_at}
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                onChange={e => set("expires_at", e.target.value)}
                className={inputCls + (errors.expires_at ? " border-red-300" : "")}
              />
            </Field>

            <Field label={t("company.post_job.fields.created_at")}>
              <input
                type="date"
                value={new Date().toISOString().slice(0, 10)}
                disabled
                className={inputCls + " opacity-60 cursor-not-allowed"}
              />
            </Field>

          </div>

          {/* Views count (read-only) + isActive toggle */}
          <div className="flex flex-wrap items-center gap-6 pt-1">

            {/* is_active toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                onClick={() => set("is_active", !form.is_active)}
                className={`relative w-10 h-5.5 rounded-full transition-colors
                  ${form.is_active ? "bg-[#1e3a5f]" : "bg-gray-200"}`}
                style={{ height: "22px", width: "40px" }}
              >
                <span
                  className="absolute top-0.5 start-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-all"
                  style={{
                    width: "18px",
                    height: "18px",
                    transform: form.is_active
                      ? (isAr ? "translateX(-18px)" : "translateX(18px)")
                      : "translateX(0)",
                  }}
                />
              </button>
              <span className="text-sm text-gray-700">
                {t("company.post_job.fields.is_active")}
                <span className={`ms-1.5 text-xs font-medium px-2 py-0.5 rounded-full border
                  ${form.is_active
                    ? "bg-green-50 text-green-700 border-green-100"
                    : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                  {form.is_active
                    ? t("company.post_job.active")
                    : t("company.post_job.inactive")}
                </span>
              </span>
            </div>

            {/* Views count */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>
                {t("company.post_job.fields.views_count")}:
                <span className="ms-1 font-medium text-gray-700">0</span>
              </span>
            </div>

          </div>
        </Section>

        {/* ===== Preview strip ===== */}
        {(form.title || form.city || form.employment_type || form.work_mode || form.status) && (
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4">
            <p className="text-xs text-gray-400 mb-3">{t("company.post_job.preview_label")}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {form.title || t("company.post_job.placeholders.title")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
                  {form.city && <span>{CITIES.find(c => c.value === form.city)?.label}</span>}
                  {form.specialization && <span>{specLabel(form.specialization)}</span>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.employment_type && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {labelOf(JOB_TYPES, form.employment_type)}
                  </span>
                )}
                {form.work_mode && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                    {labelOf(WORK_TYPES, form.work_mode)}
                  </span>
                )}
                {form.status && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border
                    ${form.status === "open"   ? "bg-green-50 text-green-700 border-green-100"  : ""}
                    ${form.status === "closed" ? "bg-red-50 text-red-600 border-red-100"        : ""}
                    ${form.status === "draft"  ? "bg-amber-50 text-amber-700 border-amber-100"  : ""}`}>
                    {labelOf(STATUSES, form.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== Actions ===== */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <button
            type="button"
            onClick={() => navigate(isEditMode ? "/company/jobs" : "/company/dashboard")}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200
                       rounded-xl hover:bg-gray-50 transition"
          >
            {t("company.post_job.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a5f] hover:bg-[#16304f]
                       disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
          >
            {loading && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            )}
            {loading
              ? (isEditMode ? t("company.post_job.saving") : t("company.post_job.submitting"))
              : (isEditMode ? t("company.post_job.save") : t("company.post_job.submit"))}
          </button>
        </div>
        </>
        )}

      </div>
    </CompanyLayout>
  )
}
