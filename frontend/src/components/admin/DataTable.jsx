// src/components/admin/DataTable.jsx
import { useTranslation } from "react-i18next";

/**
 * جدول عام قابل لإعادة الاستخدام لكل صفحات الأدمن.
 *
 * columns: [{ key, label, render?(row) }]
 * rows: array of objects
 * actions: (row) => ReactNode  -- أزرار الإجراءات لكل صف
 * loading, error, emptyMessage
 * search: { value, onChange, placeholder }
 * pagination: { page, totalPages, onPageChange }
 */
export default function DataTable({
  columns,
  rows,
  actions,
  loading,
  error,
  emptyMessage,
  search,
  pagination,
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 overflow-hidden">
      {search && (
        <div className="p-4 border-b border-white/10">
          <input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder || t("admin.common.search")}
            className="w-full rounded-xl bg-white/90 text-[#0f2544] placeholder:text-slate-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-white/60 border-b border-white/10">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium text-start whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 font-medium text-start whitespace-nowrap">
                  {t("admin.common.actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-white/50">
                  {t("admin.common.loading")}
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-red-300">
                  {t("admin.common.load_error")}
                </td>
              </tr>
            )}

            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-white/50">
                  {emptyMessage || t("admin.common.empty")}
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-white/90 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3">{actions(row)}</td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-4 border-t border-white/10">
          <button
            disabled={pagination.page <= 1}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
          >
            {t("admin.common.prev")}
          </button>
          <span className="text-white/70 text-sm px-2">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
          >
            {t("admin.common.next")}
          </button>
        </div>
      )}
    </div>
  );
}
