// src/pages/admin/AdminCompanies.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, CheckCircle, XCircle } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import ConfirmModal from "../../components/admin/ConfirmModal";
import StatusBadge from "../../components/admin/StatusBadge";
import { companiesApi } from "../../services/adminApi";
import { useAdminList } from "./useAdminList";

// القيمة الحقيقية الجاية من الـ backend هي "pending_admin_approval" (مش "pending")
// حسب approval_status بموديل Company. خليناها متطابقة معه بدل ما نطلب من الباك اند تغييرها.
const STATUS_LABEL_KEY = {
  approved: "admin.common.approved",
  pending_admin_approval: "admin.common.pending",
  rejected: "admin.common.rejected",
};

const PENDING_STATUS = "pending_admin_approval";

export default function AdminCompanies() {
  const { t } = useTranslation();
  const { rows, loading, error, search, setSearch, page, setPage, totalPages, runAction } =
    useAdminList(companiesApi.list);

  const [confirmTarget, setConfirmTarget] = useState(null); // { type: 'approve'|'reject'|'delete', row }
  const [busy, setBusy] = useState(false);

  const columns = [
    { key: "name", label: t("admin.companies.col_name") },
    { key: "email", label: t("admin.companies.col_email") },
    { key: "sector", label: t("admin.companies.col_sector") },
    {
      key: "status",
      label: t("admin.common.status"),
      render: (row) => (
        <StatusBadge status={row.status} label={t(STATUS_LABEL_KEY[row.status] || row.status)} />
      ),
    },
  ];

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setBusy(true);
    try {
      const { type, row } = confirmTarget;
      if (type === "approve") await runAction(() => companiesApi.approve(row.id));
      if (type === "reject") await runAction(() => companiesApi.reject(row.id));
      if (type === "delete") await runAction(() => companiesApi.delete(row.id));
      setConfirmTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-6">{t("admin.nav.companies")}</h2>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        search={{ value: search, onChange: setSearch, placeholder: t("admin.companies.search_ph") }}
        pagination={{ page, totalPages, onPageChange: setPage }}
        actions={(row) => (
          <div className="flex items-center gap-2">
            {row.status === PENDING_STATUS && (
              <>
                <button
                  title={t("admin.common.approve")}
                  onClick={() => setConfirmTarget({ type: "approve", row })}
                  className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                >
                  <CheckCircle size={16} />
                </button>
                <button
                  title={t("admin.common.reject")}
                  onClick={() => setConfirmTarget({ type: "reject", row })}
                  className="p-2 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors"
                >
                  <XCircle size={16} />
                </button>
              </>
            )}
            <button
              title={t("admin.common.delete")}
              onClick={() => setConfirmTarget({ type: "delete", row })}
              className="p-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <ConfirmModal
        open={!!confirmTarget}
        loading={busy}
        title={t(`admin.companies.confirm_${confirmTarget?.type}_title`)}
        message={t(`admin.companies.confirm_${confirmTarget?.type}_msg`, {
          name: confirmTarget?.row?.name,
        })}
        confirmLabel={t(`admin.common.${confirmTarget?.type === "delete" ? "delete" : confirmTarget?.type}`)}
        danger={confirmTarget?.type !== "approve"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
