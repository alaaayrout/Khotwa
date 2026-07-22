import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import EyeIcon from "../components/EyeIcon"
import CountryCodeSelect from "../components/CountryCodeSelect"
import { sanitizePhoneNumber, sanitizeFullName, isEmailFormatValid, isPasswordLengthValid, doPasswordsMatch } from "../utils/validation"

import { API_BASE } from "../config"
const STEPS = { REGISTER: "register", OTP: "otp", SUCCESS: "success" }

export default function SeekerSignup() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = i18n.language === "ar"
  const dir = isAr ? "rtl" : "ltr"

  const [step, setStep] = useState(STEPS.REGISTER)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" })
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", phoneCountryCode: "+963", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [otpValues, setOtpValues] = useState(Array(6).fill(""))
  const [otp, setOtp] = useState("")
  const [cooldown, setCooldown] = useState(60)
  const inputRefs = useRef([])

  useEffect(() => {
    if (step !== STEPS.OTP || cooldown <= 0) return
    const timer = setInterval(() => setCooldown((p) => p - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown, step])

  const updateFieldError = (field, msg) => setFieldErrors((p) => ({ ...p, [field]: msg }))

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    if (fieldErrors[field]) setFieldErrors(p => ({ ...p, [field]: "" }))
    setError("")
  }

  const handleOtpChange = (val, idx) => {
    const digit = val.replace(/\D/g, "").slice(-1)
    const next = [...otpValues]; next[idx] = digit
    setOtpValues(next); setOtp(next.join("")); setError("")
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus()
  }
  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      const next = [...otpValues]
      if (next[idx]) { next[idx] = "" } else if (idx > 0) { next[idx - 1] = ""; inputRefs.current[idx - 1]?.focus() }
      setOtpValues(next); setOtp(next.join(""))
    }
  }
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const next = Array(6).fill("")
    paste.split("").forEach((ch, i) => { next[i] = ch })
    setOtpValues(next); setOtp(next.join(""))
    inputRefs.current[Math.min(paste.length, 5)]?.focus()
  }

  const resolveApiError = (data, fallback) => data?.error_code ? t(`seeker_signup.${data.error_code}`) : t(fallback)

const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.phone || !form.password || !form.confirmPassword) { setError(t("seeker_signup.error_required")); return }
    if (Object.values(fieldErrors).some(Boolean)) return
    setError(""); setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/job-seeker/register/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.fullName, email: form.email, phone_number: `${form.phoneCountryCode}${form.phone}`, password: form.password, password_confirm: form.confirmPassword }),
      })
      const data = await res.json()
