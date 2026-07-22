// src/pages/JobDetails.jsx
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"

export default function JobDetails() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isAr = i18n.language === "ar"
  const textDir = isAr ? "rtl" : "ltr"

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [applyStatus, setApplyStatus] = useState("idle") // idle | submitting | applied | already_applied | error
  const [applyError, setApplyError] = useState("")

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        const res = await fetch(`/api/jobs/${id}/`)
        if (res.ok) {
          const data = await res.json()
          setJob(data)
        } else {
          setNotFound(true)
        }
      } catch (err) {
        console.error("fetchJob error:", err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id])

  const handleApply = async () => {
    const token = localStorage.getItem("token") || localStorage.getItem("jobSeekerToken")
    if (!token) {
      navigate("/login", { state: { from: `/jobs/${id}` } })
      return
    }

    setApplyStatus("submitting")
    setApplyError("")

    try {
      const res = await fetch(`/api/jobs/${id}/apply/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JobSeekerToken ${token}`,
        },
        body: JSON.stringify({}),
      })

      if (res.ok) {
        const appliedJobs = JSON.parse(localStorage.getItem("appliedJobs") || "[]")
        const updatedAppliedJobs = Array.isArray(appliedJobs)
          ? appliedJobs.filter(jobId => String(jobId) !== String(id))
          : []

        updatedAppliedJobs.push(String(id))
        localStorage.setItem("appliedJobs", JSON.stringify(updatedAppliedJobs))
        setApplyStatus("applied")
        return
      }

      const data = await res.json().catch(() => ({}))
      const message = data?.error || ""

      if (res.status === 400 && message.toLowerCase().includes("already applied")) {
        setApplyStatus("already_applied")
        return
      }

      if (res.status === 401) {
        navigate("/login", { state: { from: `/jobs/${id}` } })
        return
      }

      setApplyStatus("error")
      setApplyError(message || t("job_details.apply_error"))
    } catch (err) {
      console.error("apply error:", err)
      setApplyStatus("error")
      setApplyError(t("job_details.apply_error"))
    }
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50" dir={textDir}>
      <Navbar />

      {loading ? (
        <div className="px-4 md:px-10 py-16 max-w-5xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-2/3 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-1/3 mb-10" />
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      ) : notFound ? (
        <div className="px-4 md:px-10 py-24 text-center">
          <p className="text-lg text-gray-500 mb-4">{t("job_details.not_found")}</p>
          <button
            onClick={() => navigate("/jobs")}
            className="text-sm text-blue-600 hover:underline"
          >
            {t("job_details.back_to_jobs")}
          </button>
        </div>
      ) : (
        <>
          {/* ===== Hero ===== */}
          <div
            className="px-6 md:px-10 py-12 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#0f2544 0%,#1e3a5f 60%,#162d4a 100%)" }}
          >
            <div className="absolute w-72 h-72 rounded-full border border-white/5 -top-20 -right-20" />
            <div className="absolute w-52 h-52 rounded-full border border-white/5 -bottom-16 -left-16" />

            <div className="max-w-5xl mx-auto relative">
              <button
                onClick={() => navigate(-1)}
                className="text-sm text-white/60 hover:text-white/90 transition mb-6 flex items-center gap-1"
              >
                {isAr ? "→" : "←"} {t("job_details.back")}
              </button>

              <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">{job.title}</h1>
                  <p className="text-sm text-white/60">
                    {job.company_name} · {job.city_label}
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2">
                  <button
                    onClick={handleApply}
                    disabled={applyStatus === "submitting" || applyStatus === "applied" || applyStatus === "already_applied"}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition"
                  >
                    {applyStatus === "submitting"
                      ? t("job_details.apply_submitting")
                      : applyStatus === "applied"
                      ? t("job_details.apply_applied")
                      : applyStatus === "already_applied"
                      ? t("job_details.apply_already_applied")
                      : t("job_details.apply_btn")}
                  </button>
                  {applyStatus === "applied" && (
                    <span className="text-xs text-green-300">{t("job_details.apply_success")}</span>
                  )}
                  {applyStatus === "already_applied" && (
                    <span className="text-xs text-blue-300">{t("job_details.apply_already_applied_msg")}</span>
                  )}
                  {applyStatus === "error" && (
                    <span className="text-xs text-red-300">{applyError}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/80">
                  {job.employment_type_label}
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/80">
                  {job.work_mode_label}
                </span>
                {job.specialization && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/80">
                    {isAr ? job.specialization.name_ar : job.specialization.name_en}
                  </span>
                )}
                <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/20 text-green-300">
                  {job.status_label}
                </span>
              </div>
            </div>
          </div>

          {/* ===== Content ===== */}
          <div className="max-w-5xl mx-auto px-4 md:px-10 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* الوصف */}
            <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                {t("job_details.description_title")}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* الشركة + معلومات سريعة */}
            <div className="flex flex-col gap-6">

              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-3">
                  {t("job_details.company_title")}
                </h2>
                <p className="text-sm font-medium text-gray-900 mb-1">{job.company?.company_name}</p>
                {job.company?.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{job.company.description}</p>
                )}
                {job.company?.website_url && (
                  <a
                    href={job.company.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                    >
                    {job.company.website_url}
                  </a>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-3">
                  {t("job_details.quick_facts")}
                </h2>
                <div className="flex flex-col gap-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>{t("job_details.posted_on")}</span>
                    <span>{new Date(job.created_at).toLocaleDateString(isAr ? "ar-SY" : "en-US")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("job_details.expires_on")}</span>
                    <span>{new Date(job.expires_at).toLocaleDateString(isAr ? "ar-SY" : "en-US")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("job_details.views")}</span>
                    <span>{job.views_count}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  )
}