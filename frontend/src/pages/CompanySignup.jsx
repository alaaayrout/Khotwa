import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import EyeIcon from "../components/EyeIcon"
import CountryCodeSelect from "../components/CountryCodeSelect"
import { sanitizePhoneNumber } from "../utils/validation"
import { inputClass, labelClass } from "../utils/styles"

import { API_BASE } from "../config"

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = {
  REGISTER: "register",
  OTP: "otp",
  SUCCESS: "success",
}

const GOVERNORATE_AR = { damascus:"دمشق", rural_damascus:"ريف دمشق", aleppo:"حلب", homs:"حمص", hama:"حماة", latakia:"اللاذقية", tartus:"طرطوس", deir_ezzor:"دير الزور", raqqa:"الرقة", hasakah:"الحسكة", daraa:"درعا", suwayda:"السويداء", quneitra:"القنيطرة", idlib:"إدلب" }
const COMPANY_TYPE_AR = { programming:"تقنية المعلومات", civil:"هندسة مدنية", healthcare:"الصحة", education:"التعليم", finance:"المال والأعمال", marketing:"التسويق والإعلام", hospitality:"الضيافة والسياحة", other:"أخرى" }

const FALLBACK_GOVERNORATES = [
  { value: "damascus",       label: "Damascus" },
  { value: "rural_damascus", label: "Rural Damascus" },
  { value: "aleppo",         label: "Aleppo" },
  { value: "homs",           label: "Homs" },
  { value: "hama",           label: "Hama" },
  { value: "latakia",        label: "Latakia" },
  { value: "tartus",         label: "Tartus" },
  { value: "deir_ezzor",     label: "Deir ez-Zor" },
  { value: "raqqa",          label: "Raqqa" },
  { value: "hasakah",        label: "Al-Hasakah" },
  { value: "daraa",          label: "Daraa" },
  { value: "suwayda",        label: "As-Suwayda" },
  { value: "quneitra",       label: "Quneitra" },
  { value: "idlib",          label: "Idlib" },
]

const FALLBACK_COMPANY_TYPES = [
  { value: "programming", label: "Programming" },
  { value: "civil",       label: "Civil" },
  { value: "healthcare",  label: "Healthcare" },
  { value: "education",   label: "Education" },
  { value: "finance",     label: "Finance" },
  { value: "marketing",   label: "Marketing" },
  { value: "hospitality", label: "Hospitality" },
  { value: "other",       label: "Other" },
]

export default function CompanySignup() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === "ar"
  const dir = isAr ? "rtl" : "ltr"
  const navigate = useNavigate()

  // ─── Step state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(STEPS.REGISTER)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [governorates, setGovernorates] = useState(FALLBACK_GOVERNORATES)
  const [companyTypes, setCompanyTypes] = useState(FALLBACK_COMPANY_TYPES)
  const [choicesLoading, setChoicesLoading] = useState(false)
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    phone: "",
    phoneCountryCode: "+963",
    governorate: "",
    companyType: "",
    website: "",
    description: "",
    password: "",
    confirmPassword: "",
  })

  // ─── OTP state ──────────────────────────────────────────────────────────────
  const [otpValues, setOtpValues] = useState(Array(6).fill(""))
  const [otp, setOtp] = useState("")
  const [cooldown, setCooldown] = useState(60)
  const inputRefs = useRef([])

  // ─── Fetch choices ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/choices/`)
      .then(r => { if (!r.ok) throw new Error("failed"); return r.json() })
      .then(data => {
        if (data.governorates?.length) setGovernorates(data.governorates)
        if (data.company_types?.length) setCompanyTypes(data.company_types)
      })
      .catch(() => {})
      .finally(() => setChoicesLoading(false))
  }, [])

  // ─── Cooldown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== STEPS.OTP || cooldown <= 0) return
    const timer = setInterval(() => setCooldown((p) => p - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown, step])

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    if (fieldErrors[field]) setFieldErrors(p => ({ ...p, [field]: "" }))
    setError("")
  }

  // ─── OTP handlers ───────────────────────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    const digit = val.replace(/\D/g, "").slice(-1)
    const next = [...otpValues]
    next[idx] = digit
    setOtpValues(next)
    setOtp(next.join(""))
    setError("")
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      const next = [...otpValues]
      if (next[idx]) { next[idx] = "" }
      else if (idx > 0) { next[idx - 1] = ""; inputRefs.current[idx - 1]?.focus() }
      setOtpValues(next)
      setOtp(next.join(""))
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const next = Array(6).fill("")
    paste.split("").forEach((ch, i) => { next[i] = ch })
    setOtpValues(next)
    setOtp(next.join(""))
    inputRefs.current[Math.min(paste.length, 5)]?.focus()
  }

  const resolveApiError = (data, fallbackKey) =>
    data?.error_code ? t(`company_signup.${data.error_code}`) : t(fallbackKey)

  // ─── STEP 1: Submit registration ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: t("company_signup.error_password_match") })
      return
    }
    if (form.password.length < 6) {
      setFieldErrors({ password: t("company_signup.error_password_length") })
      return
    }
    setError("")
    setFieldErrors({})
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/company/register/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: form.companyName, email: form.email, phone_number: `${form.phoneCountryCode}${form.phone}`, governorate: form.governorate, company_type: form.companyType, website_url: form.website || undefined, description: form.description, password: form.password, password_confirm: form.confirmPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setCooldown(60)
        setStep(STEPS.OTP)
      } else {
        const apiFieldMap = {
          company_name:     "companyName",
          phone_number:     "phone",
          governorate:      "governorate",
          company_type:     "companyType",
          website_url:      "website",
          description:      "description",
          password:         "password",
          password_confirm: "confirmPassword",
        }
        const newErrors = {}
        let generalError = ""
        Object.entries(data).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? val[0] : val
          const fk = apiFieldMap[key]
          if (fk) newErrors[fk] = msg; else generalError = msg
        })
        setFieldErrors(newErrors)
        if (generalError) setError(generalError)
      }
    } catch { setError(t("company_signup.error_network")) }
    finally { setLoading(false) }
  }

  // ─── STEP 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/company/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      })
      const data = await res.json()
      if (!res.ok) { setError(resolveApiError(data, "company_signup.error_otp_invalid")); return }
      navigate("/company/pending")
    } catch {
      setError(t("company_signup.error_network"))
    } finally {
      setLoading(false)
    }
  }

  // ─── STEP 2: Resend OTP ─────────────────────────────────────────────────────
