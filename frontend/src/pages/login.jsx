import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import EyeIcon from "../components/EyeIcon"
import LangToggle from "../components/LangToggle"
import { inputClass, labelClass, btnPrimary } from "../utils/styles"
import { useTranslation } from "react-i18next"

import { API_BASE } from "../config"

export default function Login() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const textDir = i18n.language === "ar" ? "rtl" : "ltr"
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

function handlePostLoginRedirect(data) {
  const userType =
    data.user_type || data.user?.user_type

  if (userType === "company") {
    navigate("/company/dashboard")
  } else if (userType === "job_seeker") {
    navigate("/")
  }
}

  // بتجرب تسجيل دخول كأدمن (endpoint منفصل، موديل AdminUser منفصل).
  // بترجع true إذا نجحت (وبهالحالة بتوجّه مباشرة لـ /admin)، وfalse إذا لأ.
  const tryAdminLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })

      if (!res.ok) return false

      const data = await res.json()
      if (!data.token) return false

      localStorage.setItem("admin_token", data.token)
      navigate("/admin")
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.email || !form.password) {
      setError(t("login.error_required"))
      return
    }

    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem("token", data.token)
        // Redirect based on role if backend provided `user_type`
        handlePostLoginRedirect(data)
        return
      }

      // مو باحث عن عمل ولا شركة (البريد/الباسورد ما انطابقو بجدول users العادي)
      // قبل ما نطلع رسالة خطأ، منجرب إذا هيدا أصلاً حساب أدمن.
      const loggedInAsAdmin = await tryAdminLogin()
      if (!loggedInAsAdmin) {
        const firstError = Object.values(data)[0]
        setError(Array.isArray(firstError) ? firstError[0] : firstError)
      }

    } catch {
      setError(t("login.error_network"))
    } finally {
      setLoading(false)
    }
  }
//new
const handleGoogleLogin = async (response) => {
  try {
    const res = await fetch(`${API_BASE}/auth/google/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_token: response.credential,
      }),
    })

    const data = await res.json()
    console.log("Google login response:", data)

    if (res.ok) {
     

    localStorage.setItem("token", data.token)

    // Redirect based on role if backend provided `user_type`
    handlePostLoginRedirect(data)
    } 
    else {
      setError(data.error || "Google login failed")

     
      if (data.error?.includes("not registered")) {
        navigate("/signup")
      }
    }
  } catch (err) {
    console.error(err)
    setError("Network error during Google login")
  }
}
//new

  useEffect(() => {
  if (!window.google) return;

  window.google.accounts.id.initialize({
    client_id: "86559827847-b7o0637pefu1fvsn9du0o8476kb04s69.apps.googleusercontent.com",
    callback: handleGoogleLogin,
  });

  const googleBtn = document.getElementById("googleBtn");

if (googleBtn) {
  googleBtn.innerHTML = "";

  window.google.accounts.id.renderButton(
    googleBtn,
    { theme: "outline", size: "large" }
  );
}
}, []);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LangToggle />

      <div className="w-[900px] h-[520px] flex-wrap bg-white rounded-2xl shadow-xl overflow-hidden flex">

        {/* ===== Left Side ===== */}
        <div className="hidden md:flex w-[45%] bg-gradient-to-br from-blue-900 to-blue-500 flex-col justify-between p-10 relative overflow-hidden">
          <div className="absolute w-56 h-56 rounded-full border border-white/10 -top-14 -right-14" />
          <div className="absolute w-40 h-40 rounded-full border border-white/10 -bottom-10 -left-12" />

          <span className="text-white text-2xl font-medium">
            <span className="text-blue-200">{t("hero.brand")}</span>
          </span>

          <p className="text-white text-2xl font-medium leading-relaxed">
            {t("hero.tagline_1")} <br />
            <span className="text-blue-200">{t("hero.tagline_2")}</span>
          </p>

          <div className="flex gap-8">
            <div className="text-white/80">
              <strong className="block text-lg text-white">+500</strong>
              <small className="text-xs opacity-70">{t("hero.companies")}</small>
            </div>
            <div className="text-white/80">
              <strong className="block text-lg text-white">+2K</strong>
              <small className="text-xs opacity-70">{t("hero.jobs")}</small>
            </div>
          </div>
        </div>

        {/* ===== Right Side ===== */}
        <div className="w-full md:w-[55%] flex flex-col justify-center px-10 py-12" dir={textDir}>
          <h2 className="text-2xl font-medium text-gray-900 mb-1">{t("login.title")}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {t("login.no_account")}{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              {t("login.register")}
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div>
              <label className={labelClass}>{t("login.email")}</label>
              <input
                type="email"
                required
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={labelClass}>{t("login.password")}</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  {t("login.forgot")}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${textDir === "rtl" ? "left-3" : "right-3"}`}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`${btnPrimary} flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  {t("login.loading")}
                </>
              ) : (
                t("login.submit")
              )}
            </button>

          </form>

          <div className="flex items-center gap-3 my-4 text-xs text-gray-400">
            <span className="flex-1 h-px bg-gray-200" />
            {t("login.or")}
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <div id="googleBtn"></div>
        </div>

      </div>
    </div>
  )
}