import { useState, useRef } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LangToggle from "../components/LangToggle"

import { API_BASE } from "../config"

export default function OtpVerification() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const textDir = i18n.language === "ar" ? "rtl" : "ltr"
  const state = location.state || {}
  const email = state.email || ""
  const userType = state.userType || "company"

  const [otpValues, setOtpValues] = useState(Array(6).fill(""))
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef([])

  const handleOtpChange = (value, idx) => {
    const digit = value.replace(/\D/g, "").slice(-1)
    const next = [...otpValues]
    next[idx] = digit
    setOtpValues(next)
    setOtp(next.join(""))
    setError("")
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleOtpKeyDown = (event, idx) => {
    if (event.key !== "Backspace") return
    event.preventDefault()
    const next = [...otpValues]
    if (next[idx]) {
      next[idx] = ""
    } else if (idx > 0) {
      next[idx - 1] = ""
      inputRefs.current[idx - 1]?.focus()
    }
    setOtpValues(next)
    setOtp(next.join(""))
  }

  const handleOtpPaste = (event) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const next = Array(6).fill("")
    pasted.split("").forEach((char, index) => { next[index] = char })
    setOtpValues(next)
    setOtp(next.join(""))
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    setError("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email) return
    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const endpoint = userType === "company"
        ? `${API_BASE}/auth/company/verify-otp/`
        : `${API_BASE}/auth/job-seeker/verify-otp/`

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || data.error_code || t("error_otp_invalid"))
        return
      }

      if (userType === "company" && data.approval_status === "pending_admin_approval") {
        navigate("/company/pending")
      } else if (userType === "company") {
        navigate("/company/pending")
      } else {
        navigate("/login")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LangToggle />
        <div className="bg-white rounded-2xl shadow-xl p-10 w-[480px] text-center" dir={textDir}>
          <h2 className="text-2xl font-medium text-gray-900 mb-4">Verification required</h2>
          <p className="text-gray-500 mb-6">Registration details are missing. Please return to the company signup page.</p>
          <Link
            to="/signup/company"
            className="inline-block px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to company signup
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LangToggle />
      <div className="bg-white rounded-2xl shadow-xl p-10 w-[480px]" dir={textDir}>
        <h2 className="text-2xl font-medium text-gray-900 mb-2">{t("otp_title")}</h2>
        <p className="text-gray-500 text-sm mb-6">
          {t("otp_subtitle")} <span className="font-medium text-gray-800">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2 justify-center" dir="ltr">
            {otpValues.map((value, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value}
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                onPaste={handleOtpPaste}
                className="w-12 h-14 text-center text-xl font-medium border border-gray-200 rounded-lg bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  )
}
