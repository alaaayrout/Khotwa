import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  getProfile, updateProfile, uploadCV, deleteCV, uploadPicture,
  getSkills, createSkill, deleteSkill,
  getExperience, createExperience, updateExperience, deleteExperience,
  getEducation, createEducation, updateEducation, deleteEducation,
} from "../../api/seekerProfile"

const GOVERNORATES = [
  "دمشق","حلب","حمص","اللاذقية","طرطوس",
  "حماة","دير الزور","الرقة","السويداء","درعا","ريف دمشق","إدلب",
]

// الحقول مؤكدة الآن من الـ serializer: date_from / date_to / current
const expToApi = (d) => ({
  title: d.title,
  company: d.company,
  date_from: d.from,
  date_to: d.current ? null : d.to,
  current: d.current,
})
const expFromApi = (e) => ({
  id: e.id,
  title: e.title,
  company: e.company,
  from: e.date_from,
  to: e.date_to,
  current: e.current,
})

// ─── Design tokens ───────────────────────────────────────────────
const navy   = "#0f2544"
const navyMd = "#1e3a5f"
const navyLt = "#2d5282"
const accent = "#3b82f6"

// ─── Shared input styles ─────────────────────────────────────────
const inputCls =
  "w-full px-4 py-2.5 text-sm text-gray-800 bg-white/80 border border-white/60 " +
  "rounded-xl outline-none focus:border-blue-400 focus:bg-white focus:ring-2 " +
  "focus:ring-blue-100 transition placeholder:text-gray-300 backdrop-blur-sm shadow-sm"

const selectCls =
  "w-full px-4 py-2.5 text-sm text-gray-800 bg-white/80 border border-white/60 " +
  "rounded-xl outline-none focus:border-blue-400 focus:bg-white focus:ring-2 " +
  "focus:ring-blue-100 transition appearance-none backdrop-blur-sm shadow-sm"

// ─── Icons ───────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const SpinIcon = () => (
  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
  </svg>
)
const GlobeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

// ─── Field ───────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        {label}{required && <span className="text-red-400 ms-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}

// ─── Panel (lightweight card - the tab bar already carries the title) ──
function Panel({ children, action }) {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden">
      {action && (
        <div className="flex justify-end px-6 pt-5">{action}</div>
      )}
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

// ─── Skill tag ───────────────────────────────────────────────────
function SkillTag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                     border transition group"
          style={{ background:"#eef4ff", color:"#2563eb", borderColor:"#c7d7fd" }}>
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove}
          className="opacity-50 hover:opacity-100 transition leading-none text-sm">×</button>
      )}
    </span>
  )
}

// ─── Icon button ─────────────────────────────────────────────────
function IconBtn({ onClick, children, danger }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition
        ${danger
          ? "text-red-400 hover:bg-red-50 hover:text-red-600"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}>
      {children}
    </button>
  )
}

