// src/pages/admin/useAdminList.js
import { useCallback, useEffect, useState } from "react";

/**
 * هوك مشترك لكل صفحات القوائم بالأدمن (users/companies/jobs/cvs).
 * يتعامل مع: تحميل البيانات، البحث (مع debounce)، الصفحات، وتنفيذ actions
 * مع تحديث القائمة تلقائياً بعدها.
 *
 * listFn: (params) => Promise<{ results, count } | array>
 *   بيدعم شكل DRF pagination العادي ({ results, count }) أو array عادي
 *   إذا الـ backend ما زال ما مفعّل عليه pagination.
 */
export function useAdminList(listFn, { pageSize = 10 } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFn({ search, page, page_size: pageSize });
      if (Array.isArray(data)) {
        setRows(data);
        setTotalPages(1);
      } else {
        setRows(data.results || []);
        setTotalPages(Math.max(1, Math.ceil((data.count || 0) / pageSize)));
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [listFn, search, page, pageSize]);

  // debounce بسيط عالبحث
  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  /** ينفذ أي action (approve/delete/...) وبعدين يعيد تحميل القائمة */
  const runAction = useCallback(
    async (actionFn) => {
      await actionFn();
      await fetchData();
    },
    [fetchData]
  );

  return {
    rows,
    loading,
    error,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    refetch: fetchData,
    runAction,
  };
}
