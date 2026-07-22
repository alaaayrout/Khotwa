import { useState } from "react"
import { Link } from "react-router-dom"
import { inputClass, labelClass, btnPrimary } from "../utils/styles"
import { useTranslation } from "react-i18next"
import { isEmailFormatValid } from "../utils/validation"
import { API_BASE } from "../config"

export default function ForgotPassword() {
  const { t, i18n } = useTranslation()
  const textDir = i18n.language === "ar" ? "rtl" : "ltr"
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!email || !isEmailFormatValid(email)) {
      setError(t("password_reset.error_invalid_email"))
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/password/reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(t("password_reset.request_success"))
      } else {
        setError(data.error || t("password_reset.request_error"))
      }
    } catch {
      setError(t("password_reset.request_error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl" dir={textDir}>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t("password_reset.title")}</h2>
        <p className="text-sm text-gray-500 mb-6">{t("password_reset.subtitle")}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>{t("password_reset.email")}</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`${btnPrimary} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading ? t("password_reset.sending") : t("password_reset.submit")}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5">
          {t("password_reset.remembered")}{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            {t("password_reset.back_to_login")}
          </Link>
        </p>
      </div>
    </div>
  )
}
