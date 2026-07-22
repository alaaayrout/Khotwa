import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import Navbar from "../components/Navbar"
import { API_BASE } from "../config"
import { useNavigate, useSearchParams } from "react-router-dom"


// ─── Static option lists (match backend enums) ─────────────────────
const JOB_TYPES = [
  { value:"",           label_ar:"كل الأنواع",   label_en:"All Types" },
  { value:"full_time",  label_ar:"دوام كامل",    label_en:"Full Time" },
  { value:"part_time",  label_ar:"دوام جزئي",    label_en:"Part Time" },
  { value:"contract",   label_ar:"عقد مؤقت",     label_en:"Contract" },
  { value:"internship", label_ar:"تدريب",         label_en:"Internship" },
  { value:"freelance",  label_ar:"عمل حر",        label_en:"Freelance" },
]

const WORK_TYPES = [
  { value:"",       label_ar:"كل طرق العمل", label_en:"All Work Types" },
  { value:"onsite", label_ar:"حضوري",         label_en:"On-site" },
  { value:"remote", label_ar:"عن بُعد",       label_en:"Remote" },
  { value:"hybrid", label_ar:"هجين",          label_en:"Hybrid" },
]

// نفس المدن المستخدمة بصفحة PostJob (ثوابت الباك إند)
const CITIES = [
  { value:"",               label:"كل المدن"    },
  { value:"damascus",       label:"دمشق"       },
  { value:"aleppo",         label:"حلب"        },
  { value:"homs",           label:"حمص"        },
  { value:"latakia",        label:"اللاذقية"   },
  { value:"tartus",         label:"طرطوس"      },
  { value:"hama",           label:"حماة"       },
  { value:"deir_ezzor",     label:"دير الزور"  },
  { value:"raqqa",          label:"الرقة"      },
  { value:"suwayda",        label:"السويداء"   },
  { value:"daraa",          label:"درعا"       },
  { value:"idlib",          label:"إدلب"       },
  { value:"hasakah",        label:"الحسكة"     },
  { value:"quneitra",       label:"القنيطرة"   },
  { value:"rural_damascus", label:"ريف دمشق"  },
]

const SORT_OPTIONS = [
  { value:"newest",  label_ar:"الأحدث",       label_en:"Newest" },
  { value:"oldest",  label_ar:"الأقدم",       label_en:"Oldest" },
  { value:"views",   label_ar:"الأكثر مشاهدة",label_en:"Most Viewed" },
]

const WORK_TYPE_STYLE = {
  onsite: { bg:"#f0fdf4", color:"#166534", border:"#bbf7d0" },
  remote: { bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" },
  hybrid: { bg:"#faf5ff", color:"#6b21a8", border:"#e9d5ff" },
}

const JOB_TYPE_STYLE = {
  full_time:  { bg:"#eff6ff", color:"#1e40af", border:"#bfdbfe" },
  part_time:  { bg:"#fff7ed", color:"#9a3412", border:"#fed7aa" },
  contract:   { bg:"#fefce8", color:"#854d0e", border:"#fef08a" },
  internship: { bg:"#f0fdf4", color:"#166534", border:"#bbf7d0" },
  freelance:  { bg:"#fdf4ff", color:"#86198f", border:"#f0abfc" },
}

// ─── Sub-components ───────────────────────────────────────────────
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap"
      style={{
        background: active ? "#1e3a5f"               : "white",
        color:      active ? "#ffffff"               : "#64748b",
        borderColor:active ? "#1e3a5f"               : "#e2e8f0",
        boxShadow:  active ? "0 2px 8px rgba(30,58,95,.25)" : "none",
      }}
    >
      {label}
    </button>
  )
}

function SelectFilter({ value, onChange, options, isAr, plainLabels }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold border outline-none transition-all cursor-pointer"
        style={{ background:"white", borderColor:"#e2e8f0", color:"#475569", minWidth:"130px" }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {plainLabels ? o.label : (isAr ? o.label_ar : o.label_en)}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-2.5 text-slate-400"
           width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  )
}

