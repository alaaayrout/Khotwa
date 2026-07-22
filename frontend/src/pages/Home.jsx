import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { API_BASE } from "../config"
import { useState, useEffect, useMemo } from "react"
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
} from "framer-motion";

// نفس قيم المحافظات (slugs) المستخدمة بـ JobListings/PostJob وبحقل job.city القادم من الباك اند
const GOVERNORATES = [
  { value: "damascus",       label: "دمشق" },
  { value: "aleppo",         label: "حلب" },
  { value: "homs",           label: "حمص" },
  { value: "hama",           label: "حماة" },
  { value: "latakia",        label: "اللاذقية" },
  { value: "tartus",         label: "طرطوس" },
  { value: "deir_ezzor",     label: "دير الزور" },
  { value: "raqqa",          label: "الرقة" },
  { value: "suwayda",        label: "السويداء" },
  { value: "daraa",          label: "درعا" },
  { value: "idlib",          label: "إدلب" },
  { value: "hasakah",        label: "الحسكة" },
  { value: "quneitra",       label: "القنيطرة" },
  { value: "rural_damascus", label: "ريف دمشق" },
]



// ألوان تتكرر دورياً على بطاقات الشركات حسب ترتيب ظهورها
const COMPANY_COLORS = [
  "bg-blue-50", "bg-purple-50", "bg-amber-50",
  "bg-green-50", "bg-red-50", "bg-teal-50",
]


function Counter({ from = 0, to }) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) =>
    Math.round(latest).toLocaleString()
  );

  useEffect(() => {
    const controls = animate(count, to, {
      duration: 2,
      ease: "easeOut",
    });

    return controls.stop;
  }, [to]);

  return <motion.span>{rounded}</motion.span>;
}


function getCompanyLogo(job) {
  return (
    job.company_logo_url ||
    job.company_logo ||
    job.company?.profile_picture_url ||
    job.company?.external_picture_url ||
    job.company?.logo_url ||
    job.company?.external_logo_url ||
    null
  )
}

// نفس القيم المستخدمة بـ PostJob.jsx لتحويل القيم الخام (raw) إلى ليبل معروض
const JOB_TYPES = [
  { value: "full_time",  label_ar: "دوام كامل",  label_en: "Full Time"  },
  { value: "part_time",  label_ar: "دوام جزئي",  label_en: "Part Time"  },
  { value: "contract",   label_ar: "عقد مؤقت",   label_en: "Contract"   },
  { value: "internship", label_ar: "تدريب",       label_en: "Internship" },
  { value: "freelance",  label_ar: "عمل حر",      label_en: "Freelance"  },
]

const WORK_TYPES = [
  { value: "onsite",  label_ar: "حضوري",    label_en: "On-site" },
  { value: "remote",  label_ar: "عن بُعد",  label_en: "Remote"  },
  { value: "hybrid",  label_ar: "هجين",     label_en: "Hybrid"  },
]

const labelOf = (arr, val, isAr) => {
  const found = arr.find(x => x.value === val)
  if (!found) return val || ""
  return isAr ? found.label_ar : found.label_en
}

// ── فلتر أمان: نفس منطق _public_jobs_queryset() بالباك اند (status='open', is_active=True, expires_at>=today) ─
// مهم لأنه /api/recommendations/jobs/ endpoint مستقل عن /api/jobs/ وما في ضمانة إنه مطبق فيه نفس الفلترة.
// الفحص دفاعي: أي حقل مو موجود بالبيانات منتجاوزه (ما منحظر الوظيفة بالغلط).
function isRecommendedJobStillOpen(rawJob) {
  if (rawJob.is_active === false) return false
  if (rawJob.status && rawJob.status !== "open") return false
  if (rawJob.expires_at) {
    const today = new Date().toISOString().slice(0, 10)
    if (String(rawJob.expires_at).slice(0, 10) < today) return false
  }
  return true
}