// ─── Timeline entry card ─────────────────────────────────────────
function TimelineCard({ top, sub, meta, onEdit, onDelete }) {
  return (
    <div className="flex items-start justify-between p-4 rounded-2xl border transition hover:shadow-sm"
         style={{ background:"#f8faff", borderColor:"#e2eaff" }}>
      <div className="flex gap-3 items-start">
        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
             style={{ background: accent }} />
        <div>
          <p className="text-sm font-semibold text-slate-800">{top}</p>
          <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          <p className="text-xs text-slate-400 mt-1">{meta}</p>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <IconBtn onClick={onEdit}><EditIcon /></IconBtn>
        <IconBtn danger onClick={onDelete}><TrashIcon /></IconBtn>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
export default function SeekerProfile() {
  const { t, i18n } = useTranslation()
  const navigate    = useNavigate()
  const isAr        = i18n.language === "ar"

  const toggleLang = () => {
    const next = isAr ? "en" : "ar"
    i18n.changeLanguage(next)
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr"
  }

  const [user, setUser] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    governorate: "",
    bio: "",
    cv_url: null,
    picture: null,
    skills: [],
    experience: [],
    education: [],
  })

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving] = useState(false)
  const [saved,   setSaved]  = useState(false)
  const [errors,  setErrors] = useState({})

  const [activeTab, setActiveTab] = useState("personal")

  const fileRef              = useRef()
  const [cvFile,  setCvFile] = useState(null)
  const [cvDrag,  setCvDrag] = useState(false)
  const [cvError, setCvError]= useState("")

  const avatarRef = useRef()
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState("")

  const [newSkill, setNewSkill] = useState("")
  const [skillError, setSkillError] = useState("")
  const [expModal, setExpModal] = useState(null)
  const [eduModal, setEduModal] = useState(null)

  useEffect(() => {
    const asList = (data) => Array.isArray(data) ? data : (data?.results || [])

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token")
        const [profileRes, skillsRes, expRes, eduRes] = await Promise.all([
          getProfile(token),
          getSkills(token),
          getExperience(token),
          getEducation(token),
        ])
        setUser(p => ({
          ...p,
          ...profileRes.data,
          picture: profileRes.data.profile_picture_url || null,
          skills: asList(skillsRes.data),
          experience: asList(expRes.data).map(expFromApi),
          education: asList(eduRes.data),
        }))
      } catch (err) {
        console.log("Error loading profile:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const setField = (k, v) => {
    setUser(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: "" }))
  }

  const validate = () => {
    const e = {}
    if (!user.full_name?.trim()) e.full_name   = t("seeker.profile.errors.required")
    if (!user.governorate)      e.governorate = t("seeker.profile.errors.required")
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem("token")

      const profileData = {
        full_name: user.full_name,
        phone_number: user.phone_number,
        governorate: user.governorate,
        bio: user.bio
      }

      await updateProfile(profileData, token)

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.log(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCvFile = async (file) => {
    setCvError("")
    if (!file) return

    if (file.type !== "application/pdf") {
      setCvError(t("seeker.profile.cv.pdf_only") || "الملف لازم يكون PDF")
      return
    }

    try {
      const token = localStorage.getItem("token")
      await uploadCV(file, token)
      // منحط الملف بالـ state بس بعد ما نتأكد إنو الرفع نجح فعلياً بالباك إند
      setCvFile(file)
    } catch (err) {
      console.log("Error uploading CV:", err)
      setCvError(t("seeker.profile.cv.upload_failed") || "فشل رفع الملف، حاولي مرة تانية")
    }
  }

  const removeCv = async () => {
    setCvError("")
    try {
      const token = localStorage.getItem("token")
      await deleteCV(token)
      setCvFile(null)
      setUser(p => ({ ...p, cv_url: null }))
    } catch (err) {
      console.log("Error deleting CV:", err)
      setCvError(t("seeker.profile.cv.delete_failed") || "فشل حذف الملف، حاولي مرة تانية")
    }
  }

  const handleAvatarFile = async (file) => {
    setAvatarError("")
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setAvatarError(t("seeker.profile.avatar.image_only") || "الصورة لازم تكون JPG أو PNG")
      return
    }

    const previewUrl = URL.createObjectURL(file)
    const prevPicture = user.picture
    setUser(p => ({ ...p, picture: previewUrl })) // معاينة فورية بدون انتظار

    try {
      setAvatarUploading(true)
      const token = localStorage.getItem("token")
      const res = await uploadPicture(file, token)
      // إذا الباك إند رجّع رابط الصورة الحقيقي منستخدمه، وإلا منبقى على المعاينة المحلية
      setUser(p => ({ ...p, picture: res.data?.profile_picture_url || previewUrl }))
    } catch (err) {
      console.log("Error uploading picture:", err)
      setAvatarError(t("seeker.profile.avatar.upload_failed") || "فشل رفع الصورة، حاولي مرة تانية")
      setUser(p => ({ ...p, picture: prevPicture }))
    } finally {
      setAvatarUploading(false)
    }
  }

  const addSkill = async () => {
    setSkillError("")
    const s = newSkill.trim()
    if (!s) return
    if (user.skills?.some(sk => sk.name === s)) {
      setSkillError(t("seeker.profile.skills.duplicate") || "المهارة هاي مضافة مسبقاً")
      return
    }
    try {
      const token = localStorage.getItem("token")
      const res = await createSkill(s, token)
      setUser(p => ({ ...p, skills: [...(p.skills || []), res.data] }))
      setNewSkill("")
    } catch (err) {
      console.log("Error adding skill:", err)
      // منعرض الرسالة يلي رجعها الباك إند إذا موجودة، لأنو غالباً بتحدد سبب الرفض بالضبط
      const backendMsg = err?.response?.data ? JSON.stringify(err.response.data) : null
      setSkillError(backendMsg || t("seeker.profile.skills.add_failed") || "فشل إضافة المهارة، حاولي مرة تانية")
    }
  }
  const removeSkill = async (skill) => {
    setSkillError("")
    try {
      const token = localStorage.getItem("token")
      await deleteSkill(skill.id, token)
      setUser(p => ({ ...p, skills: p.skills.filter(x => x.id !== skill.id) }))
    } catch (err) {
      console.log("Error removing skill:", err)
      setSkillError(t("seeker.profile.skills.remove_failed") || "فشل حذف المهارة، حاولي مرة تانية")
    }
  }

  const saveExp = async (d) => {
    try {
      const token = localStorage.getItem("token")
      const payload = expToApi(d)
      if (d.id) {
        const res = await updateExperience(d.id, payload, token)
        setUser(p => ({ ...p, experience: p.experience.map(e => e.id === d.id ? expFromApi(res.data) : e) }))
      } else {
        const res = await createExperience(payload, token)
        setUser(p => ({ ...p, experience: [...p.experience, expFromApi(res.data)] }))
      }
      setExpModal(null)
    } catch (err) {
      console.log("Error saving experience:", err)
    }
  }
  const deleteExp = async (id) => {
    try {
      const token = localStorage.getItem("token")
      await deleteExperience(id, token)
      setUser(p => ({ ...p, experience: p.experience.filter(e => e.id !== id) }))
    } catch (err) {
      console.log("Error deleting experience:", err)
    }
  }

  const saveEdu = async (d) => {
    try {
      const token = localStorage.getItem("token")
      const payload = { ...d, year: d.year ? parseInt(d.year, 10) : null }
      if (d.id) {
        const res = await updateEducation(d.id, payload, token)
        setUser(p => ({ ...p, education: p.education.map(e => e.id === d.id ? res.data : e) }))
      } else {
        const res = await createEducation(payload, token)
        setUser(p => ({ ...p, education: [...p.education, res.data] }))
      }
      setEduModal(null)
    } catch (err) {
      console.log("Error saving education:", err)
    }
  }
  const deleteEdu = async (id) => {
    try {
      const token = localStorage.getItem("token")
      await deleteEducation(id, token)
      setUser(p => ({ ...p, education: p.education.filter(e => e.id !== id) }))
    } catch (err) {
      console.log("Error deleting education:", err)
    }
  }

  // completion % - الباك إند عندو completion_percentage جاهز بالـ serializer، منستخدمه إذا موجود
  const fields = [user.full_name, user.email, user.phone_number, user.governorate, user.bio,
                  user.picture, cvFile || user.cv_url, user.skills?.length, user.experience?.length, user.education?.length]
  const localPct = Math.round((fields.filter(Boolean).length / fields.length) * 100)
  const pct = user.completion_percentage != null ? Math.round(user.completion_percentage) : localPct

  const TABS = [
    { key: "personal",   icon: "👤", label: t("seeker.profile.sections.personal") },
    { key: "cv",          icon: "📄", label: t("seeker.profile.sections.cv") },
    { key: "skills",      icon: "⚡", label: t("seeker.profile.sections.skills"), count: user.skills?.length },
    { key: "experience",  icon: "💼", label: t("seeker.profile.sections.experience"), count: user.experience?.length },
    { key: "education",   icon: "🎓", label: t("seeker.profile.sections.education"), count: user.education?.length },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">
        <SpinIcon /> <span className="ms-2">Loading...</span>
      </div>
    )
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen"
         style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#0f172a 100%)" }}>

      {/* ── grid overlay ── */}
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage:`radial-gradient(circle at 20% 20%, rgba(59,130,246,.12) 0%, transparent 50%),
                              radial-gradient(circle at 80% 80%, rgba(99,102,241,.10) 0%, transparent 50%)`,
             backgroundSize:"100% 100%"
           }}/>

      {/* ── Topbar ── */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b"
           style={{ background:"rgba(15,23,42,.75)", borderColor:"rgba(255,255,255,.08)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isAr
                ? <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>
                : <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>}
            </svg>
            {t("seeker.profile.back")}
          </button>

          <h1 className="text-sm font-bold text-white tracking-wide">
            {t("seeker.profile.title")}
          </h1>

          <button onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold
                       text-white/70 hover:text-white transition"
            style={{ borderColor:"rgba(255,255,255,.15)", background:"rgba(255,255,255,.06)" }}>
            <GlobeIcon />
            {isAr ? "EN" : "ع"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5 relative">

        {/* ── Hero card ── */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl"
             style={{ background:"linear-gradient(135deg,#1e3a5f,#2d5282)" }}>
          <div className="absolute inset-0 opacity-5 pointer-events-none"
               style={{ backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize:"20px 20px" }}/>
          <div className="relative px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* avatar + upload */}
            <div className="relative flex-shrink-0">
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleAvatarFile(e.target.files[0])} />
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black text-white shadow-lg"
                   style={{ background: user.picture ? "transparent" : "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
                {user.picture
                  ? <img src={user.picture} alt="" className="w-full h-full object-cover" />
                  : (user.full_name ? user.full_name.charAt(0) : "U")}
              </div>
              <button type="button" onClick={() => avatarRef.current?.click()}
                title={t("seeker.profile.avatar.change") || "تغيير الصورة"}
                className="absolute -bottom-1.5 -end-1.5 w-6 h-6 rounded-full flex items-center justify-center
                           text-white shadow-md border-2 transition hover:brightness-110"
                style={{ background: accent, borderColor: navyMd }}>
                {avatarUploading ? <SpinIcon /> : <CameraIcon />}
              </button>
            </div>

            {/* info */}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white truncate">{user.full_name}</p>
              <p className="text-sm text-white/50 mt-0.5 truncate">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {user.governorate && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background:"rgba(255,255,255,.12)", color:"rgba(255,255,255,.8)" }}>
                    📍 {user.governorate}
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background:"rgba(59,130,246,.25)", color:"#93c5fd" }}>
                  {user.skills?.length || 0} {t("seeker.profile.skills.label")}
                </span>
              </div>
            </div>

            {/* profile completion */}
            <div className="flex-shrink-0 text-center">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="2.5"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="2.5"
                          strokeDasharray={`${pct} 100`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-white">{pct}%</span>
                </div>
              </div>
              <p className="text-xs text-white/40 mt-1">{t("seeker.profile.completion")}</p>
            </div>
          </div>

          {avatarError && (
            <div className="mx-6 mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                 style={{ background:"rgba(239,68,68,.15)", color:"#fca5a5", border:"1px solid rgba(239,68,68,.2)" }}>
              {avatarError}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {TABS.map(tab => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
              style={activeTab === tab.key
                ? { background:"#fff", color: navyMd, boxShadow:"0 4px 14px rgba(0,0,0,.15)" }
                : { background:"rgba(255,255,255,.08)", color:"rgba(255,255,255,.65)" }}>
              <span>{tab.icon}</span>
              {tab.label}
              {typeof tab.count === "number" && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={activeTab === tab.key
                        ? { background:"#eef4ff", color:"#2563eb" }
                        : { background:"rgba(255,255,255,.12)", color:"rgba(255,255,255,.8)" }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Personal ── */}
        {activeTab === "personal" && (
          <Panel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("seeker.profile.fields.full_name")} required error={errors.full_name}>
                <input value={user.full_name} onChange={e => setField("full_name", e.target.value)}
                  className={inputCls + (errors.full_name ? " !border-red-300 !ring-red-100" : "")} />
              </Field>
              <Field label={t("seeker.profile.fields.email")}>
                <input type="email" value={user.email} disabled
                  className={inputCls + " opacity-60 cursor-not-allowed"} />
              </Field>
              <Field label={t("seeker.profile.fields.phone")}>
                <input value={user.phone_number} onChange={e => setField("phone_number", e.target.value)}
                  placeholder="09XXXXXXXX" className={inputCls} />
              </Field>
              <Field label={t("seeker.profile.fields.governorate")} required error={errors.governorate}>
                <div className="relative">
                  <select value={user.governorate} onChange={e => setField("governorate", e.target.value)}
                    className={selectCls + (errors.governorate ? " !border-red-300 !ring-red-100" : "")}>
                    <option value="">{t("seeker.profile.placeholders.select")}</option>
                    {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <svg className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3 text-gray-400"
                       width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </Field>
            </div>
            <div className="mt-4">
              <Field label={t("seeker.profile.fields.bio")}>
                <textarea rows={3} value={user.bio} onChange={e => setField("bio", e.target.value)}
                  placeholder={t("seeker.profile.placeholders.bio")}
                  className={inputCls + " resize-none"} />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-gray-100">
              {saved && (
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color:"#16a34a" }}>
                  <CheckIcon /> {t("seeker.profile.saved")}
                </span>
              )}
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white
                           shadow-lg hover:shadow-xl disabled:opacity-60 transition-all"
                style={{ background:`linear-gradient(135deg,${navy},${navyLt})` }}>
                {saving ? <><SpinIcon />{t("seeker.profile.saving")}</> : t("seeker.profile.save")}
              </button>
            </div>
          </Panel>
        )}

        {/* ── CV ── */}
        {activeTab === "cv" && (
          <Panel>
            <div
              onDragOver={e => { e.preventDefault(); setCvDrag(true) }}
              onDragLeave={() => setCvDrag(false)}
              onDrop={e => { e.preventDefault(); setCvDrag(false); handleCvFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
              className="relative rounded-2xl border-2 border-dashed p-8 flex flex-col items-center gap-3
                         cursor-pointer transition-all"
              style={{
                borderColor: cvDrag ? "#3b82f6" : "#c7d7fd",
                background:  cvDrag ? "#eff6ff" : "linear-gradient(135deg,#f8faff,#eef4ff)",
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                onChange={e => handleCvFile(e.target.files[0])} />

              {cvFile ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background:"#dbeafe", color:"#2563eb" }}>
                    <FileIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{cvFile.name}</p>
                    <p className="text-xs text-slate-400">{(cvFile.size/1024).toFixed(0)} KB</p>
                  </div>
                </div>
              ) : user.cv_url ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background:"#dbeafe", color:"#2563eb" }}>
                    <FileIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{t("seeker.profile.cv.existing")}</p>
                    <a href={user.cv_url} target="_blank" rel="noreferrer"
                       onClick={e => e.stopPropagation()}
                       className="text-xs text-blue-500 hover:underline">{t("seeker.profile.cv.view")}</a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                       style={{ background:"linear-gradient(135deg,#dbeafe,#c7d7fd)", color:"#2563eb" }}>
                    <UploadIcon />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600">{t("seeker.profile.cv.drag")}</p>
                    <p className="text-xs text-slate-400 mt-1">{t("seeker.profile.cv.hint")}</p>
                  </div>
                </>
              )}
            </div>
            {cvError && <p className="mt-2 text-xs text-red-400">{cvError}</p>}
            {(cvFile || user.cv_url) && (
              <button type="button" onClick={removeCv}
                className="mt-2 text-xs text-slate-400 hover:text-red-400 transition">
                {t("seeker.profile.cv.remove")}
              </button>
            )}
          </Panel>
        )}

        {/* ── Skills ── */}
        {activeTab === "skills" && (
          <Panel>
            <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
              {user.skills?.map(s => <SkillTag key={s.id} label={s.name} onRemove={() => removeSkill(s)} />)}
              {!user.skills?.length && (
                <p className="text-xs text-slate-400">{t("seeker.profile.skills.empty")}</p>
              )}
            </div>
            <div className="flex gap-2">
              <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSkill()}
                placeholder={t("seeker.profile.skills.placeholder")}
                className={inputCls + " flex-1"} />
              <button type="button" onClick={addSkill}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition"
                style={{ background:`linear-gradient(135deg,${navyMd},${navyLt})` }}>
                <PlusIcon />{t("seeker.profile.skills.add")}
              </button>
            </div>
            {skillError && <p className="mt-2 text-xs text-red-400">{skillError}</p>}
          </Panel>
        )}

        {/* ── Experience ── */}
        {activeTab === "experience" && (
          <Panel
            action={
              <button type="button"
                onClick={() => setExpModal({ mode:"add", data:{ title:"", company:"", from:"", to:"", current:false } })}
                className="flex items-center gap-1 text-xs font-bold transition"
                style={{ color: navyMd }}>
                <PlusIcon />{t("seeker.profile.add")}
              </button>
            }
          >
            {!user.experience?.length
              ? <p className="text-xs text-slate-400">{t("seeker.profile.experience.empty")}</p>
              : <div className="space-y-3">
                  {user.experience.map(exp => (
                    <TimelineCard key={exp.id}
                      top={exp.title} sub={exp.company}
                      meta={`${exp.from} — ${exp.current ? t("seeker.profile.experience.present") : exp.to}`}
                      onEdit={() => setExpModal({ mode:"edit", data:{ ...exp } })}
                      onDelete={() => deleteExp(exp.id)}
                    />
                  ))}
                </div>
            }
          </Panel>
        )}

        {/* ── Education ── */}
        {activeTab === "education" && (
          <Panel
            action={
              <button type="button"
                onClick={() => setEduModal({ mode:"add", data:{ degree:"", institution:"", year:"" } })}
                className="flex items-center gap-1 text-xs font-bold transition"
                style={{ color: navyMd }}>
                <PlusIcon />{t("seeker.profile.add")}
              </button>
            }
          >
            {!user.education?.length
              ? <p className="text-xs text-slate-400">{t("seeker.profile.education.empty")}</p>
              : <div className="space-y-3">
                  {user.education.map(edu => (
                    <TimelineCard key={edu.id}
                      top={edu.degree} sub={edu.institution} meta={edu.year}
                      onEdit={() => setEduModal({ mode:"edit", data:{ ...edu } })}
                      onDelete={() => deleteEdu(edu.id)}
                    />
                  ))}
                </div>
            }
          </Panel>
        )}

        <div className="pb-4" />
      </div>

      {/* ══ Modals ══ */}
      {expModal && (
        <Modal title={t(`seeker.profile.experience.${expModal.mode}`)} onClose={() => setExpModal(null)}>
          <ExpForm data={expModal.data}
            onChange={d => setExpModal(p => ({ ...p, data:d }))}
            onSave={() => saveExp(expModal.data)}
            onCancel={() => setExpModal(null)} t={t} />
        </Modal>
      )}
      {eduModal && (
        <Modal title={t(`seeker.profile.education.${eduModal.mode}`)} onClose={() => setEduModal(null)}>
          <EduForm data={eduModal.data}
            onChange={d => setEduModal(p => ({ ...p, data:d }))}
            onSave={() => saveEdu(eduModal.data)}
            onCancel={() => setEduModal(null)} t={t} />
        </Modal>
      )}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background:"rgba(15,23,42,.6)" }}/>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                       hover:bg-slate-100 hover:text-slate-700 transition text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Forms ───────────────────────────────────────────────────────
function ExpForm({ data, onChange, onSave, onCancel, t }) {
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-4">
      <Field label={t("seeker.profile.experience.fields.title")} required>
        <input value={data.title} onChange={e => set("title", e.target.value)} className={inputCls}
          placeholder={t("seeker.profile.experience.fields.title")} />
      </Field>
      <Field label={t("seeker.profile.experience.fields.company")} required>
        <input value={data.company} onChange={e => set("company", e.target.value)} className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("seeker.profile.experience.fields.from")}>
          <input type="month" value={data.from} onChange={e => set("from", e.target.value)} className={inputCls} />
        </Field>
        <Field label={t("seeker.profile.experience.fields.to")}>
          <input type="month" value={data.to} disabled={data.current}
            onChange={e => set("to", e.target.value)}
            className={inputCls + (data.current ? " opacity-40 cursor-not-allowed" : "")} />
        </Field>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
        <input type="checkbox" checked={data.current} onChange={e => set("current", e.target.checked)}
          className="w-4 h-4 accent-blue-600" />
        {t("seeker.profile.experience.fields.current")}
      </label>
      <ModalActions onCancel={onCancel} onSave={onSave} t={t} />
    </div>
  )
}

function EduForm({ data, onChange, onSave, onCancel, t }) {
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-4">
      <Field label={t("seeker.profile.education.fields.degree")} required>
        <input value={data.degree} onChange={e => set("degree", e.target.value)} className={inputCls} />
      </Field>
      <Field label={t("seeker.profile.education.fields.institution")} required>
        <input value={data.institution} onChange={e => set("institution", e.target.value)} className={inputCls} />
      </Field>
      <Field label={t("seeker.profile.education.fields.year")}>
        <input type="number" min="1990" max="2030" value={data.year}
          onChange={e => set("year", e.target.value)} className={inputCls} />
      </Field>
      <ModalActions onCancel={onCancel} onSave={onSave} t={t} />
    </div>
  )
}

function ModalActions({ onCancel, onSave, t }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onCancel}
        className="px-4 py-2 text-sm text-slate-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
        {t("seeker.profile.cancel")}
      </button>
      <button type="button" onClick={onSave}
        className="px-5 py-2 text-sm text-white rounded-xl transition font-semibold"
        style={{ background:`linear-gradient(135deg,#1e3a5f,#2d5282)` }}>
        {t("seeker.profile.save_entry")}
      </button>
    </div>
  )
}
