// src/pages/Companies.jsx
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { API_BASE } from "../config"
import { useState, useEffect, useMemo } from "react"

// نفس ألوان الشركات الدايرية المستخدمة بـ Home.jsx
// TODO(Farah): لما تعملي extract للـ shared components، وحّدي هاد الجدول + CompanyAvatar + getCompanyLogo
// بملف واحد مشترك (مثلاً components/CompanyAvatar.jsx) بدل ما تتكرر بين Home.jsx وهالملف
const COMPANY_COLORS = [
  "bg-blue-50", "bg-purple-50", "bg-amber-50",
  "bg-green-50", "bg-red-50", "bg-teal-50",
]

// TODO(Farah): نفس ملاحظة Home.jsx - لما رفيقتك تضيف حقل لوغو الشركة بالـ public serializer،
// تأكدي هون اسمه صح (جربنا أكتر من احتمال شائع)
function getCompanyLogo(job) {
  return (
    job.company_logo_url ||
    job.company_logo ||
    job.company?.profile_picture_url ||
    job.company?.logo_url ||
    null
  )
}

// ── أفاتار الشركة: لوغو حقيقي، وإذا مافي أو فشل تحميله بيرجع للأحرف الأولى ─────
function CompanyAvatar({ name, logoUrl, imgSize = "w-14 h-14", rounded = "rounded-xl", fallbackClassName = "bg-blue-50 text-gray-700 text-base" }) {
  const [imgError, setImgError] = useState(false)
  const initials = name?.slice(0, 2) || "?"

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`${imgSize} ${rounded} object-cover flex-shrink-0 border border-gray-100 bg-white`}
      />
    )
  }
  return (
    <div className={`${imgSize} ${rounded} flex items-center justify-center font-medium flex-shrink-0 ${fallbackClassName}`}>
      {initials}
    </div>
  )
}

export default function Companies() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = i18n.language === "ar"
  const textDir = isAr ? "rtl" : "ltr"

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")

  // ── جلب الوظائف العامة، ومنها منشتق قائمة الشركات ────────────
  // TODO(Farah): هاد حل مؤقت لحد ما يصير عندنا endpoint مستقل /api/companies/
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/`)
        if (res.ok) {
          const data = await res.json()
          setJobs(Array.isArray(data) ? data : data.results || [])
        } else {
          setError(true)
        }
      } catch (err) {
        console.error("fetchJobs error:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const companies = useMemo(() => {
    const byCompany = new Map()

    jobs.forEach(job => {
      const name = job.company_name?.trim()
      if (!name) return
      if (!byCompany.has(name)) {
        byCompany.set(name, { name, jobsCount: 0, logoUrl: null, cities: new Set() })
      }
      const entry = byCompany.get(name)
      entry.jobsCount += 1
      if (!entry.logoUrl) entry.logoUrl = getCompanyLogo(job)
      if (job.city_label) entry.cities.add(job.city_label)
    })

    return Array.from(byCompany.values())
      .map((c, index) => ({
        ...c,
        cities: Array.from(c.cities),
        color: COMPANY_COLORS[index % COMPANY_COLORS.length],
      }))
      .sort((a, b) => b.jobsCount - a.jobsCount)
  }, [jobs])

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies
    const q = search.trim().toLowerCase()
    return companies.filter(c => c.name.toLowerCase().includes(q))
  }, [companies, search])

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50" dir={textDir}>
      <Navbar />

      {/* ===== Hero ===== */}
      <div
        className="px-6 md:px-10 py-14 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0f2544 0%,#1e3a5f 60%,#162d4a 100%)" }}
      >
        <div className="absolute w-72 h-72 rounded-full border border-white/5 -top-20 -right-20" />
        <div className="absolute w-52 h-52 rounded-full border border-white/5 -bottom-16 -left-16" />

        <div className="relative">
          <h1 className="text-3xl font-medium text-white mb-2">{t("companies.title")}</h1>
          <p className="text-sm text-white/60 mb-8">
            {t("companies.subtitle", { count: companies.length })}
          </p>

          <div className="bg-white rounded-xl p-2 flex max-w-md mx-auto">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("companies.search_placeholder")}
              className="flex-1 text-sm px-3 py-2 outline-none text-gray-700 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* ===== Grid ===== */}
      <div className="px-4 md:px-10 py-10 max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 animate-pulse">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-400 text-center py-16">{t("companies.load_error")}</p>
        ) : filteredCompanies.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">
            {search ? t("companies.no_results") : t("companies.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map(company => (
              <div
                key={company.name}
                onClick={() => navigate(`/jobs?search=${encodeURIComponent(company.name)}`)}
                className="bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex items-center gap-4"
              >
                <CompanyAvatar
                  name={company.name}
                  logoUrl={company.logoUrl}
                  imgSize="w-14 h-14"
                  rounded="rounded-xl"
                  fallbackClassName={`${company.color} text-gray-700 text-base`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate mb-1">{company.name}</p>
                  {company.cities.length > 0 && (
                    <p className="text-xs text-gray-400 truncate">{company.cities.join(" · ")}</p>
                  )}
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 flex-shrink-0">
                  {company.jobsCount} {isAr
                    ? (company.jobsCount === 1 ? "وظيفة" : "وظائف")
                    : (company.jobsCount === 1 ? "Job" : "Jobs")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Footer ===== */}
      <footer className="bg-[#1e3a5f] px-10 py-8 text-center">
        <p className="text-xs text-white/40">© {new Date().getFullYear()} {t("home.footer_name")} · {t("home.rights")}</p>
      </footer>
    </div>
  )
}
