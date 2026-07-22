import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { motion, animate, useMotionValue, useTransform } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { API_BASE } from "../config"
import Navbar from "../components/Navbar"

function Counter({ from = 0, to }) {
  const count = useMotionValue(from)
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString())

  useEffect(() => {
    const controls = animate(count, to, { duration: 2, ease: "easeOut" })
    return controls.stop
  }, [to])

  return <motion.span>{rounded}</motion.span>
}

export default function About() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = i18n.language === "ar"
  const textDir = isAr ? "rtl" : "ltr"

  // ===== إحصائيات حقيقية، بنفس منطق جلب البيانات المستخدم في الصفحة الرئيسية =====
  const [jobs, setJobs] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const [seekersCount, setSeekersCount] = useState(0)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/`)
        if (res.ok) {
          const data = await res.json()
          setJobs(Array.isArray(data) ? data : data.results || [])
        } else {
          setStatsError(true)
        }
      } catch (err) {
        console.error("fetchJobs error:", err)
        setStatsError(true)
      } finally {
        setStatsLoading(false)
      }
    }
    const fetchSeekersCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobseekers/count/`)
        if (res.ok) {
          const data = await res.json()
          // نتوقع {"count": N} -- إذا كان الشكل الفعلي مختلف يجب تعديل هذا الجزء
          setSeekersCount(typeof data.count === "number" ? data.count : 0)
        }
      } catch (err) {
        console.error("fetchSeekersCount error:", err)
      }
    }
    fetchJobs()
    fetchSeekersCount()
  }, [])

  // نفس منطق تجميع الشركات المستخدم في الصفحة الرئيسية، لحساب عدد الشركات الحقيقي
  const totalCompaniesCount = useMemo(() => {
    const names = new Set(jobs.map(job => job.company_name?.trim()).filter(Boolean))
    return names.size
  }, [jobs])

  const IMPACT_STATS = [
    { num: jobs.length, label: t("about.stat_jobs") },
    { num: totalCompaniesCount, label: t("about.stat_companies") },
    { num: seekersCount, label: t("about.stat_seekers") },
  ]

  // ===== قيمنا =====
  const VALUES = [
    { icon: "🎯", key: "transparency", bg: "bg-blue-50" },
    { icon: "🤝", key: "equal_opportunity", bg: "bg-violet-50" },
    { icon: "⚡", key: "simplicity", bg: "bg-amber-50" },
    { icon: "🌱", key: "growth", bg: "bg-teal-50" },
  ]

  // ===== كيف تعمل المنصة =====
  const HOW_IT_WORKS = [
    { icon: "📝", titleKey: "step1_title", descKey: "step1_desc" },
    { icon: "🔍", titleKey: "step2_title", descKey: "step2_desc" },
    { icon: "📨", titleKey: "step3_title", descKey: "step3_desc" },
    { icon: "💼", titleKey: "step4_title", descKey: "step4_desc" },
  ]

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50" dir={textDir}>
      <Navbar />

      {/* ===== Hero ===== */}
      <motion.div
        className="bg-[#1e3a5f] px-10 py-16 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#0f2544 0%,#1e3a5f 60%,#162d4a 100%)",
          transformOrigin: "top center",
        }}
      >
        <motion.div
          className="absolute w-72 h-72 rounded-full border border-white/5 -top-20 -right-20"
          animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-52 h-52 rounded-full border border-white/5 -bottom-16 -left-16"
          animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <span className="inline-block text-xs font-medium text-blue-300 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-5 relative">
          {t("about.badge")}
        </span>
        <h1 className="text-4xl font-medium text-white mb-3 leading-relaxed relative">
          {t("about.hero_title_1")} <span className="text-blue-300">{t("about.hero_title_2")}</span>
          <br />{t("about.hero_title_3")}
        </h1>
        <p className="text-sm text-white/60 max-w-xl mx-auto relative">
          {t("about.hero_sub")}
        </p>

        {/* Stats حقيقية من الـ API */}
        {statsError ? (
          <p className="text-xs text-red-300 mt-8 relative">{t("about.load_error")}</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-10 md:gap-14 relative mt-10">
            {IMPACT_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <strong className="block text-xl text-white">
                  {statsLoading ? "…" : <Counter from={0} to={s.num} />}
                </strong>
                <small className="text-xs text-white/60">{s.label}</small>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ===== قصتنا ===== */}
      <motion.section
        initial={{ opacity: 0, y: 70 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="px-4 md:px-10 py-14"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
          <div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-3 py-1">
              {t("about.story.eyebrow")}
            </span>
            <h2 className="text-2xl font-medium text-gray-900 mt-4 mb-4 leading-relaxed">
              {t("about.story.title")}
            </h2>
            <p className="text-sm text-gray-500 leading-loose mb-4">
              {t("about.story.p1")}
            </p>
            <p className="text-sm text-gray-500 leading-loose">
              {t("about.story.p2")}
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-8">
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-2xl mb-2">🎓</p>
                <p className="text-xs text-gray-600 leading-relaxed">{t("about.story.card1")}</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4">
                <p className="text-2xl mb-2">🏙️</p>
                <p className="text-xs text-gray-600 leading-relaxed">{t("about.story.card2")}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-2xl mb-2">🏢</p>
                <p className="text-xs text-gray-600 leading-relaxed">{t("about.story.card3")}</p>
              </div>
              <div className="bg-violet-50 rounded-xl p-4">
                <p className="text-2xl mb-2">🕒</p>
                <p className="text-xs text-gray-600 leading-relaxed">{t("about.story.card4")}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== رسالتنا ورؤيتنا ===== */}
      <motion.section
        initial={{ opacity: 0, y: 70 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="px-4 md:px-10 py-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="bg-white border border-gray-100 rounded-2xl p-7">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl mb-4">
              🎯
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{t("about.mission.title")}</h3>
            <p className="text-sm text-gray-500 leading-loose">{t("about.mission.desc")}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-7">
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-xl mb-4">
              🔭
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{t("about.vision.title")}</h3>
            <p className="text-sm text-gray-500 leading-loose">{t("about.vision.desc")}</p>
          </div>
        </div>
      </motion.section>

      {/* ===== قيمنا ===== */}
      <motion.section
        initial={{ opacity: 0, y: 70 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="px-4 md:px-10 py-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-lg font-medium text-gray-900">{t("about.values.title")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {VALUES.map((v) => (
            <div
              key={v.key}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:-translate-y-2 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl ${v.bg} flex items-center justify-center text-xl mb-4`}>
                {v.icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t(`about.values.${v.key}.title`)}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{t(`about.values.${v.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ===== كيف تعمل المنصة ===== */}
      <motion.section
        initial={{ opacity: 0, y: 70 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="px-4 md:px-10 py-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-lg font-medium text-gray-900">{t("about.how.title")}</h2>
          <p className="text-sm text-gray-400 mt-1">{t("about.how.subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {HOW_IT_WORKS.map((step, index) => (
            <div key={step.titleKey} className="relative bg-white border border-gray-100 rounded-2xl p-6">
              <span className="absolute top-4 left-4 text-[10px] font-medium text-gray-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl mb-4">
                {step.icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t(`about.how.${step.titleKey}`)}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{t(`about.how.${step.descKey}`)}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ===== CTA ===== */}
      <motion.section
        initial={{ opacity: 0, y: 70 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="px-4 md:px-10 py-14"
      >
        <div
          className="max-w-4xl mx-auto rounded-2xl px-8 py-12 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0f2544 0%,#1e3a5f 60%,#162d4a 100%)" }}
        >
          <h2 className="text-xl font-medium text-white mb-2">{t("about.cta.title")}</h2>
          <p className="text-sm text-white/60 mb-7">{t("about.cta.sub")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/signup/seeker")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
            >
              {t("about.cta.seeker_btn")}
            </button>
            <button
              onClick={() => navigate("/signup/company")}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium rounded-xl transition"
            >
              {t("about.cta.company_btn")}
            </button>
          </div>
        </div>
      </motion.section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#1e3a5f] px-10 py-8 text-center">
        <p className="text-xs text-white/40">© {new Date().getFullYear()} {t("about.brand")} · {t("about.rights")}</p>
      </footer>
    </div>
  )
}