import { useTranslation } from "react-i18next"

export default function LangToggle() {
  const { i18n } = useTranslation()

  return (
    <button
      onClick={() => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")}
      className="absolute top-4 left-4 px-3 py-1 border rounded-lg text-sm"
    >
      {i18n.language === "ar" ? "EN" : "ع"}
    </button>
  )
}