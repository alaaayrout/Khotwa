// src/pages/admin/CompanyDetailModal.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, X } from "lucide-react";
import { companiesApi } from "../../services/adminApi";
import StatusBadge from "../../components/admin/StatusBadge";

const STATUS_LABEL_KEY = {
  approved: "admin.common.approved",
  pending_admin_approval: "admin.common.pending",
  rejected: "admin.common.rejected",
};

/**
 * مودال تفاصيل الشركة الكاملة — بيجيب البيانات من GET /admin/companies/{id}/
 * وبيسمح بالموافقة/الرفض مباشرة من جواه.
 *
 * props: companyId, onClose, onApproved, onRejected
 */
export default function CompanyDetailModal({ companyId, onClose, onApproved, onRejected }) {
  const { t } = useTranslation();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    companiesApi
      .get(companyId)
      .then((data) => {
        if (!cancelled) setCompany(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const handleApprove = async () => {
    setBusy(true);
    try {
      await companiesApi.approve(companyId);
      onApproved?.();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await companiesApi.reject(companyId, rejectReason);
      onRejected?.();
    } finally {
      setBusy(false);
    }
  };

  const isPending = company?.status === "pending_admin_approval";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#1e3a5f] to-[#0f2544] border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{t("admin.companies.detail_title")}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {loading && (
          <p className="text-white/60 text-sm py-8 text-center">{t("admin.common.loading")}</p>
        )}

        {!loading && error && (
          <p className="text-red-300 text-sm py-8 text-center">{t("admin.common.load_error")}</p>
        )}

        {!loading && !error && company && (
          <>
            <div className="mb-4">
              <StatusBadge
                status={company.status}
                label={t(STATUS_LABEL_KEY[company.status] || company.status)}
              />
            </div>

            <dl className="space-y-3 text-sm mb-6">
              <Row label={t("admin.companies.col_name")} value={company.name} />
              <Row label={t("admin.companies.col_email")} value={company.email} />
              <Row label={t("admin.companies.field_phone")} value={company.phone} />
              <Row label={t("admin.companies.field_governorate")} value={company.governorate} />
              <Row label={t("admin.companies.col_sector")} value={company.sector} />
              <Row
                label={t("admin.companies.field_website")}
                value={company.website_url || t("admin.companies.field_not_provided")}
              />
              <Row
                label={t("admin.companies.field_description")}
                value={company.description || t("admin.companies.field_not_provided")}
                block
              />
              {company.status === "rejected" && company.rejection_reason && (
                <Row
                  label={t("admin.companies.field_rejection_reason")}
                  value={company.rejection_reason}
                  block
                />
              )}
              <Row
                label={t("admin.companies.field_created_at")}
                value={new Date(company.created_at).toLocaleDateString()}
              />
            </dl>

            {isPending && !showRejectReason && (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/90 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {t("admin.common.approve")}
                </button>
                <button
                  onClick={() => setShowRejectReason(true)}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/90 text-white text-sm font-medium hover:bg-amber-500 transition-colors disabled:opacity-50"
                >
                  <XCircle size={16} />
                  {t("admin.common.reject")}
                </button>
              </div>
            )}

            {isPending && showRejectReason && (
              <div>
                <label className="block text-sm text-white/70 mb-1">
                  {t("admin.companies.reject_reason_label")}
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t("admin.companies.reject_reason_ph")}
                  className="w-full rounded-xl bg-white/90 text-[#0f2544] px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectReason(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                  >
                    {t("admin.common.cancel")}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={busy}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/90 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    {busy ? t("admin.common.processing") : t("admin.common.reject")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, block }) {
  return (
    <div className={block ? "" : "flex justify-between gap-4"}>
      <dt className="text-white/50">{label}</dt>
      <dd className={`text-white/90 ${block ? "mt-1" : "text-end"}`}>{value}</dd>
    </div>
  );
}