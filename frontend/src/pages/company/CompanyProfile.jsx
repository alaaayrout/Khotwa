import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import CompanyLayout from "../../components/company/CompanyLayout"

// ===== نفس نمط CompanyDashboard.jsx بالضبط: fetch مباشر + CompanyToken + TODO لتأكيد أسماء الحقول =====

// TODO(Farah): تأكدي هاي نفس قيم الـ choices تبعة الشركة (industry/city) الموجودة بـ /api/choices/
// إذا الباك بيرجعهن بأسماء مختلفة، بدّلي هون أو اجلبيهن ديناميكياً متل ما عملتي بـ PostJob.jsx
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

// قيم company_type — مأخوذة من Django Admin (users/models.py -> Company.company_type choices)
const COMPANY_TYPE_LABELS = {
  programming: { ar: "برمجة",       en: "Programming"  },
  civil:       { ar: "هندسة مدنية", en: "Civil"        },
  healthcare:  { ar: "رعاية صحية",  en: "Healthcare"   },
  education:   { ar: "تعليم",       en: "Education"    },
  finance:     { ar: "مالية",       en: "Finance"      },
  marketing:   { ar: "تسويق",       en: "Marketing"    },
  hospitality: { ar: "ضيافة",       en: "Hospitality"  },
  other:       { ar: "أخرى",        en: "Other"        },
}

// حقول الفورم — مطابقة لـ CompanyProfileSerializer الفعلي (company_profile/serializers.py)
const emptyForm = {
  company_name: "",
  email: "",          // read-only، جاي من company.email
  phone_number: "",
  governorate: "",
  company_type: "",
  website_url: "",
  description: "",
  linkedin_url: "",
}

// حساب نسبة اكتمال البروفايل (نفس فكرة SeekerProfile)
function calcCompletion(form, hasLogo) {
  const fields = [
    form.company_name, form.phone_number, form.governorate, form.company_type,
    form.website_url, form.description, form.linkedin_url,
  ]
  const filled = fields.filter(v => v && String(v).trim() !== "").length
  const total = fields.length + 1 // +1 للوغو
  const filledWithLogo = filled + (hasLogo ? 1 : 0)
  return Math.round((filledWithLogo / total) * 100)
}

// TODO(Farah): تأكدي شكل approval_status الراجع من الباك (pending/approved/rejected؟) — الألوان معمولة inline بالـ JSX تحت

// حدود رفع اللوغو — TODO(Farah): تأكدي الحد الأقصى الفعلي المسموح بالباك (حاليًا افتراض 2MB)
const MAX_LOGO_SIZE_MB = 2
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"]

// حد أقصى تقريبي لطول الوصف — TODO(Farah): تأكدي القيمة الفعلية من max_length بالموديل لو موجودة
const DESCRIPTION_MAX_LENGTH = 1000

// ── تحويل رسالة خطأ DRF (نص JSON) لشكل مقروء + أخطاء لكل حقل ─────
function parseApiError(rawText) {
  try {
    const parsed = JSON.parse(rawText)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const fieldErrors = {}
      const generalParts = []
      Object.entries(parsed).forEach(([key, val]) => {
        const msg = Array.isArray(val) ? val.join(" ") : String(val)
        if (key === "detail" || key === "non_field_errors") {
          generalParts.push(msg)
        } else {
          fieldErrors[key] = msg
        }
      })
      return {
        fieldErrors,
        generalMessage: generalParts.length ? generalParts.join(" | ") : null,
      }
    }
  } catch {
    // مش JSON — منرجع النص متل ما هو
  }
  return { fieldErrors: {}, generalMessage: rawText }
}

