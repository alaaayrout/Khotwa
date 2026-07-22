// src/pages/admin/AdminJobs.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Ban, PlayCircle, Pencil } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import ConfirmModal from "../../components/admin/ConfirmModal";
import StatusBadge from "../../components/admin/StatusBadge";
import { jobsApi } from "../../services/adminApi";
import { useAdminList } from "./useAdminList";
import EditJobModal from "./EditJobModal";

export default function AdminJobs() {
  const { t } = useTranslation();
  const { rows, loading, error, search, setSearch, page, setPage, totalPages, runAction } =
    useAdminList(jobsApi.list);

  const [confirmTarget, setConfirmTarget] = useState(null); // { type: 'suspend'|'activate'|'delete', row }
  const [editingJob, setEditingJob] = useState(null); // row أو null
  const [busy, setBusy] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const columns = [
    { key: "title", label: t("admin.jobs.col_title") },
    { key: "company_name", label: t("admin.jobs.col_company") },
    { key: "governorate", label: t("admin.jobs.col_location") },
    {
      key: "created_at",
      label: t("admin.jobs.col_posted"),
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "status",
      label: t("admin.common.status"),
      render: (row) => (
        <StatusBadge
          status={row.status === "active" ? "active" : "suspended"}
          label={row.status === "active" ? t("admin.common.active") : t("admin.common.suspended")}
        />
      ),
    },
  ];

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setBusy(true);
    try {
      const { type, row } = confirmTarget;
      if (type === "suspend") await runAction(() => jobsApi.suspend(row.id));
      if (type === "activate") await runAction(() => jobsApi.activate(row.id));
      if (type === "delete") await runAction(() => jobsApi.delete(row.id, deleteReason));
      setConfirmTarget(null);
      setDeleteReason("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-6">{t("admin.nav.jobs")}</h2>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        search={{ value: search, onChange: setSearch, placeholder: t("admin.jobs.search_ph") }}
        pagination={{ page, totalPages, onPageChange: setPage }}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <button
              title={t("admin.common.edit")}
              onClick={() => setEditingJob(row)}
              className="p-2 rounded-lg bg-[#3b82f6]/15 text-[#93c5fd] hover:bg-[#3b82f6]/25 transition-colors"
            >
              <Pencil size={16} />
            </button>
            {row.status === "active" ? (
              <button
                title={t("admin.common.suspend")}
                onClick={() => setConfirmTarget({ type: "suspend", row })}
                className="p-2 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors"
              >
                <Ban size={16} />
              </button>
            ) : (
              <button
                title={t("admin.common.activate")}
                onClick={() => setConfirmTarget({ type: "activate", row })}
                className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
              >
                <PlayCircle size={16} />
              </button>
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
        title={t(`admin.jobs.confirm_${confirmTarget?.type}_title`)}
        message={t(`admin.jobs.confirm_${confirmTarget?.type}_msg`, {
          title: confirmTarget?.row?.title,
        })}
        confirmLabel={t(`admin.common.${confirmTarget?.type === "delete" ? "delete" : confirmTarget?.type}`)}
        danger={confirmTarget?.type !== "activate"}
        requireReason={confirmTarget?.type === "delete"}
        reason={deleteReason}
        onReasonChange={setDeleteReason}
        reasonLabel={t("admin.jobs.delete_reason_label")}
        reasonPlaceholder={t("admin.jobs.delete_reason_ph")}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmTarget(null);
          setDeleteReason("");
        }}
      />

      {editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSaved={async () => {
            setEditingJob(null);
            await runAction(() => Promise.resolve());
          }}
        />
      )}
    </div>
  );
}