// ── توحيد شكل عنصر الـ recommendation القادم من /api/recommendations/jobs/ ─────
// شكل الـ response الفعلي (تأكدنا منه عبر Network tab): array مباشر، كل عنصر فيه قيم خام
// (city/employment_type/work_mode/status) بدون *_label، وبدون company_logo_url ولا specialization.
// ملاحظة: بالقصد ما منستخدم/ما منعرض similarity_score أبداً حتى إنها موجودة بالبيانات.
function normalizeRecommendedJob(item, isAr) {
  const job = item?.job || item?.job_data || item
  if (!job || job.id == null) return null
  if (!isRecommendedJobStillOpen(job)) return null

  const governorate = GOVERNORATES.find(g => g.value === job.city)

  return {
    id: job.id,
    title: job.title,
    company_name: job.company_name || job.company?.company_name || "",
    company_logo_url: getCompanyLogo(job),
    city_label: job.city_label || governorate?.label || job.city || "",
    employment_type_label: job.employment_type_label || labelOf(JOB_TYPES, job.employment_type, isAr),
    work_mode_label: job.work_mode_label || labelOf(WORK_TYPES, job.work_mode, isAr),
    specialization: job.specialization || null,
  }
}

// ── أفاتار الشركة: بيعرض اللوغو الحقيقي، وإذا مافي أو فشل تحميله بيرجع للأحرف الأولى ─────
function CompanyAvatar({ name, logoUrl, imgSize = "w-12 h-12", rounded = "rounded-xl", fallbackClassName = "bg-blue-50 text-gray-700 text-sm" }) {
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

export default function Home() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = i18n.language === "ar"
  const textDir = isAr ? "rtl" : "ltr"
  const isLoggedIn = !!localStorage.getItem("token")
  const [search, setSearch] = useState("")
  const [governorate, setGovernorate] = useState("")
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobsError, setJobsError] = useState(false)
  const [specializations, setSpecializations] = useState([])
  const [specializationsLoading, setSpecializationsLoading] = useState(true)
  const [specializationsError, setSpecializationsError] = useState(false)
  const [seekersCount, setSeekersCount] = useState(0)
  const [applications, setApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [applicationsError, setApplicationsError] = useState(false)
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [recommendationsError, setRecommendationsError] = useState(false)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/`)
        if (res.ok) {
          const data = await res.json()
          const jobsData = Array.isArray(data) ? data : data.results || []
          setJobs(jobsData)

          if (isLoggedIn) {
            const appliedJobIds = JSON.parse(localStorage.getItem("appliedJobs") || "[]")
            const normalizedAppliedIds = Array.isArray(appliedJobIds)
              ? appliedJobIds.map(id => String(id))
              : []

            const recentApplications = jobsData
              .filter(job => normalizedAppliedIds.includes(String(job.id)))
              .slice(0, 2)
              .map(job => ({
                id: job.id,
                job_title: job.title,
                company_name: job.company_name || job.company?.company_name || "",
                status: "Applied",
              }))

            setApplications(recentApplications)
            setApplicationsError(false)
          } else {
            setApplications([])
          }
        } else {
          setJobsError(true)
        }
      } catch (err) {
        console.error("fetchJobs error:", err)
        setJobsError(true)
      } finally {
        setJobsLoading(false)
        setApplicationsLoading(false)
      }
    }

    const fetchSpecializations = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/specializations/`)
        if (res.ok) {
          const data = await res.json()
          setSpecializations(Array.isArray(data) ? data : data.results || [])
        } else {
          setSpecializationsError(true)
        }
      } catch (err) {
        console.error("fetchSpecializations error:", err)
        setSpecializationsError(true)
      } finally {
        setSpecializationsLoading(false)
      }
    }

    const fetchSeekersCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobseekers/count/`)
        if (res.ok) {
          const data = await res.json()
          setSeekersCount(typeof data.count === "number" ? data.count : null)
        }
      } catch (err) {
        console.error("fetchSeekersCount error:", err)
      }
    }

    fetchJobs()
    fetchSpecializations()
    fetchSeekersCount()
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      setRecommendedJobs([])
      setRecommendationsLoading(false)
      return
    }

    const fetchRecommendations = async () => {
      setRecommendationsLoading(true)
      setRecommendationsError(false)
      try {
        // TODO(Farah): تأكدي من مفتاح التوكن الفعلي بالـ localStorage (هون مستخدم نفس مفتاح "token"
        // المستخدم فوق بفحص isLoggedIn — إذا صفحات ثانية عندك بتخزن توكن الـ seeker بمفتاح مختلف، وحّديه هون)
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE}/recommendations/jobs/`, {
          headers: { Authorization: `JobSeekerToken ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const rawList = Array.isArray(data) ? data : data.results || []
          // بنعتمد على الترتيب يلي راجع من الباك اند كما هو (الأنسب أولاً)، بدون عرض أي رقم/نسبة
          setRecommendedJobs(rawList.map(item => normalizeRecommendedJob(item, isAr)).filter(Boolean))
        } else {
          setRecommendationsError(true)
        }
      } catch (err) {
        console.error("fetchRecommendations error:", err)
        setRecommendationsError(true)
      } finally {
        setRecommendationsLoading(false)
      }
    }

    fetchRecommendations()
  }, [isLoggedIn, isAr])

  const handleSearch = () => {
    navigate(`/jobs?search=${encodeURIComponent(search)}&governorate=${encodeURIComponent(governorate)}`)
  }

  // نبني قائمة أبرز الشركات من بيانات /api/jobs/ الحقيقية (ما في endpoint مستقل للشركات حالياً)
  const featuredCompanies = useMemo(() => {
    const byCompany = new Map()

    jobs.forEach(job => {
      const name = job.company_name?.trim()
      if (!name) return
      if (!byCompany.has(name)) {
        byCompany.set(name, { name, jobsCount: 0, logoUrl: null })
      }
      const entry = byCompany.get(name)
      entry.jobsCount += 1
      if (!entry.logoUrl) entry.logoUrl = getCompanyLogo(job)
    })

    return Array.from(byCompany.values())
      .sort((a, b) => b.jobsCount - a.jobsCount)
      .slice(0, 6)
      .map((company, index) => ({
        ...company,
        color: COMPANY_COLORS[index % COMPANY_COLORS.length],
      }))
  }, [jobs])

  // نفس منطق تجميع الشركات فوق، بس بدون تحديد بـ6 -- لحساب العدد الحقيقي بالإحصائيات
  const totalCompaniesCount = useMemo(() => {
    const names = new Set(jobs.map(job => job.company_name?.trim()).filter(Boolean))
    return names.size
  }, [jobs])

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50" dir={textDir}>
      <Navbar />

      {/* ===== Hero ===== */}
      <motion.div 
  className="bg-[#1e3a5f] px-10 py-16 text-center relative overflow-hidden"
  style={{
    background:
      "linear-gradient(135deg,#0f2544 0%,#1e3a5f 60%,#162d4a 100%)",
    transformOrigin: "top center",
    
  }}
>
        <motion.div
className="absolute w-72 h-72 rounded-full border border-white/5 -top-20 -right-20"
animate={{
    y:[0,-20,0],
    x:[0,15,0]
}}
transition={{
    duration:10,
    repeat:Infinity,
    ease:"easeInOut"
}}
/>
        <motion.div
className="absolute w-52 h-52 rounded-full border border-white/5 -bottom-16 -left-16"
animate={{
    y:[0,20,0],
    x:[0,-15,0]
}}
transition={{
    duration:12,
    repeat:Infinity,
    ease:"easeInOut"
}}
/>
        <h1 className="text-4xl font-medium text-white mb-3 leading-relaxed relative">
          {t("home.hero_title_1")} <span className="text-blue-300">{t("home.hero_title_2")}</span>
          <br />{t("home.hero_title_3")}
        </h1>
        <p className="text-sm text-white/60 mb-10 relative">{t("home.hero_sub")}</p>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-2 flex flex-col md:flex-row gap-2 max-w-xl mx-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("home.search_placeholder")}
            className="flex-1 text-sm px-3 py-2 outline-none text-gray-700 bg-transparent"
          />
          <select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="text-sm px-3 py-2 outline-none text-gray-500 bg-transparent border-r border-gray-200"
          >
            <option value="">{t("home.all_governorates")}</option>
            {GOVERNORATES.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            {t("home.search_btn")}
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-12 relative mt-10">
          {[
  { num: jobs.length, label: t("home.stat_jobs") },
  { num: totalCompaniesCount, label: t("home.stat_companies") },
  { num: seekersCount, label: t("home.stat_seekers") },
].map((s) => (
            <div key={s.label} className="text-center">
              <strong className="block text-xl text-white"><Counter from={0} to={s.num} /></strong>
              <small className="text-xs text-white/60">{s.label}</small>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
  
</div>
      </motion.div>

      {/* ===== وظائف موصى بها (خاص بالباحثين عن عمل المسجلين دخولهم) ===== */}
      {isLoggedIn && (
        <motion.section
          initial={{ opacity: 0, y: 70 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="px-4 md:px-10 py-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">{t("home.recommended_jobs")}</h2>
            <span
              onClick={() => navigate("/jobs")}
              className="text-sm text-blue-600 cursor-pointer hover:underline"
            >
              {t("home.see_all")}
            </span>
          </div>

          {recommendationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100" />
                    <div className="w-16 h-5 rounded-full bg-gray-100" />
                  </div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : recommendationsError ? (
            <p className="text-sm text-red-400 text-center py-10">{t("home.load_error")}</p>
          ) : recommendedJobs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">{t("home.no_recommendations")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedJobs.slice(0, 6).map(job => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="relative bg-white border border-blue-100 rounded-xl p-4 cursor-pointer hover:-translate-y-2
                    hover:shadow-2xl
                    hover:scale-[1.02]
                    transition-all
                    duration-300"
                >
                 
                  <div className="flex justify-between items-start mb-3">
                    <CompanyAvatar
                    name={job.company_name}
                    logoUrl={getCompanyLogo(job)}
                    imgSize="w-10 h-10"
                    rounded="rounded-lg"
                    fallbackClassName="bg-blue-50 text-blue-800 text-xs"
                  />
                    
                    {job.employment_type_label && (
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-800">
                        {job.employment_type_label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{job.title}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    {job.company_name} · {job.city_label}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {job.work_mode_label && (
                      <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-md">
                        {job.work_mode_label}
                      </span>
                    )}
                    {job.specialization && (
                      <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-md">
                        {isAr ? job.specialization.name_ar : job.specialization.name_en}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* ===== قسم حسب حالة المستخدم (يظهر فقط للمسجلين) ===== */}
      {isLoggedIn && (
        <motion.section
    initial={{ opacity: 0, y: 70 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{
        duration: 0.7,
        ease: "easeOut"
    }}
    className="px-4 md:px-10 py-10"
>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* وظائف زارها مؤخراً */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">{t("home.recently_viewed")}</h2>
                <span className="text-sm text-blue-600 cursor-pointer">{t("home.see_all")}</span>
              </div>
              <div className="flex flex-col gap-3">
                {jobs.slice(0, 2).map(job => (
                  <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:-translate-y-2
                  hover:shadow-2xl
                  hover:scale-[1.02]
                  transition-all
                  duration-300 transition">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.company_name} · {job.city_label}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">{job.employment_type_label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* طلباته الأخيرة */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">{t("home.my_applications")}</h2>
                <span className="text-sm text-blue-600 cursor-pointer">{t("home.see_all")}</span>
              </div>
              <div className="flex flex-col gap-3">
                {applicationsLoading ? (
                  [1, 2].map(i => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  ))
                ) : applicationsError ? (
                  <p className="text-sm text-red-400 text-center py-4">{t("home.load_error")}</p>
                ) : applications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">{t("home.no_jobs")}</p>
                ) : (
                  applications.slice(0, 2).map(application => (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => navigate(`/jobs/${application.id}`)}
                      className="w-full bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center hover:-translate-y-2 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                    >
                      <div className="w-full text-right">
                        <p className="text-sm font-medium text-gray-900">{application.job_title}</p>
                        <p className="text-xs text-gray-500">{application.company_name}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

          </div>
        </motion.section>
      )}

      {/* ===== تصفح حسب التخصص (يظهر دائماً بغض النظر عن حالة تسجيل الدخول) ===== */}
      <motion.section
    initial={{ opacity: 0, y: 70 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{
        duration: 0.7,
        ease: "easeOut"
    }}
    className="px-4 md:px-10 py-10"
>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">{t("home.browse_by_category")}</h2>
          </div>
          {specializationsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-2 animate-pulse">
                  <div className="w-6 h-6 rounded bg-gray-100" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : specializationsError ? (
            <p className="text-sm text-red-400 text-center py-10">{t("home.load_error")}</p>
          ) : specializations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">{t("home.no_jobs")}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {specializations.map((spec, index) => {
                return (
                 <button
                  key={spec.id}
                  onClick={() => navigate(`/jobs?category=${spec.id}`)}
                  className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:-translate-y-2
hover:shadow-2xl
hover:scale-[1.02]
transition-all
duration-300 hover:shadow-sm transition flex flex-col items-center gap-2"
                >
                 
                  <span className="text-xs font-medium text-gray-700">{isAr ? spec.name_ar : spec.name_en}</span>
                </button>
                )
              })}
            </div>
          )}
      </motion.section>

      {/* ===== أحدث الوظائف ===== */}
      <motion.section
    initial={{ opacity: 0, y: 70 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{
        duration: 0.7,
        ease: "easeOut"
    }}
    className="px-4 md:px-10 py-10"
>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">{t("home.latest_jobs")}</h2>
          <span
            onClick={() => navigate("/jobs")}
            className="text-sm text-blue-600 cursor-pointer hover:underline"
          >
            {t("home.see_all")} 
          </span>
        </div>

        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100" />
                  <div className="w-20 h-6 rounded-full bg-gray-100" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-px bg-gray-50 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : jobsError ? (
          <p className="text-sm text-red-400 text-center py-10">{t("home.load_error")}</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">{t("home.no_jobs")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.slice(0, 6).map(job => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:-translate-y-2
                hover:shadow-2xl
                hover:scale-[1.02]
                transition-all
                duration-300 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <CompanyAvatar
                    name={job.company_name}
                    logoUrl={getCompanyLogo(job)}
                    imgSize="w-10 h-10"
                    rounded="rounded-lg"
                    fallbackClassName="bg-blue-50 text-blue-800 text-xs"
                  />
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-800">
                    {job.employment_type_label}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{job.title}</p>
                <p className="text-xs text-gray-500 mb-3">
                  {job.company_name} · {job.city_label}
                </p>
                <div className="flex gap-2 flex-wrap mb-3">
                  <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-md">
                    {job.work_mode_label}
                  </span>
                  {job.specialization && (
                    <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-md">
                      {isAr ? job.specialization.name_ar : job.specialization.name_en}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                    {job.status_label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(job.created_at).toLocaleDateString(isAr ? "ar-SY" : "en-US")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ===== أبرز الشركات ===== */}
      <motion.section
    initial={{ opacity: 0, y: 70 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{
        duration: 0.7,
        ease: "easeOut"
    }}
    className="px-4 md:px-10 py-10"
>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            {isAr ? "أبرز الشركات" : "Featured Companies"}
          </h2>
          <span
            onClick={() => navigate("/companies")}
            className="text-sm text-blue-600 cursor-pointer hover:underline"
          >
            {t("home.see_all")} 
          </span>
        </div>
        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : jobsError ? (
          <p className="text-sm text-red-400 text-center py-10">{t("home.load_error")}</p>
        ) : featuredCompanies.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">{t("home.no_jobs")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCompanies.map(company => (
              <div
                key={company.name}
                onClick={() => navigate(`/jobs?search=${encodeURIComponent(company.name)}`)}
                className="bg-white border border-gray-100 rounded-xl p-5 cursor-pointer hover:-translate-y-2
hover:shadow-2xl
hover:scale-[1.02]
transition-all
duration-300 transition flex items-center gap-4"
              >
                {/* أيقونة الشركة */}
                <CompanyAvatar
                  name={company.name}
                  logoUrl={company.logoUrl}
                  imgSize="w-12 h-12"
                  rounded="rounded-xl"
                  fallbackClassName={`${company.color} text-gray-700 text-sm`}
                />

                {/* معلومات الشركة */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {company.name}
                  </p>
                </div>

                {/* عدد الوظائف */}
                <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 flex-shrink-0">
                  {company.jobsCount} {isAr
                    ? (company.jobsCount === 1 ? "وظيفة" : "وظائف")
                    : (company.jobsCount === 1 ? "Job" : "Jobs")}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#1e3a5f] px-10 py-8 text-center">
        <p className="text-xs text-white/40">© {new Date().getFullYear()} {t("home.footer_name")} · {t("home.rights")}</p>
      </footer>

    </div>
  )
}