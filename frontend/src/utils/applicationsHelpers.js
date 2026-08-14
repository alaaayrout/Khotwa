// src/utils/applicationsHelpers.js
// أدوات مساعدة لصفحة "إدارة الطلبات" (Company Applications)
import { API_BASE } from "../config"

// ── مؤكّد من الباك إند: الحقل يلي بيربط الطلب بالوظيفة هو job_posting (FK) ─
export function getJobId(app) {
  return app.job_posting ?? app.job_id ?? app.job ?? "unknown"
}

// ── TODO(Farah): تأكدي من اسم حقل تاريخ التقديم (applied_at / created_at / submitted_at) ─
export function getAppliedAt(app) {
  return app.applied_at || app.created_at || app.submitted_at || null
}

// ── الإيميل موجود ضمن applicant_profile.email (CompanyApplicationSerializer) ─
export function getSeekerEmail(app) {
  return (
    app.seeker_email ||
    app.email ||
    app.applicant_profile?.email ||
    app.job_seeker?.email ||
    app.seeker?.email ||
    null
  )
}

// ── باقي حقول بروفايل الباحث (كلها موجودة ضمن applicant_profile) ──────────
export function getSeekerPhone(app) {
  return app.applicant_profile?.phone_number || null
}

export function getSeekerGovernorate(app) {
  return app.applicant_profile?.governorate || null
}

export function getSeekerBio(app) {
  return app.applicant_profile?.bio || null
}

export function getSeekerCv(app) {
  return app.applicant_profile?.cv_file || null
}

// ── صورة البروفايل: تدعم applicant_profile.profile_picture (CompanyApplicationSerializer)
// و seeker_profile_picture (JobApplicationSerializer) حسب أي serializer فعلياً مستخدم
// ── مؤكّد من الباك إند: الحقل بيرجع مسار نسبي ("/media/profile_pictures/...")
// مش رابط كامل، لأنو الـ serializer عم يتنادى بدون context={'request': request} بالـ view.
// لحد ما ينضاف هيك بالباك إند، منبني الرابط الكامل هون بإضافة أصل السيرفر (origin).
function getMediaOrigin() {
  try {
    return new URL(API_BASE).origin
  } catch {
    return ""
  }
}

export function getSeekerProfilePicture(app) {
  const raw = app.applicant_profile?.profile_picture || app.seeker_profile_picture || null
  if (!raw) return null
  if (raw.startsWith("http")) return raw // أصلاً رابط كامل، ما بنلمسه
  return `${getMediaOrigin()}${raw}`
}

export function getSeekerExperiences(app) {
  return app.applicant_profile?.experiences || []
}

export function getSeekerEducation(app) {
  return app.applicant_profile?.education_entries || []
}

// ── نسبة التطابق (Match Score) ──────────────────────────────────────────
// بدل ما نعتمد على embedding الباك إند (اللي فيه باگ حالياً بـ EmbeddingService.encode_text:
// كل نص عم ياخد vocabulary مستقل، يعني نسب التشابه منو مش موثوقة رياضياً)، منحسب هون
// تطابق بسيط اعتماداً على "تقاطع المهارات" (Skill Overlap) بين متطلبات الوظيفة ومهارات الباحث.
// هاد الأسلوب:
//   - أبسط وأشفف من المستخدمة (بيعرف تفسر ليش الرقم طلع هيك)
//   - مش عرضة لباگ الـ embedding لأنو أصلاً ما عم نستخدم EmbeddingService
//   - بس هو مؤشر أولي بس (skill overlap) مش تحليل دلالي عميق للنص
//   - لاحقاً بمرحلة تانية ممكن تنستبدل بـ multilingual embeddings سليمة (متل ما حكينا سابقاً)

function normalizeSkillList(list) {
  if (!Array.isArray(list)) return null
  return list
    .map(s => (typeof s === "string" ? s : s?.name))
    .filter(Boolean)
    .map(s => s.trim().toLowerCase())
}

export function computeSkillOverlapScore(requiredSkills, seekerSkills) {
  const req = normalizeSkillList(requiredSkills)
  const has = normalizeSkillList(seekerSkills)
  if (!req || !has || req.length === 0 || has.length === 0) return null

  const seekerSet = new Set(has)
  const matched = req.filter(skill => seekerSet.has(skill)).length
  return Math.round((matched / req.length) * 100)
}