export default function CompanyProfile() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === "ar"
  const fileInputRef = useRef(null)

  const [form, setForm]         = useState(emptyForm)
  const [logoUrl, setLogoUrl]   = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [approvalStatus, setApprovalStatus] = useState(null)
  const [rejectionReason, setRejectionReason] = useState(null)

  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError]       = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [logoError, setLogoError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [isDirty, setIsDirty]   = useState(false)

  const initialFormRef = useRef(emptyForm)

  const token = localStorage.getItem("token")

  // ── جلب بيانات بروفايل الشركة ─────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      console.log("🔵 fetchProfile: starting...")
      try {
        const res = await fetch("/api/company/profile/", {
          headers: { "Authorization": `CompanyToken ${token}` },
        })
        console.log("🔵 fetchProfile: status =", res.status)
        if (res.ok) {
          const data = await res.json()
          console.log("🟢 fetchProfile: data =", data)
          // مطابق لـ CompanyProfileSerializer: company_name, email, phone_number,
          // governorate, company_type, website_url, description, linkedin_url, logo_url, external_logo_url
          const loadedForm = {
            company_name:  data.company_name ?? "",
            email:         data.email ?? "",
            phone_number:  data.phone_number ?? "",
            governorate:   data.governorate ?? "",
            company_type:  data.company_type ?? "",
            website_url:   data.website_url ?? "",
            description:   data.description ?? "",
            linkedin_url:  data.linkedin_url ?? "",
          }
          setForm(loadedForm)
          initialFormRef.current = loadedForm
          setLogoUrl(data.profile_picture_url || data.logo_url || data.external_logo_url || null)
          setApprovalStatus(data.approval_status ?? null)
          setRejectionReason(data.rejection_reason ?? null)
        } else {
          const text = await res.text()
          console.error("🔴 fetchProfile: error response =", text)
          setError(text)
        }
      } catch (err) {
        console.error("🔴 fetchProfile: network error =", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [token])

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setForm(prev => {
      const next = { ...prev, [field]: value }
      setIsDirty(JSON.stringify(next) !== JSON.stringify(initialFormRef.current))
      return next
    })
    // مسح خطأ هالحقل بمجرد ما المستخدم يعدّل فيه
    setFieldErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  // ── تحذير قبل مغادرة الصفحة لو في تعديلات ما محفوظة ─────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  // ── حفظ بيانات البروفايل (نص) ─────────────────────
  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setFieldErrors({})
    setSuccessMsg(null)
    // email و approval_status و rejection_reason حقول read-only بالـ serializer، ما منبعتهن بالتحديث
    const payload = {
      company_name: form.company_name,
      phone_number: form.phone_number,
      governorate:  form.governorate,
      company_type: form.company_type,
      website_url:  form.website_url,
      description:  form.description,
      linkedin_url: form.linkedin_url,
    }
    console.log("🔵 saveProfile: sending =", payload)
    try {
      // TODO(Farah): تأكدي الميثود الصح PATCH ولا PUT حسب الـ view بالباك
      const res = await fetch("/api/company/profile/", {
        method: "PATCH",
        headers: {
          "Authorization": `CompanyToken ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      console.log("🔵 saveProfile: status =", res.status)
      if (res.ok) {
        const data = await res.json()
        console.log("🟢 saveProfile: data =", data)
        setSuccessMsg(t("company.profile.save_success"))
        initialFormRef.current = form
        setIsDirty(false)
      } else {
        const text = await res.text()
        console.error("🔴 saveProfile: error response =", text)
        const { fieldErrors: fe, generalMessage } = parseApiError(text)
        setFieldErrors(fe)
        setError(generalMessage || t("company.profile.generic_error"))
      }
    } catch (err) {
      console.error("🔴 saveProfile: network error =", err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── اختيار صورة اللوغو محلياً (preview فوري + تحقق) ─────
  const handleLogoPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(null)

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError(t("company.profile.logo_invalid_type"))
      e.target.value = ""
      return
    }
    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      setLogoError(t("company.profile.logo_too_large", { max: MAX_LOGO_SIZE_MB }))
      e.target.value = ""
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    e.target.value = "" // تسمح تختاري نفس الملف مرة ثانية لو رجعتي مسحتيه
  }

  // ── إلغاء اختيار اللوغو قبل الرفع ────────────────────
  const handleLogoCancel = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(null)
    setLogoPreview(null)
    setLogoError(null)
  }

  // ── رفع اللوغو للباك ───────────────────────────────
  const handleLogoUpload = async () => {
    if (!logoFile) return
    setUploadingLogo(true)
    setError(null)
    setLogoError(null)
    setSuccessMsg(null)
    try {
      const fd = new FormData()
      // ✅ تأكدنا: الباك متوقع اسم الحقل "profile_picture" مش "logo"
      fd.append("profile_picture", logoFile)

      // ✅ صار المسار الصحيح حسب api_endpoints.json (كان /logo/ وهاد مش موجود أصلاً بالباك)
      const res = await fetch("/api/company/profile/picture/", {
        method: "POST", // TODO(Farah): تأكدي إذا PUT/PATCH بدل POST حسب الـ view
        headers: { "Authorization": `CompanyToken ${token}` }, // ما نحط Content-Type يدوياً مع FormData
        body: fd,
      })
      console.log("🔵 uploadLogo: status =", res.status)
      if (res.ok) {
        const data = await res.json()
        console.log("🟢 uploadLogo: data =", data)
        setLogoUrl(data.profile_picture_url || data.logo_url || data.logo || logoPreview)
        setLogoFile(null)
        setSuccessMsg(t("company.profile.logo_success"))
      } else {
        const text = await res.text()
        console.error("🔴 uploadLogo: error response =", text)
        const { fieldErrors: logoFieldErrors, generalMessage } = parseApiError(text)
        // بدل ما نطلّع دايماً الرسالة العامة، منعرض تفاصيل أي حقل رجعو فيه خطأ (مثلاً اسم الحقل بالـ FormData غلط)
        const detail = generalMessage
          || Object.entries(logoFieldErrors).map(([field, msg]) => `${field}: ${msg}`).join(" | ")
        setLogoError(detail || t("company.profile.generic_error"))
      }
    } catch (err) {
      console.error("🔴 uploadLogo: network error =", err)
      // ✅ كانت هون setError() غلط - هيك كانت رسالة رفع اللوغو عم تطلع تحت بانر "فشل تحميل البروفايل"
      setLogoError(err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  const completion = calcCompletion(form, !!(logoUrl || logoPreview))

  return (
    <CompanyLayout>
      <div className="px-8 py-8 space-y-6">

        {/* ===== Hero Card (متل SeekerProfile) ===== */}
        <div
          className="rounded-3xl p-8 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f2544 0%, #1e3a5f 100%)" }}
        >
          <div className="flex items-center gap-6 relative z-10">
            {/* اللوغو */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center backdrop-blur-sm">
                {(logoPreview || logoUrl) ? (
                  <img
                    src={logoPreview || logoUrl}
                    alt="logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">🏢</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -end-2 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white text-sm shadow-lg transition"
                title={t("company.profile.change_logo")}
              >
                ✏️
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoPick}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">
                  {form.company_name || t("company.profile.default_title")}
                </h1>
                {approvalStatus && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${
                    approvalStatus === "approved" ? "bg-green-400/10 text-green-300 border-green-400/20" :
                    approvalStatus === "rejected" ? "bg-red-400/10 text-red-300 border-red-400/20" :
                    "bg-amber-400/10 text-amber-300 border-amber-400/20"
                  }`}>
                    {t(`company.profile.approval_status.${approvalStatus}`)}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/60 mt-1">
                {t("company.profile.completion", { percent: completion })}
              </p>
              <div className="h-1.5 w-full max-w-sm bg-white/10 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            {logoFile && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition"
                >
                  {uploadingLogo ? t("company.profile.uploading") : t("company.profile.upload_logo")}
                </button>
                <button
                  onClick={handleLogoCancel}
                  disabled={uploadingLogo}
                  title={t("company.profile.cancel_logo")}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          {logoError && (
            <p className="text-xs text-red-300 mt-3 relative z-10">{logoError}</p>
          )}
        </div>

        {/* ===== Alerts ===== */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            {t("company.profile.load_error")}: {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-100 text-green-600 text-sm rounded-xl px-4 py-3">
            {successMsg}
          </div>
        )}

        {/* بانر سبب الرفض — بيظهر بس إذا approval_status = rejected */}
        {approvalStatus === "rejected" && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 space-y-1">
            {rejectionReason && (
              <p>
                <span className="font-medium">{t("company.profile.rejection_reason_label")}: </span>
                {rejectionReason}
              </p>
            )}
            <p className="text-red-500">{t("company.profile.rejection_cta")}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-10 text-center text-sm text-gray-400">
            {t("company.profile.loading")}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-800">
              {t("company.profile.basic_info")}
            </h2>

            <div className="grid grid-cols-2 gap-5">
              {/* اسم الشركة */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">
                  {t("company.profile.fields.company_name")}
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={handleChange("company_name")}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                    fieldErrors.company_name ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {fieldErrors.company_name && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.company_name}</p>
                )}
              </div>

              {/* الإيميل — read-only حسب الـ serializer */}
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">
                  {t("company.profile.fields.email")}
                </label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-100 bg-gray-50 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* الوصف */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500 block">
                    {t("company.profile.fields.description")}
                  </label>
                  <span className={`text-xs ${
                    form.description.length > DESCRIPTION_MAX_LENGTH ? "text-red-500" : "text-gray-400"
                  }`}>
                    {form.description.length}/{DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={handleChange("description")}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none ${
                    fieldErrors.description ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {fieldErrors.description && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>
                )}
              </div>

              {/* نوع الشركة */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {t("company.profile.fields.company_type")}
                </label>
                <select
                  value={form.company_type}
                  onChange={handleChange("company_type")}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                    fieldErrors.company_type ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <option value="">{t("company.profile.fields.select_company_type")}</option>
                  {Object.entries(COMPANY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{isAr ? label.ar : label.en}</option>
                  ))}
                </select>
                {fieldErrors.company_type && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.company_type}</p>
                )}
              </div>

              {/* المحافظة */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {t("company.profile.fields.governorate")}
                </label>
                <select
                  value={form.governorate}
                  onChange={handleChange("governorate")}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                    fieldErrors.governorate ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <option value="">{t("company.profile.fields.select_governorate")}</option>
                  {Object.entries(CITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {fieldErrors.governorate && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.governorate}</p>
                )}
              </div>

              {/* الموقع الإلكتروني */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {t("company.profile.fields.website_url")}
                </label>
                <input
                  type="url"
                  value={form.website_url || ""}
                  onChange={handleChange("website_url")}
                  placeholder="https://"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                    fieldErrors.website_url ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {fieldErrors.website_url && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.website_url}</p>
                )}
              </div>

              {/* رقم الهاتف */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {t("company.profile.fields.phone_number")}
                </label>
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={handleChange("phone_number")}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                    fieldErrors.phone_number ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {fieldErrors.phone_number && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.phone_number}</p>
                )}
              </div>

              {/* لينكدإن */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {t("company.profile.fields.linkedin_url")}
                </label>
                <input
                  type="url"
                  value={form.linkedin_url || ""}
                  onChange={handleChange("linkedin_url")}
                  placeholder="https://linkedin.com/company/..."
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                    fieldErrors.linkedin_url ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {fieldErrors.linkedin_url && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.linkedin_url}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {isDirty && !saving && (
                <span className="text-xs text-amber-600">
                  {t("company.profile.unsaved_changes")}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#1e3a5f] hover:bg-[#16304f] disabled:opacity-50 text-white text-sm font-medium rounded-xl transition"
              >
                {saving ? t("company.profile.saving") : t("company.profile.save")}
              </button>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  )
}
