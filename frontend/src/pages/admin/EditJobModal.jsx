// src/pages/admin/EditJobModal.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { jobsApi } from "../../services/adminApi";

/**
 * مودال تعديل بسيط لإعلان الوظيفة من طرف الأدمن.
 * ملاحظة: هاد فورم مبسّط بالحقول الأساسية. إذا بدك نفس فورم PostJob.jsx
 * بالكامل (مع كل الحقول)، ممكن نستورد نفس الفورم ونمرر له وضع "تعديل من الأدمن"
 * بدل ما نعيد بناء فورم جديد من الصفر.
 */
export default function EditJobModal({ job, onClose, onSaved }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: job.title || "",
    description: job.description || "",
    governorate: job.governorate || "",
  });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSave = async () => {
    setSaving(true);
    setFieldErrors({});
    try {
      await jobsApi.update(job.id, form);
      onSaved();
    } catch (err) {
      // نفس منطقك بمشروعك: قراءة أخطاء DRF لكل حقل وعرضها تحت الحقل المعني
      if (err.data && typeof err.data === "object") {
        setFieldErrors(err.data);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#1e3a5f] to-[#0f2544] border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">{t("admin.jobs.edit_title")}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">
              {t("admin.jobs.field_title")}
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-xl bg-white/90 text-[#0f2544] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            />
            {fieldErrors.title && (
              <p className="text-red-300 text-xs mt-1">{fieldErrors.title[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              {t("admin.jobs.field_description")}
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl bg-white/90 text-[#0f2544] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            />
            {fieldErrors.description && (
              <p className="text-red-300 text-xs mt-1">{fieldErrors.description[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              {t("admin.jobs.field_governorate")}
            </label>
            <input
              value={form.governorate}
              onChange={(e) => setForm((f) => ({ ...f, governorate: e.target.value }))}
              className="w-full rounded-xl bg-white/90 text-[#0f2544] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
          >
            {t("admin.common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-[#3b82f6] text-white text-sm font-medium hover:bg-[#3b82f6]/90 transition-colors disabled:opacity-50"
          >
            {saving ? t("admin.common.processing") : t("admin.common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
