import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LangToggle from "../components/LangToggle"

export default function Signup() {
  const { t, i18n } = useTranslation()
  const textDir = i18n.language === "ar" ? "rtl" : "ltr"
  const navigate = useNavigate()
  const [role, setRole] = useState(null) // null | "seeker" | "company"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

     <LangToggle />

      <div className="bg-white rounded-2xl shadow-xl p-10 w-[480px]" dir={textDir}>

        <h2 className="text-2xl font-medium text-gray-900 mb-2">
          {t("signup.create_account")}
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          {t("signup.already_have_account")}{" "}
          <Link to="/" className="text-blue-600 hover:underline">
            {t("signup.login")}
          </Link>
        </p>

        {/* اختيار الـ role */}
        <div className="flex flex-col gap-4">

          <button
            onClick={() => setRole("seeker")}
            className={`flex items-center gap-4 p-4 border-2 rounded-xl transition ${
              role === "seeker"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
              👤
            </div>
            <div dir={textDir}>
              <p className="font-medium text-gray-900 text-start">{t("signup.seeker_title")}</p>
              <p className="text-sm text-gray-500 text-start">{t("signup.seeker_desc")}</p>
            </div>
          </button>

          <button
            onClick={() => setRole("company")}
            className={`flex items-center gap-4 p-4 border-2 rounded-xl transition ${
              role === "company"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
              🏢
            </div>
            <div dir={textDir}>
              <p className="font-medium text-gray-900 text-start">{t("signup.company_title")}</p>
              <p className="text-sm text-gray-500 text-start">{t("signup.company_desc")}</p>
            </div>
          </button>

        </div>

        <button
          disabled={!role}
          onClick={() => navigate(`/signup/${role}`)}
          className="w-full mt-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
        >
          {t("signup.continue")}
        </button>

      </div>
    </div>
  )
}