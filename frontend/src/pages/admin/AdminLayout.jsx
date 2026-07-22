// src/pages/admin/AdminLayout.jsx
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  Tag,
  LogOut,
  Languages,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin/seekers", key: "seekers", Icon: Users },
  { to: "/admin/companies", key: "companies", Icon: Building2 },
  { to: "/admin/jobs", key: "jobs", Icon: Briefcase },
  { to: "/admin/cvs", key: "cvs", Icon: FileText },
  { to: "/admin/categories", key: "categories", Icon: Tag },
];

const TOKEN_KEY = "admin_token";

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [tokenInput, setTokenInput] = useState("");

  // حراسة بسيطة: لسا ما في صفحة admin login حقيقية، فلو ما في توكن
  // منعرض شاشة "أدخلي التوكن" مؤقتاً لحد ما تنبني صفحة الدخول الفعلية.
  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem(TOKEN_KEY));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSaveToken = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    localStorage.setItem(TOKEN_KEY, tokenInput.trim());
    setToken(tokenInput.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    navigate("/admin");
  };

  const toggleLanguage = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = next;
  };

  const currentSection =
    NAV_ITEMS.find((item) => window.location.pathname.startsWith(item.to))?.key || "title";

  // ------------------------------------------------------------------
  // مؤقتاً: ما في UI تسجيل دخول حقيقي، فلحد ما تنبنى صفحة /admin/login
  // منسمح بلصق التوكن يدوياً هون (نفس التوكن الطالع من create_admin).
  // ------------------------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f2544] to-[#1e3a5f] p-4">
        <form
          onSubmit={handleSaveToken}
          className="w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-6"
        >
          <h1 className="text-white font-semibold text-lg mb-2">{t("admin.nav.title")}</h1>
          <p className="text-white/60 text-sm mb-4">{t("admin.auth.need_token")}</p>
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder={t("admin.auth.token_placeholder")}
            className="w-full rounded-xl bg-white/90 text-[#0f2544] px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#3b82f6] text-white text-sm font-medium hover:bg-[#3b82f6]/90 transition-colors"
          >
            {t("admin.auth.enter")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f2544] to-[#1e3a5f]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 min-h-screen border-e border-white/10 p-4 hidden md:flex md:flex-col">
          <h1 className="text-white font-semibold text-lg mb-6 px-2">
            {t("admin.nav.title")}
          </h1>
          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.map(({ to, key, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#3b82f6] text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                {t(`admin.nav.${key}`)}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            {t("admin.auth.logout")}
          </button>
        </aside>

        {/* Mobile top nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0f2544]/95 backdrop-blur-md border-t border-white/10 flex justify-around py-2">
          {NAV_ITEMS.map(({ to, key, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-1 text-xs ${
                  isActive ? "text-[#3b82f6]" : "text-white/60"
                }`
              }
            >
              <Icon size={20} />
              {t(`admin.nav.${key}`)}
            </NavLink>
          ))}
        </nav>

        {/* Content column */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top header */}
          <header className="flex items-center justify-between gap-4 px-4 md:px-8 py-4 border-b border-white/10">
            <h2 className="text-white/90 font-medium text-base md:text-lg">
              {t(`admin.nav.${currentSection}`)}
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                title={t("admin.auth.switch_language")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white/80 text-xs font-medium hover:bg-white/20 transition-colors"
              >
                <Languages size={16} />
                {i18n.language === "ar" ? "EN" : "AR"}
              </button>

              <button
                onClick={handleLogout}
                title={t("admin.auth.logout")}
                className="md:hidden p-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}