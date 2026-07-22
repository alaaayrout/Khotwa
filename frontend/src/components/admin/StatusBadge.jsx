// src/components/admin/StatusBadge.jsx

const STYLES = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  pending_admin_approval: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  suspended: "bg-red-500/15 text-red-300 border-red-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  inactive: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export default function StatusBadge({ status, label }) {
  const style = STYLES[status] || STYLES.inactive;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}
    >
      {label || status}
    </span>
  );
}
