// src/pages/admin/AdminCVs.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Eye } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import ConfirmModal from "../../components/admin/ConfirmModal";
import { cvsApi } from "../../services/adminApi";
import { useAdminList } from "./useAdminList";

export default function AdminCVs() {
  const { t } = useTranslation();
  const { rows, loading, error, search, setSearch, page, setPage, totalPages, runAction } =
    useAdminList(cvsApi.list);

  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const columns = [
    { key: "seeker_name", label: t("admin.cvs.col_owner") },
    { key: "file_name", label: t("admin.cvs.col_file") },
    {
      key: "uploaded_at",
      label: t("admin.cvs.col_uploaded"),
      render: (row) => new Date(row.uploaded_at).toLocaleDateString(),
    },
  ];

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await runAction(() => cvsApi.delete(target.id));
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-6">{t("admin.nav.cvs")}</h2>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        search={{ value: search, onChange: setSearch, placeholder: t("admin.cvs.search_ph") }}
        pagination={{ page, totalPages, onPageChange: setPage }}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <a
              href={row.file_url}
              target="_blank"
              rel="noreferrer"
              title={t("admin.common.view")}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors inline-flex"
            >
              <Eye size={16} />
            </a>
            <button
              title={t("admin.common.delete")}
              onClick={() => setTarget(row)}
              className="p-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <ConfirmModal
        open={!!target}
        loading={busy}
        title={t("admin.cvs.confirm_delete_title")}
        message={t("admin.cvs.confirm_delete_msg", { name: target?.seeker_name })}
        confirmLabel={t("admin.common.delete")}
        onConfirm={handleConfirm}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