if (!res.ok) {
  const apiFieldMap = {
    full_name:        "fullName",
    email:            "email",
    phone_number:     "phone",
    password:         "password",
    password_confirm: "confirmPassword",
  }
  const newErrors = {}
  let generalError = ""

  Object.entries(data).forEach(([key, val]) => {
    const msg = Array.isArray(val) ? val[0] : val
    const fk = apiFieldMap[key]
    if (fk) newErrors[fk] = t(`seeker_signup.${msg}`)
    else generalError = typeof msg === "string" ? msg : JSON.stringify(msg)
  })

  setFieldErrors(p => ({ ...p, ...newErrors }))
  if (generalError) setError(generalError)
  return
}
      setStep(STEPS.OTP)
    } catch { setError(t("seeker_signup.error_network")) }
    finally { setLoading(false) }
  }
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setError(""); setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/job-seeker/verify-otp/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      })
      const data = await res.json()
      if (!res.ok) { setError(resolveApiError(data, "seeker_signup.error_otp_invalid")); return }
      setStep(STEPS.SUCCESS)
    } catch { setError(t("seeker_signup.error_network")) }
    finally { setLoading(false) }
  }

  const handleResendOtp = async () => {
    if (cooldown > 0) return
    setError(""); setLoading(true)
    try {
      await fetch(`${API_BASE}/auth/job-seeker/register/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.fullName, email: form.email, phone_number: `${form.phoneCountryCode}${form.phone}`, password: form.password, password_confirm: form.confirmPassword }),
      })
      setCooldown(60)
    } catch { setError(t("seeker_signup.error_network")) }
    finally { setLoading(false) }
  }

  const inputCls = (hasErr) => `w-full px-4 py-2.5 border-2 rounded-xl text-sm bg-white/60 backdrop-blur-sm focus:outline-none focus:bg-white transition-all duration-200 ${hasErr ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"}`
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5"

  // ─── SUCCESS ──────────────────────────────────────────────────────────────
  if (step === STEPS.SUCCESS) return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)"}}>
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-20" style={{background: "radial-gradient(circle, #3b82f6, transparent)"}} />
      <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full opacity-20" style={{background: "radial-gradient(circle, #10b981, transparent)"}} />
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-[420px] text-center border border-white/50" dir={dir}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6" style={{background: "linear-gradient(135deg, #10b981, #3b82f6)"}}>✓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("seeker_signup.success_title")}</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">{t("seeker_signup.success_message")}</p>
        <button onClick={() => navigate("/login")} className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.98]" style={{background: "linear-gradient(135deg, #1e3a5f, #3b82f6)"}}>
          {t("seeker_signup.go_to_login")}
        </button>
      </div>
    </div>
  )

  // ─── OTP ──────────────────────────────────────────────────────────────────
  if (step === STEPS.OTP) return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #faf5ff 100%)"}}>
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full opacity-15" style={{background: "radial-gradient(circle, #6366f1, transparent)"}} />
      <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full opacity-15" style={{background: "radial-gradient(circle, #3b82f6, transparent)"}} />
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 w-[440px] border border-white/50" dir={dir}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6" style={{background: "linear-gradient(135deg, #1e3a5f, #3b82f6)"}}>✉️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t("seeker_signup.otp_title")}</h2>
        <p className="text-gray-500 text-sm mb-8 text-center leading-relaxed">
          {t("seeker_signup.otp_subtitle")} <span className="font-semibold text-gray-800">{form.email}</span>
        </p>
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
          <div className="flex gap-3 justify-center" dir="ltr">
            {otpValues.map((val, idx) => (
              <input key={idx} ref={(el) => (inputRefs.current[idx] = el)}
                type="text" inputMode="numeric" maxLength={1} value={val}
                onChange={(e) => handleOtpChange(e.target.value, idx)}
                onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                onPaste={handleOtpPaste} onFocus={(e) => e.target.select()}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl bg-white/70 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] outline-none transition-all duration-200"
              />
            ))}
          </div>
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button type="submit" disabled={loading || otp.length !== 6}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.98] disabled:opacity-40"
            style={{background: "linear-gradient(135deg, #1e3a5f, #3b82f6)"}}>
            {loading ? t("seeker_signup.verifying") : t("seeker_signup.verify")}
          </button>
        </form>
        <div className="flex justify-between mt-5 text-sm">
          <button onClick={handleResendOtp} disabled={loading || cooldown > 0} className="text-blue-600 hover:underline disabled:opacity-40 font-medium">
            {cooldown > 0 ? t("seeker_signup.resend_code_in", { seconds: cooldown }) : t("seeker_signup.resend_code")}
          </button>
          <button onClick={() => { setStep(STEPS.REGISTER); setError(""); setOtpValues(Array(6).fill("")); setOtp("") }} className="text-gray-400 hover:text-gray-600">
            {t("seeker_signup.back")}
          </button>
        </div>
      </div>
    </div>
  )

  // ─── REGISTER ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0" style={{background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)"}} />
      <div className="absolute top-0 left-0 w-full h-full opacity-30" style={{backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%), radial-gradient(circle at 60% 80%, #0ea5e9 0%, transparent 40%)"}} />

      {/* Left Panel */}
      <div className="hidden lg:flex w-[42%] flex-col justify-between p-14 relative z-10">
        <button onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
          className="w-fit px-4 py-1.5 rounded-full text-xs font-medium border border-white/20 text-white/70 hover:border-white/50 hover:text-white transition backdrop-blur-sm">
          {isAr ? "EN" : "ع"}
        </button>
        <div>
          <div className="text-3xl font-bold text-white mb-1">Job<span className="text-blue-300">Portal</span></div>
          <p className="text-white/40 text-sm mb-12">{isAr ? "لوحة الشركة" : "Company Panel"}</p>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            {isAr ? (<>ابحث عن<br/><span className="text-blue-300">وظيفة أحلامك</span><br/>بسهولة</>)
                   : (<>Find Your<br/><span className="text-blue-300">Dream Job</span><br/>Easily</>)}
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-10">
            {isAr ? "آلاف الفرص بانتظارك في سوريا" : "Thousands of opportunities await you in Syria"}
          </p>
          <div className="flex flex-col gap-4">
            {[
              { num: "01", ar: "أنشئ حسابك مجاناً", en: "Create your free account" },
              { num: "02", ar: "أضف مهاراتك", en: "Add your skills" },
              { num: "03", ar: "قدّم على وظيفة أحلامك", en: "Apply for your dream job" },
            ].map(s => (
              <div key={s.num} className="flex items-center gap-3">
                <span className="text-xs font-bold text-blue-400 w-6">{s.num}</span>
                <span className="text-sm text-white/60">{isAr ? s.ar : s.en}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-8">
          {[{ num: "+2K", ar: "وظيفة", en: "Jobs" }, { num: "+500", ar: "شركة", en: "Companies" }].map(s => (
            <div key={s.num}>
              <p className="text-2xl font-bold text-white">{s.num}</p>
              <p className="text-xs text-white/40 mt-0.5">{isAr ? s.ar : s.en}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20" dir={dir}>

          {/* Mobile lang toggle */}
          <div className="lg:hidden flex justify-end mb-4">
            <button onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
              className="px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
              {isAr ? "EN" : "ع"}
            </button>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900">{t("seeker_signup.title")}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {isAr ? "سجّل حساباً جديداً للبحث عن وظيفة" : "Create a new account to find a job"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* الاسم */}
            <div>
              <label className={labelCls}>{t("seeker_signup.full_name")}</label>
              <input type="text" required placeholder={t("seeker_signup.full_name_placeholder")}
                value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)}
                className={inputCls(!!fieldErrors.fullName)} />
              {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>}
            </div>

            {/* الإيميل */}
            <div>
              <label className={labelCls} style={{textAlign:"start", display:"block"}}>{t("seeker_signup.email")}</label>
              <input type="email" required placeholder="example@email.com"
                value={form.email} onChange={(e) => handleChange("email", e.target.value)}
                className={inputCls(!!fieldErrors.email)} />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            {/* الهاتف */}
            <div>
              <label className={labelCls}>{t("seeker_signup.phone")}</label>
              <div className="flex gap-2">
                <div className="w-36 flex-shrink-0">
                  <CountryCodeSelect value={form.phoneCountryCode}
                    onChange={(v) => setForm((p) => ({ ...p, phoneCountryCode: v }))}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white/60 focus:outline-none focus:border-blue-500 transition" />
                </div>
                <input type="tel" required placeholder="9X XXX XXXX"
                  value={form.phone} onChange={(e) => handleChange("phone", e.target.value)}
                  className={`flex-1 ${inputCls(!!fieldErrors.phone)}`} />
              </div>
              {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
            </div>

            {/* كلمة المرور */}
            <div>
              <label className={labelCls}>{t("seeker_signup.password")}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required placeholder="••••••••"
                  value={form.password} onChange={(e) => handleChange("password", e.target.value)}
                  className={inputCls(!!fieldErrors.password)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${dir === "rtl" ? "left-3" : "right-3"}`}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            {/* تأكيد */}
            <div>
              <label className={labelCls}>{t("seeker_signup.confirm_password")}</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} required placeholder="••••••••"
                  value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className={inputCls(!!fieldErrors.confirmPassword)} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${dir === "rtl" ? "left-3" : "right-3"}`}>
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
            </div>

            {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              style={{background: "linear-gradient(135deg, #1e3a5f, #3b82f6)"}}>
              {loading ? (<><svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>{t("seeker_signup.submitting")}</>) : t("seeker_signup.submit")}
            </button>

          </form>

          <button onClick={() => { setStep(STEPS.REGISTER); setError(""); setOtpValues(Array(6).fill("")); setOtp("") }}
                className="text-gray-500 hover:underline">
            ← {t("seeker_signup.back")}
          </button>
        </div>
      </div>
    </div>
  )
}