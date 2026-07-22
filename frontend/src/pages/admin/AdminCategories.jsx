// src/pages/admin/AdminCategories.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Pencil, Plus } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import ConfirmModal from "../../components/admin/ConfirmModal";
import { categoriesApi } from "../../services/adminApi";

export default function AdminCategories() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null); // { id?, name_ar, name_en } أو null لما مسكّر
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.list();
      setRows(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = [
    { key: "name_ar", label: t("admin.categories.col_name_ar") },
    { key: "name_en", label: t("admin.categories.col_name_en") },
    { key: "jobs_count", label: t("admin.categories.col_jobs_count") },
  ];

  const openCreate = () => {
    setFieldErrors({});
    setEditing({ name_ar: "", name_en: "" });
  };

  const openEdit = (row) => {
    setFieldErrors({});
    setEditing(row);
  };

  const handleSave = async () => {
    setSaving(true);
    setFieldErrors({});
    try {
      if (editing.id) {
        await categoriesApi.update(editing.id, {
          name_ar: editing.name_ar,
          name_en: editing.name_en,
        });
      } else {
        await categoriesApi.create({ name_ar: editing.name_ar, name_en: editing.name_en });
      }
      setEditing(null);
      await load();
    } catch (err) {
      if (err.data && typeof err.data === "object") setFieldErrors(err.data);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setDeleteError(null);
    try {
      await categoriesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setDeleteError(err.data?.detail || t("admin.categories.delete_error_generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">{t("admin.nav.categories")}</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3b82f6] text-white text-sm font-medium hover:bg-[#3b82f6]/90 transition-colors"
        >
          <Plus size={16} />
          {t("admin.categories.add")}
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <button
              title={t("admin.common.edit")}
              onClick={() => openEdit(row)}
              className="p-2 rounded-lg bg-[#3b82f6]/15 text-[#93c5fd] hover:bg-[#3b82f6]/25 transition-colors"
            >
              <Pencil size={16} />
            </button>
            <button
              title={t("admin.common.delete")}
              onClick={() => setDeleteTarget(row)}
              className="p-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      {/* مودال الإضافة/التعديل */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#1e3a5f] to-[#0f2544] border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editing.id ? t("admin.categories.edit_title") : t("admin.categories.add_title")}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">
                  {t("admin.categories.field_name_ar")}
                </label>
                <input
                  value={editing.name_ar}
                  onChange={(e) => setEditing((s) => ({ ...s, name_ar: e.target.value }))}
                  dir="rtl"
                  className="w-full rounded-xl bg-white/90 text-[#0f2544] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
                {fieldErrors.name_ar && (
                  <p className="text-red-300 text-xs mt-1">{fieldErrors.name_ar[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  {t("admin.categories.field_name_en")}
                </label>
                <input
                  value={editing.name_en}
                  onChange={(e) => setEditing((s) => ({ ...s, name_en: e.target.value }))}
                  dir="ltr"
                  className="w-full rounded-xl bg-white/90 text-[#0f2544] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
                {fieldErrors.name_en && (
                  <p className="text-red-300 text-xs mt-1">{fieldErrors.name_en[0]}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditing(null)}
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
      )}

      <ConfirmModal
        open={!!deleteTarget}
        loading={busy}
        title={t("admin.categories.confirm_delete_title")}
        message={deleteError || t("admin.categories.confirm_delete_msg", { name: deleteTarget?.name_ar })}
        confirmLabel={t("admin.common.delete")}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}