function JobCard({ job, isAr, onClick }) {
  const wtStyle = WORK_TYPE_STYLE[job.work_mode]       || {}
  const jtStyle = JOB_TYPE_STYLE[job.employment_type]   || {}

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden"
      style={{ borderColor:"#e8efff" }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#3b82f6"
        e.currentTarget.style.boxShadow   = "0 8px 32px rgba(59,130,246,.12)"
        e.currentTarget.style.transform   = "translateY(-2px)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#e8efff"
        e.currentTarget.style.boxShadow   = "none"
        e.currentTarget.style.transform   = "translateY(0)"
      }}
    >
      {/* top accent bar */}
      <div className="h-0.5 w-0 group-hover:w-full transition-all duration-300"
           style={{ background:"linear-gradient(90deg,#3b82f6,#6366f1)" }}/>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* company avatar */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
               style={{ background:"linear-gradient(135deg,#1e3a5f,#2d5282)" }}>
            {job.company_name?.charAt(0)}
          </div>

          {/* badges */}
          <div className="flex flex-wrap gap-1.5 justify-end">
            <span className="text-xs px-2.5 py-1 rounded-xl font-semibold border"
                  style={{ background:jtStyle.bg, color:jtStyle.color, borderColor:jtStyle.border }}>
              {job.employment_type_label}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-xl font-semibold border"
                  style={{ background:wtStyle.bg, color:wtStyle.color, borderColor:wtStyle.border }}>
              {job.work_mode_label}
            </span>
          </div>
        </div>

        {/* Title + company */}
        <h3 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">
          {job.title}
        </h3>
        <p className="text-xs text-slate-500 mb-1">
          {job.company_name}
        </p>
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {job.city_label}
        </div>

        {/* Tags (optional — only if backend provides them) */}
        {Array.isArray(job.tags) && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.tags.slice(0,3).map(tag => (
              <span key={tag} className="text-xs px-2 py-1 rounded-lg font-medium"
                    style={{ background:"#f1f5f9", color:"#64748b" }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t"
             style={{ borderColor:"#f1f5f9" }}>
          {/* salary (optional — only if backend provides it) */}
          <span className="text-sm font-bold" style={{ color:"#1e3a5f" }}>
            {job.salary || ""}
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {job.views_count ?? 0}
            </span>
            <span>{new Date(job.created_at).toLocaleDateString(isAr ? "ar-SY" : "en-US")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
export default function JobListings() {
  const { t, i18n }         = useTranslation()
  const navigate             = useNavigate()
  const [searchParams]       = useSearchParams()
  const isAr                 = i18n.language === "ar"

  const [search,         setSearch]         = useState(searchParams.get("search") || "")
  const [inputVal,       setInputVal]       = useState(searchParams.get("search") || "")
  const [specialization, setSpecialization] = useState(searchParams.get("category") || "")
  const [city,           setCity]           = useState(searchParams.get("governorate") || "")
  const [jobType,        setJobType]        = useState("")
  const [workType,       setWorkType]       = useState("")
  const [sortBy,         setSortBy]         = useState("newest")

  // ── بيانات حقيقية من الباك إند ──
  const [jobs,            setJobs]            = useState([])
  const [jobsLoading,     setJobsLoading]     = useState(true)
  const [specializations, setSpecializations] = useState([])

  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true)
      try {
        const res = await fetch(`${API_BASE}/jobs/`)
        if (res.ok) {
          const data = await res.json()
          setJobs(Array.isArray(data) ? data : data.results || [])
        }
      } catch (err) {
        console.error("fetchJobs error:", err)
      } finally {
        setJobsLoading(false)
      }
    }
    const fetchSpecializations = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/specializations/`)
        if (res.ok) {
          const data = await res.json()
          setSpecializations(Array.isArray(data) ? data : data.results || [])
        }
      } catch (err) {
        console.error("fetchSpecializations error:", err)
      }
    }
    fetchJobs()
    fetchSpecializations()
  }, [])

  const specializationOptions = useMemo(() => ([
    { value:"", label_ar:"كل التخصصات", label_en:"All Specializations" },
    ...specializations.map(s => ({ value:String(s.id), label_ar:s.name_ar, label_en:s.name_en })),
  ]), [specializations])

  const handleSearch = () => setSearch(inputVal.trim())

  // ── filtering + sorting (كله عم يصير من عندنا بالـ frontend) ──
  const filtered = useMemo(() => {
    let list = [...jobs]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(j =>
        `${j.title || ""} ${j.company_name || ""}`.toLowerCase().includes(q))
    }
    if (specialization) list = list.filter(j => String(j.specialization?.id) === specialization)
    if (city)           list = list.filter(j => j.city === city)
    if (jobType)        list = list.filter(j => j.employment_type === jobType)
    if (workType)       list = list.filter(j => j.work_mode === workType)

    if (sortBy === "views") {
      list.sort((a,b) => (b.views_count || 0) - (a.views_count || 0))
    } else if (sortBy === "oldest") {
      list.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
    } else {
      list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    }
    return list
  }, [jobs, search, specialization, city, jobType, workType, sortBy])

  const activeFiltersCount = [specialization, city, jobType, workType].filter(Boolean).length

  const clearFilters = () => {
    setSpecialization(""); setCity(""); setJobType(""); setWorkType("")
    setSearch(""); setInputVal("")
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen" style={{ background:"#f0f4f8" }}>
      <Navbar />

      {/* ── Hero search bar ── */}
      <div className="relative overflow-hidden"
           style={{ background:"linear-gradient(135deg,#0f2544 0%,#1e3a5f 60%,#162d4a 100%)" }}>
        {/* grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
             style={{
               backgroundImage:"linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
               backgroundSize:"32px 32px"
             }}/>
        <div className="absolute inset-0 pointer-events-none"
             style={{ background:"radial-gradient(ellipse 60% 100% at 50% 0%,rgba(59,130,246,.18),transparent)" }}/>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-2xl font-black text-white text-center mb-1">
            {t("jobs.title")}
          </h1>
          <p className="text-sm text-white/50 text-center mb-6">{t("jobs.subtitle")}</p>

          {/* search input */}
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-sm border rounded-2xl px-4 py-2.5"
                 style={{ borderColor:"rgba(255,255,255,.2)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder={t("jobs.search_placeholder")}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
              {inputVal && (
                <button onClick={() => { setInputVal(""); setSearch("") }}
                  className="text-white/40 hover:text-white transition text-lg leading-none">×</button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition-all"
              style={{ background:"linear-gradient(135deg,#3b82f6,#6366f1)" }}
              onMouseEnter={e => e.currentTarget.style.opacity=".88"}
              onMouseLeave={e => e.currentTarget.style.opacity="1"}
            >
              {t("jobs.search_btn")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm" style={{ borderColor:"#e8efff" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">

            {/* Specialization pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-wrap">
              {specializationOptions.map(s => (
                <FilterPill
                  key={s.value}
                  label={isAr ? s.label_ar : s.label_en}
                  active={specialization === s.value}
                  onClick={() => setSpecialization(s.value)}
                />
              ))}
            </div>

            {/* divider */}
            <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1"/>

            {/* select filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <SelectFilter value={city} onChange={setCity} options={CITIES} plainLabels />
              <SelectFilter value={jobType} onChange={setJobType} isAr={isAr} options={JOB_TYPES} />
              <SelectFilter value={workType} onChange={setWorkType} isAr={isAr} options={WORK_TYPES} />
            </div>

            {/* clear + sort */}
            <div className="flex items-center gap-2 ms-auto">
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-600 transition px-2">
                  <span>×</span> {t("jobs.clear_filters")}
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                </button>
              )}
              <SelectFilter value={sortBy} onChange={setSortBy} isAr={isAr} options={SORT_OPTIONS} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* count bar */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-slate-600">
            <span className="text-lg font-black" style={{ color:"#1e3a5f" }}>{filtered.length}</span>
            {" "}{t("jobs.results_count")}
            {search && (
              <span className="text-slate-400 font-normal">
                {" "}{t("jobs.results_for")} "<span className="text-blue-600 font-semibold">{search}</span>"
              </span>
            )}
          </p>
        </div>

        {/* grid */}
        {jobsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border p-5 animate-pulse" style={{ borderColor:"#e8efff" }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100" />
                  <div className="w-20 h-6 rounded-xl bg-gray-100" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-px bg-gray-50 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-bold text-slate-600 mb-1">{t("jobs.no_results")}</p>
            <p className="text-sm text-slate-400">{t("jobs.no_results_sub")}</p>
            <button onClick={clearFilters}
              className="mt-4 px-6 py-2 rounded-xl text-sm font-bold text-white transition"
              style={{ background:"linear-gradient(135deg,#1e3a5f,#2d5282)" }}>
              {t("jobs.clear_filters")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isAr={isAr}
                onClick={() => navigate(`/jobs/${job.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="mt-8 py-6 text-center text-xs text-slate-400 border-t" style={{ borderColor:"#e8efff" }}>
        © 2025 {t("nav.brand")}
      </footer>
    </div>
  )
}
