import { useEffect, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { inputClass, labelClass, btnPrimary } from "../utils/styles"
import { useTranslation } from "react-i18next"
import { isPasswordLengthValid } from "../utils/validation"

import { API_BASE } from "../config"

export default function ResetPassword() {
  const { uidb64, token } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const textDir = i18n.language === "ar" ? "rtl" : "ltr"
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)

  useEffect(() => {
    async function validateToken() {
      setValidating(true)
      setError("")
      try {
        const res = await fetch(`${API_BASE}/auth/password/reset/validate/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uidb64, token }),
        })

        if (res.ok) {
          setIsValidToken(true)
        } else {
          const data = await res.json()
          setError(data.error || t("password_reset.invalid_token"))
        }
      } catch {
        setError(t("password_reset.invalid_token"))
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [uidb64, token, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!isPasswordLengthValid(newPassword)) {
      setError(t("password_reset.password_length_error"))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t("password_reset.password_mismatch"))
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/password/reset/confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uidb64,
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(t("password_reset.reset_success"))
        setTimeout(() => navigate("/login"), 3000)
      } else {
        setError(data.error || t("password_reset.reset_error"))
      }
    } catch {
      setError(t("password_reset.reset_error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl" dir={textDir}>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t("password_reset.reset_title")}</h2>
        <p className="text-sm text-gray-500 mb-6">{t("password_reset.reset_subtitle")}</p>

        {validating ? (
          <p className="text-sm text-gray-600">{t("password_reset.validating")}</p>
        ) : isValidToken ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>{t("password_reset.new_password")}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t("password_reset.confirm_password")}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? t("password_reset.saving") : t("password_reset.submit_new")}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Link to="/forgot-password" className="text-blue-600 hover:underline">
              {t("password_reset.try_again")}
            </Link>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-5">
          <Link to="/login" className="text-blue-600 hover:underline">
            {t("password_reset.back_to_login")}
          </Link>
        </p>
      </div>
    </div>
  )
}
