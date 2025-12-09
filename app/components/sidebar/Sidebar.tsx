"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { FaSignInAlt, FaSignOutAlt } from "react-icons/fa";

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname();
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

  const linkClass = (href: string) => {
    const isActive = pathname === href;
    return [
      "flex flex-col items-center justify-center md:flex-row md:items-center md:justify-start",
      "px-4 py-3 text-gray-600 transition",
      "hover:bg-gray-50 hover:text-gray-800",
      "min-w-[100px]",
      "border-b-4 md:border-b-0 md:border-l-4 border-transparent",
      isActive
        ? "border-b-[#3E4F5F] md:border-l-[#3E4F5F] bg-[#F8FAFC] md:bg-transparent"
        : "",
    ].join(" ");
  };

  return (
    <aside
      className={`w-full md:w-72 bg-white border-b md:border-r border-gray-200 flex flex-col shadow-md ${
        className ?? ""
      }`}
    >
      <div className="flex items-center px-6 py-6 border-b border-gray-200">
        <i className="fas fa-building text-2xl text-gray-600 mr-3"></i>
        <h1 className="text-xl font-semibold text-gray-800">Личный кабинет</h1>
      </div>

      {user && (
        <div className="flex items-center px-6 py-6 border-b border-gray-200">
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-[#3E4F5F] to-[#2d3a47] flex items-center justify-center text-white text-lg font-medium mr-4">
            {user.name
              ? (user.name[0] + (user.name[1] || ""))?.toUpperCase() || "??"
              : "??"}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      )}

      <nav className="py-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible justify-around">
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

      <div className="grow"></div>

      <div className="px-6 py-6 border-t border-gray-200 mt-auto">
        {user ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-white transition-all duration-300 hover:opacity-90"
            style={{
              backgroundColor: "#3E4F5F",
              boxShadow: "0 4px 12px rgba(62, 79, 95, 0.15)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#2d3a47";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#3E4F5F";
            }}
          >
            <FaSignOutAlt className="mr-3 transform rotate-180" />
            <span className="font-medium">Выйти из аккаунта</span>
          </button>
        ) : (
          <Link
            href="/auth"
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-white transition-all duration-300 hover:opacity-90"
            style={{
              backgroundColor: "#3E4F5F",
              boxShadow: "0 4px 12px rgba(62, 79, 95, 0.15)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#2d3a47";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#3E4F5F";
            }}
          >
            <FaSignInAlt className="mr-3" />
            <span className="font-medium">Войти</span>
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
