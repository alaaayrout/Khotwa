// src/components/admin/ConfirmModal.jsx
import { useTranslation } from "react-i18next";

/**
 * مودال تأكيد بسيط قبل أي عملية حساسة (حذف، إيقاف، رفض...)
 * open, title, message, confirmLabel, danger (بولين لتلوين زر التأكيد أحمر), onConfirm, onCancel
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  danger = true,
  loading,
  onConfirm,
  onCancel,
  requireReason = false,
  reason = "",
  onReasonChange,
  reasonLabel,
  reasonPlaceholder,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  const reasonMissing = requireReason && !reason.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#1e3a5f] to-[#0f2544] border border-white/10 p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/70 mb-4">{message}</p>

        {requireReason && (
          <div className="mb-4">
            <label className="block text-sm text-white/70 mb-1">
              {reasonLabel || t("admin.common.reason_label")}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => onReasonChange?.(e.target.value)}
              placeholder={reasonPlaceholder || t("admin.common.reason_placeholder")}
              className="w-full rounded-xl bg-white/90 text-[#0f2544] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
          >
            {t("admin.common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || reasonMissing}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              danger
                ? "bg-red-500/90 text-white hover:bg-red-500"
                : "bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90"
            }`}
          >
            {loading ? t("admin.common.processing") : confirmLabel || t("admin.common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}