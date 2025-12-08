"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // добавляем
import { useUserStore } from "@/store/userStore";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname(); // текущий путь
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth("/api/checkAuth", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.accessToken) {
            localStorage.setItem("access_token", data.accessToken);
          }
        } else {
          setUser(null);
          localStorage.removeItem("access_token");
        }
      } catch (err) {
        console.error("Ошибка авторизации:", err);
        setUser(null);
      }
    })();
  }, [setUser]);

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem("user-storage");
    localStorage.removeItem("access_token");
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Ошибка при удалении куки:", err);
    }
    window.location.href = "/";
  };

  // функция для активного класса
  const linkClass = (href: string) =>
    `flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-l-4 transition ${
      pathname === href
        ? "border-[#5A6C7D] font-medium text-gray-800"
        : "border-transparent"
    }`;

  return (
    <aside
      className={`w-full md:w-72 h-full md:h-screen bg-white border-b md:border-r border-gray-200 flex flex-col shadow-md ${
        className ?? ""
      }`}
    >
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-gray-200">
        <i className="fas fa-building text-2xl text-gray-600 mr-3"></i>
        <h1 className="text-xl font-semibold text-gray-800">Личный кабинет</h1>
      </div>

      {/* User profile */}
      {user && (
        <div className="flex items-center px-6 py-6 border-b border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-lg font-medium mr-4">
            {user.code ?? "??"}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
        <Link
          href="/personal-account"
          className={linkClass("/personal-account")}
        >
          <i className="fas fa-user w-6 mr-3"></i>
          <span>Профиль</span>
        </Link>
        <Link href="/contracts" className={linkClass("/contracts")}>
          <i className="fas fa-file-contract w-6 mr-3"></i>
          <span>Договора</span>
        </Link>
        <Link href="/my-orders" className={linkClass("/my-orders")}>
          <i className="fas fa-shopping-cart w-6 mr-3"></i>
          <span>Заказы</span>
        </Link>
        <Link href="/price" className={linkClass("/price")}>
          <i className="fas fa-tags w-6 mr-3"></i>
          <span>Прайс-лист</span>
        </Link>
      </nav>

      {/* Logout */}
      <div className="px-6 py-6 border-t border-gray-200">
        {user ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Выйти из аккаунта
          </button>
        ) : (
          <Link
            href="/auth"
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Войти
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