const handleResendOtp = async () => {
  if (cooldown > 0) return
  setError("")
  setLoading(true)
  try {
    const res = await fetch(`${API_BASE}/auth/company/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name:     form.companyName,
        email:            form.email,
        phone_number:     `${form.phoneCountryCode}${form.phone}`,
        governorate:      form.governorate,
        company_type:     form.companyType,
        website_url:      form.website || undefined,
        description:      form.description,
        password:         form.password,
        password_confirm: form.confirmPassword,
      }),
    })
    const data = await res.json()

    if (data?.otp_error === "otp_error_wait") {
      setError(t("company_signup.otp_error_wait"))
      return
    }
    if (data?.otp_error === "otp_error_limit") {
      setError(t("company_signup.otp_error_limit"))
      return
    }


    if (data?.error_code === "company_pending_approval") {
      setError(t("company_signup.already_verified_pending"))
      return
    }

    if (!res.ok) {
      setError(resolveApiError(data, "company_signup.error_network"))
      return
    }

    setCooldown(60)
    setOtpValues(Array(6).fill(""))
    setOtp("")
  } catch {
    setError(t("company_signup.error_network"))
  } finally {
    setLoading(false)
  }
}

  // ─── Styling helpers (from origin/main) ─────────────────────────────────────
  const inputCls = (hasErr) =>
    `w-full px-4 py-2.5 border-2 rounded-xl text-sm bg-white/60 backdrop-blur-sm focus:outline-none focus:bg-white transition-all duration-200 ${hasErr ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"}`
  const lbl = "block text-xs font-semibold text-gray-600 mb-1.5"
  const pwCls = (hasErr) =>
    `w-full py-2.5 border-2 rounded-xl text-sm bg-white/60 focus:outline-none focus:bg-white transition-all duration-200 ${dir === "rtl" ? "pr-4 pl-10" : "pl-4 pr-10"} ${hasErr ? "border-red-400" : "border-gray-200 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"}`

  // ─── Shared left panel + lang toggle ────────────────────────────────────────
  const LeftPanel = () => (
    <div className="hidden lg:flex w-[38%] flex-col justify-between p-14 relative z-10">
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold text-white">{t("navbar.title")}</span>
        <button onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
          className="px-4 py-1.5 rounded-full text-xs font-medium border border-white/20 text-white/70 hover:border-white/50 hover:text-white transition">
          {isAr ? "EN" : "ع"}
        </button>
      </div>
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-blue-300 font-medium">{isAr ? "تسجيل شركة جديدة" : "New Company Registration"}</span>
        </div>
        <h2 className="text-4xl font-bold text-white leading-tight mb-4">
          {isAr ? (<>انضم إلى<br/><span className="text-blue-300">منصتنا</span><br/>وابحث عن<br/>أفضل الكفاءات</>) : (<>Join Our<br/><span className="text-blue-300">Platform</span><br/>& Find Top<br/>Talent</>)}
        </h2>
        <p className="text-white/50 text-sm leading-relaxed mb-10">
          {isAr ? "انشر وظائفك وتواصل مع أفضل المواهب في سوريا" : "Post jobs and connect with the best talent in Syria"}
        </p>
        <div className="flex flex-col gap-3">
          {[
            { icon: "📋", ar: "انشر وظائفك بسهولة", en: "Post jobs easily" },
            { icon: "👥", ar: "تصفّح المتقدمين", en: "Browse applicants" },
            { icon: "✅", ar: "وظّف الأفضل", en: "Hire the best" },
          ].map(s => (
            <div key={s.icon} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <span className="text-lg">{s.icon}</span>
              <span className="text-sm text-white/70">{isAr ? s.ar : s.en}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-white/20">© 2025 {t("home.footer_name")}</p>
    </div>
  )

  const Background = () => (
    <>
      <div className="absolute inset-0" style={{background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)"}} />
      <div className="absolute inset-0 opacity-30" style={{backgroundImage: "radial-gradient(circle at 15% 50%, #3b82f6 0%, transparent 45%), radial-gradient(circle at 85% 20%, #6366f1 0%, transparent 40%), radial-gradient(circle at 70% 85%, #0ea5e9 0%, transparent 40%)"}} />
      <div className="absolute inset-0 opacity-5" style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.3) 60px, rgba(255,255,255,0.3) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.3) 60px, rgba(255,255,255,0.3) 61px)"}} />
    </>
  )

  // ─── SUCCESS ─────────────────────────────────────────────────────────────────
  if (step === STEPS.SUCCESS) {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        <Background />
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20 text-center" dir={dir}>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("company_signup.success_title")}</h2>
            <p className="text-gray-500 text-sm mb-6">{t("company_signup.success_message")}</p>
            <button onClick={() => navigate("/login")}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
              style={{background: "linear-gradient(135deg, #1e3a5f, #3b82f6)"}}>
              {t("company_signup.go_to_login")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── OTP ─────────────────────────────────────────────────────────────────────
  if (step === STEPS.OTP) {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        <Background />
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20" dir={dir}>

            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-between mb-6">
              <span className="text-lg font-bold text-gray-900">Job<span className="text-blue-600">Portal</span></span>
              <button onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
                className="px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
                {isAr ? "EN" : "ع"}
              </button>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">{t("company_signup.otp_title")}</h2>
              <p className="text-sm text-gray-400 mt-1">
                {t("company_signup.otp_subtitle")}{" "}
                <span className="font-medium text-gray-700">{form.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex gap-2 justify-center" dir="ltr">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    onPaste={handleOtpPaste}
                    onFocus={(e) => e.target.select()}
                    className="w-12 h-14 text-center text-xl font-medium border-2 border-gray-200 rounded-xl bg-white/60 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] outline-none transition"
                  />
                ))}
              </div>

              {error && <p className="text-red-500 text-xs text-center bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background: "linear-gradient(135deg, #1e3a5f, #3b82f6)"}}>
                {loading ? (
                  <><svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>{t("company_signup.verifying")}</>
                ) : t("company_signup.verify")}
              </button>
            </form>

            <div className="flex justify-between mt-4 text-sm">
              <button onClick={handleResendOtp} disabled={loading || cooldown > 0}
                className="text-blue-600 hover:underline disabled:opacity-50">
                {cooldown > 0
                  ? t("company_signup.resend_code_in", { seconds: cooldown })
                  : t("company_signup.resend_code")}
              </button>
              <button onClick={() => { setStep(STEPS.REGISTER); setError(""); setOtpValues(Array(6).fill("")); setOtp("") }}
                className="text-gray-500 hover:underline">
                {t("company_signup.back")}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── REGISTER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <Background />
      <LeftPanel />

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 my-6" dir={dir}>

          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <span className="text-lg font-bold text-gray-900">Job<span className="text-blue-600">Portal</span></span>
            <button onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
              className="px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
              {isAr ? "EN" : "ع"}
            </button>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900">{t("company_signup.title")}</h1>
            <p className="text-sm text-gray-400 mt-1">{isAr ? "أنشئ حساب شركتك وابدأ بنشر الوظائف" : "Create your company account and start posting jobs"}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* اسم الشركة */}
            <div>
              <label className={lbl} style={{textAlign:"start", display:"block"}}>{t("company_signup.company_name")}</label>
              <input type="text" required placeholder={t("company_signup.company_name_placeholder")}
                value={form.companyName} onChange={(e) => handleChange("companyName", e.target.value)}
                className={inputCls(!!fieldErrors.companyName)} />
              {fieldErrors.companyName && <p className="text-red-500 text-xs mt-1">{fieldErrors.companyName}</p>}
            </div>

            {/* الإيميل */}
            <div>
              <label className={lbl} style={{textAlign:"start", display:"block"}}>{t("company_signup.email")}</label>
              <input type="email" required placeholder="example@company.com"
                value={form.email} onChange={(e) => handleChange("email", e.target.value)}
                className={inputCls(!!fieldErrors.email)} />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            {/* الهاتف */}
            <div>
              <label className={lbl} style={{textAlign:"start", display:"block"}}>{t("company_signup.phone")}</label>
              <div className="flex gap-2">
                <div className="w-44 flex-shrink-0">
                  <CountryCodeSelect value={form.phoneCountryCode} onChange={(v) => handleChange("phoneCountryCode", v)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white/60 focus:outline-none focus:border-blue-500 transition" />
                </div>
                <input type="tel" required placeholder="9X XXX XXXX"
                  value={form.phone} onChange={(e) => handleChange("phone", sanitizePhoneNumber(e.target.value))}
                  className={`flex-1 ${inputCls(!!fieldErrors.phone)}`} />
              </div>
              {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
            </div>

            {/* المحافظة + النوع */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl} style={{textAlign:"start", display:"block"}}>{t("company_signup.governorate")}</label>
                <select required value={form.governorate} onChange={(e) => handleChange("governorate", e.target.value)}
                  className={inputCls(!!fieldErrors.governorate)}>
                  <option value="">{t("company_signup.select")}</option>
                  {governorates.map(g => <option key={g.value} value={g.value}>{isAr ? (GOVERNORATE_AR[g.value] || g.label) : g.label}</option>)}
                </select>
                {fieldErrors.governorate && <p className="text-red-500 text-xs mt-1">{fieldErrors.governorate}</p>}
              </div>
              <div>
                <label className={lbl} style={{textAlign:"start", display:"block"}}>{t("company_signup.sector")}</label>
                <select required value={form.companyType} onChange={(e) => handleChange("companyType", e.target.value)}
                  className={inputCls(!!fieldErrors.companyType)}>
                  <option value="">{t("company_signup.select")}</option>
                  {companyTypes.map(s => <option key={s.value} value={s.value}>{isAr ? (COMPANY_TYPE_AR[s.value] || s.label) : s.label}</option>)}
                </select>
                {fieldErrors.companyType && <p className="text-red-500 text-xs mt-1">{fieldErrors.companyType}</p>}
              </div>
            </div>

            {/* الموقع */}
            <div>
              <label className={lbl} style={{textAlign:"start", display:"block"}}>
                {t("company_signup.website")} <span className="text-gray-400 font-normal">({t("company_signup.optional")})</span>
              </label>
              <input type="url" placeholder="https://www.company.com"
                value={form.website} onChange={(e) => handleChange("website", e.target.value)}
                className={inputCls(false)} />
            </div>

            {/* الوصف */}
            <div>
              <label className={lbl} style={{textAlign:"start", display:"block"}}>{t("company_signup.description")}</label>
              <textarea required rows={3} placeholder={t("company_signup.description_placeholder")}
                value={form.description} onChange={(e) => handleChange("description", e.target.value)}
                className={`${inputCls(!!fieldErrors.description)} resize-none`} />
              {fieldErrors.description && <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>}
            </div>

            {/* كلمة المرور */}
            <div>
              <label className={lbl} style={{textAlign:"start", display:"block"}}>{t("company_signup.password")}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required placeholder="••••••••"
                  value={form.password} onChange={(e) => handleChange("password", e.target.value)}
                  className={pwCls(!!fieldErrors.password)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${dir === "rtl" ? "left-3" : "right-3"}`}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            {/* تأكيد كلمة المرور */}
            <div>
              <label className={lbl} style={{textAlign:"start", display:"block"}}>{t("company_signup.confirm_password")}</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} required placeholder="••••••••"
                  value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className={pwCls(!!fieldErrors.confirmPassword)} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${dir === "rtl" ? "left-3" : "right-3"}`}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
            </div>

            {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading || choicesLoading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              style={{background: "linear-gradient(135deg, #1e3a5f, #3b82f6)"}}>
              {loading ? (
                <><svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>{t("company_signup.submitting")}</>
              ) : t("company_signup.submit")}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
