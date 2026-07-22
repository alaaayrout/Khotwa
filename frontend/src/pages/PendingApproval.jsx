import { useTranslation } from "react-i18next"

export default function PendingApproval() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === "ar"
  const dir = isAr ? "rtl" : "ltr"

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background — نفس تصميم صفحات التسجيل */}
      <div className="absolute inset-0" style={{background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)"}} />
      <div className="absolute inset-0 opacity-30" style={{backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 45%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%), radial-gradient(circle at 60% 85%, #0ea5e9 0%, transparent 40%)"}} />
      <div className="absolute inset-0 opacity-5" style={{backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.3) 60px, rgba(255,255,255,0.3) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.3) 60px, rgba(255,255,255,0.3) 61px)"}} />

      {/* Left Panel */}
      <div className="hidden lg:flex w-[42%] flex-col justify-between p-14 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-white">Job<span className="text-blue-300">Portal</span></span>
          <button
            onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
            className="px-4 py-1.5 rounded-full text-xs font-medium border border-white/20 text-white/70 hover:border-white/50 hover:text-white transition"
          >
            {isAr ? "EN" : "ع"}
          </button>
        </div>

        <div>
          {/* Animated steps */}
          <div className="flex flex-col gap-4 mb-10">
            {[
              { ar: "تسجيل الحساب",       en: "Account Created",     done: true },
              { ar: "مراجعة الطلب",        en: "Application Review",  done: false, active: true },
              { ar: "تفعيل الحساب",        en: "Account Activated",   done: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all ${
                  step.done ? "bg-green-500 text-white" :
                  step.active ? "bg-blue-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.6)]" :
                  "bg-white/10 text-white/30"
                }`}>
                  {step.done ? "✓" : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-medium ${step.done || step.active ? "text-white" : "text-white/30"}`}>
                    {isAr ? step.ar : step.en}
                  </p>
                  {step.active && (
                    <p className="text-xs text-blue-300 mt-0.5">
                      {isAr ? "جارٍ المراجعة..." : "In progress..."}
                    </p>
                  )}
                </div>
                {step.active && (
                  <div className="mr-auto ml-0 rtl:ml-auto rtl:mr-0">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-white/40 text-xs leading-relaxed">
            {isAr
              ? "فريقنا يراجع طلبك بعناية. سنتواصل معك عبر البريد الإلكتروني فور اتخاذ القرار."
              : "Our team is carefully reviewing your application. We'll contact you via email as soon as a decision is made."}
          </p>
        </div>

        <p className="text-xs text-white/20">© 2025 JobPortal</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20 text-center" dir={dir}>

          {/* Mobile lang toggle */}
          <div className="lg:hidden flex justify-between items-center mb-6">
            <span className="text-lg font-bold text-gray-900">Job<span className="text-blue-600">Portal</span></span>
            <button
              onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
              className="px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
            >
              {isAr ? "EN" : "ع"}
            </button>
          </div>

          {/* Icon */}
          <div className="relative mx-auto mb-8 w-24 h-24">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{background: "linear-gradient(135deg, #3b82f6, #6366f1)"}} />
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{background: "linear-gradient(135deg, #1e3a5f, #3b82f6)"}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {t("pending.title")}
          </h2>
          <p className="text-sm text-gray-500 mb-2 leading-relaxed">
            {t("pending.message")}
          </p>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            {t("pending.email_note")}
          </p>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-8">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-amber-700">
              {isAr ? "قيد المراجعة" : "Under Review"}
            </span>
          </div>

          {/* What's next */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-start">
            <p className="text-xs font-bold text-gray-700 mb-3 text-center">
              {isAr ? "ماذا يحدث الآن؟" : "What happens next?"}
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                { icon: "🔍", ar: "يراجع فريقنا بيانات شركتك", en: "Our team reviews your company details" },
                { icon: "📧", ar: "ستصلك رسالة بقرار القبول", en: "You'll receive an email with our decision" },
                { icon: "🚀", ar: "بعد القبول، ابدأ بنشر وظائفك", en: "After approval, start posting jobs" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <p className="text-xs text-gray-500">{isAr ? item.ar : item.en}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-400">
              {t("pending.contact")}{" "}
              <a href="mailto:support@jobportal.com" className="text-blue-600 hover:underline font-medium">
                support@jobportal.com
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