export function getMatchScore(app) {
  // أولوية 1: لو الباك إند بعت match_score جاهز (لسا فيه باگ الـ embedding، فمش لازم نعتمد عليه حالياً)
  const raw = app.match_score ?? app.match_percentage ?? null
  if (raw !== null && raw !== undefined) {
    return Math.round(raw <= 1 ? raw * 100 : raw)
  }

  // أولوية 2: حساب بسيط بالاعتماد على تقاطع المهارات (client-side)
  // TODO(Farah): مؤكّد من الباك إند إنو هاي الحقول لسا مش موجودة بالـ response:
  //   - job_required_skills: بدها حقل جديد بموديل JobPosting نفسو (required_skills)
  //     مش موجود حالياً أبداً، يعني لازم Migration جديدة قبل ما تنضاف للـ serializer
  //   - seeker_skills: البيانات موجودة أصلاً بـ SeekerProfile.skills، بس ناقصة من serializer الطلبات
  // لحد ما تنضاف الاثنين، رح ترجع null دايماً وخيار "التطابق" رح يضل معطّل بالواجهة تلقائياً
  const requiredSkills = app.job_required_skills || app.job_skills || null
  const seekerSkills = app.seeker_skills || app.applicant_skills || null
  return computeSkillOverlapScore(requiredSkills, seekerSkills)
}
export function filterApplicationsByJob(applications, jobId) {
  return applications.filter(app => String(getJobId(app)) === String(jobId))
}

export function getJobTitle(app) {
  return app.job_title || app.job?.title || app.job_posting_title || "-"
}

export function getSeekerName(app) {
  return (
    app.applicant_profile?.full_name ||
    app.seeker_name ||
    app.applicant_name ||
    app.full_name ||
    app.job_seeker?.full_name ||
    app.seeker?.full_name ||
    "-"
  )
}

export function getSeekerSkills(app) {
  const skills =
    app.applicant_profile?.skills ||
    app.seeker_skills ||
    app.applicant_skills ||
    app.job_seeker?.skills ||
    app.seeker?.skills ||
    []

  return Array.isArray(skills)
    ? skills.map(s => (typeof s === "string" ? s : s?.name)).filter(Boolean)
    : []
}

export function getRequiredSkills(app) {
  const skills =
    app.job_required_skills ||
    app.job_skills ||
    app.job?.required_skills ||
    []

  return Array.isArray(skills)
    ? skills.map(s => (typeof s === "string" ? s : s?.name)).filter(Boolean)
    : []
}
// ── تجميع الطلبات حسب الوظيفة ───────────────────────────────────────────
export function groupApplicationsByJob(applications) {
  const map = new Map()
  for (const app of applications) {
    const jobId = getJobId(app)
    if (!map.has(jobId)) {
      map.set(jobId, {
        jobId,
        jobTitle: app.job_title || "-",
        applications: [],
      })
    }
    map.get(jobId).applications.push(app)
  }
  // ترتيب المجموعات: الوظيفة يلي فيها طلبات معلّقة (pending) أكتر تطلع فوق
  return Array.from(map.values()).sort((a, b) => {
    const pendingA = a.applications.filter(x => (x.status || "pending") === "pending").length
    const pendingB = b.applications.filter(x => (x.status || "pending") === "pending").length
    return pendingB - pendingA
  })
}

// ── ترتيب الطلبات جوّا كل وظيفة ──────────────────────────────────────────
// sortBy: "newest" | "oldest" | "match"
export function sortApplications(applications, sortBy) {
  const list = [...applications]

  if (sortBy === "match") {
    return list.sort((a, b) => {
      const ma = getMatchScore(a)
      const mb = getMatchScore(b)
      if (ma === null && mb === null) return 0
      if (ma === null) return 1   // يلي ما إلها match score تنزل تحت
      if (mb === null) return -1
      return mb - ma
    })
  }

  if (sortBy === "oldest") {
    return list.sort((a, b) => new Date(getAppliedAt(a) || 0) - new Date(getAppliedAt(b) || 0))
  }

  // "newest" (الافتراضي)
  return list.sort((a, b) => new Date(getAppliedAt(b) || 0) - new Date(getAppliedAt(a) || 0))
}

export function formatAppliedDate(dateStr, isAr) {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleDateString(isAr ? "ar-SY" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}