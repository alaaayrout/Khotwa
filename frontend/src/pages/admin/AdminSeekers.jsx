// src/pages/admin/AdminSeekers.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Ban, CheckCircle } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import ConfirmModal from "../../components/admin/ConfirmModal";
import StatusBadge from "../../components/admin/StatusBadge";
import { seekersApi } from "../../services/adminApi";
import { useAdminList } from "./useAdminList";

export default function AdminSeekers() {
  const { t } = useTranslation();
  const { rows, loading, error, search, setSearch, page, setPage, totalPages, runAction } =
    useAdminList(seekersApi.list);

  const [confirmTarget, setConfirmTarget] = useState(null); // { type: 'delete'|'toggle', row }
  const [busy, setBusy] = useState(false);

  const columns = [
    { key: "full_name", label: t("admin.seekers.col_name") },
    { key: "email", label: t("admin.seekers.col_email") },
    { key: "phone", label: t("admin.seekers.col_phone") },
    {
      key: "date_joined",
      label: t("admin.seekers.col_joined"),
      render: (row) => new Date(row.date_joined).toLocaleDateString(),
    },
    {
      key: "is_active",
      label: t("admin.common.status"),
      render: (row) => (
        <StatusBadge
          status={row.is_active ? "active" : "suspended"}
          label={row.is_active ? t("admin.common.active") : t("admin.common.suspended")}
        />
      ),
    },
  ];

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setBusy(true);
    try {
      if (confirmTarget.type === "delete") {
        await runAction(() => seekersApi.delete(confirmTarget.row.id));
      } else {
        await runAction(() =>
          seekersApi.toggleActive(confirmTarget.row.id, !confirmTarget.row.is_active)
        );
      }
      setConfirmTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-6">{t("admin.nav.seekers")}</h2>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        search={{ value: search, onChange: setSearch, placeholder: t("admin.seekers.search_ph") }}
        pagination={{ page, totalPages, onPageChange: setPage }}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <button
              title={row.is_active ? t("admin.common.suspend") : t("admin.common.activate")}
              onClick={() => setConfirmTarget({ type: "toggle", row })}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {row.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
            </button>
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
        title={
          confirmTarget?.type === "delete"
            ? t("admin.seekers.confirm_delete_title")
            : confirmTarget?.row?.is_active
            ? t("admin.seekers.confirm_suspend_title")
            : t("admin.seekers.confirm_activate_title")
        }
        message={
          confirmTarget?.type === "delete"
            ? t("admin.seekers.confirm_delete_msg", { name: confirmTarget?.row?.full_name })
            : t("admin.seekers.confirm_toggle_msg", { name: confirmTarget?.row?.full_name })
        }
        confirmLabel={
          confirmTarget?.type === "delete" ? t("admin.common.delete") : t("admin.common.confirm")
        }
        danger={confirmTarget?.type === "delete" || confirmTarget?.row?.is_active}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
