"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  FaClipboardList,
  FaSignInAlt,
  FaSignOutAlt,
  FaUser,
  FaFileContract,
  FaShoppingCart,
  FaTags,
  FaCrown,
  FaUserTie,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";

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

  const getRoleBorderColor = () => {
    if (!user || !user.role) return "border-gray-300";

    switch (user.role.toLowerCase()) {
      case "admin":
        return "border-red-500";
      case "manager":
        return "border-green-500";
      case "client":
        return "border-yellow-500";
      default:
        return "border-gray-300";
    }
  };

  const getRoleBgColor = () => {
    if (!user || !user.role) return "bg-gray-100";

    switch (user.role.toLowerCase()) {
      case "admin":
        return "bg-red-100";
      case "manager":
        return "bg-green-100";
      case "client":
        return "bg-yellow-100";
      default:
        return "bg-gray-100";
    }
  };

  const getRoleTextColor = () => {
    if (!user || !user.role) return "text-gray-800";

    switch (user.role.toLowerCase()) {
      case "admin":
        return "text-red-800";
      case "manager":
        return "text-green-800";
      case "client":
        return "text-yellow-800";
      default:
        return "text-gray-800";
    }
  };

  const getRoleIcon = () => {
    if (!user || !user.role) return <FaUserCircle className="w-5 h-5" />;

    switch (user.role.toLowerCase()) {
      case "admin":
        return <FaCrown className="w-5 h-5" />;
      case "manager":
        return <FaUserTie className="w-5 h-5" />;
      case "client":
        return <FaUserCircle className="w-5 h-5" />;
      default:
        return <FaUserCircle className="w-5 h-5" />;
    }
  };

  const getRoleIconColor = () => {
    if (!user || !user.role) return "text-gray-500";

    switch (user.role.toLowerCase()) {
      case "admin":
        return "text-red-600";
      case "manager":
        return "text-green-600";
      case "client":
        return "text-yellow-600";
      default:
        return "text-gray-500";
    }
  };

  const getRoleText = () => {
    if (!user || !user.role) return "Пользователь";

    switch (user.role.toLowerCase()) {
      case "admin":
        return "Администратор";
      case "manager":
        return "Менеджер";
      case "client":
        return "Клиент";
      default:
        return user.role;
    }
  };

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
  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") {
      return true;
    }
    if (href !== "/" && pathname.startsWith(href)) {
      return true;
    }

    return false;
  };
  const linkClass = (href: string) => {
    const active = isActive(href);
    return [
      "flex flex-col items-center justify-center md:flex-row md:items-center md:justify-start",
      "px-4 py-3 text-gray-600 transition",
      "hover:bg-gray-50 hover:text-gray-800",
      "min-w-[100px]",
      "border-b-4 md:border-b-0 md:border-l-4 border-transparent",
      active
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
        <FaClipboardList className="text-2xl text-gray-600 mr-3" />
        <h1 className="text-xl font-semibold text-gray-800">Личный кабинет</h1>
      </div>

      {user && (
        <div className="flex items-center px-6 py-6 border-b border-gray-200">
          <div className={`relative ${getRoleBorderColor()}`}>
            {/* Аватар с цветным ободком */}
            <div className="w-14 h-14 rounded-full bg-linear-to-br from-[#3E4F5F] to-[#2d3a47] flex items-center justify-center text-white text-lg font-medium relative">
              {user.name
                ? (user.name[0] + (user.name[1] || ""))?.toUpperCase() || "??"
                : "??"}

              {/* Иконка роли в правом нижнем углу */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className={getRoleIconColor()}>{getRoleIcon()}</div>
              </div>
            </div>

            {/* Цветной ободок */}
            <div
              className={`absolute inset-0 rounded-full border-2 ${getRoleBorderColor()}`}
            ></div>
          </div>

          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-800">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center mt-1">
              <span
                className={`text-xs px-2 py-1 rounded-full ${getRoleBgColor()} ${getRoleTextColor()}`}
              >
                {getRoleText()}
              </span>
            </div>
          </div>
        </div>
      )}

      <nav className="py-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible justify-around">
        <Link
          href={user ? `/personal-account/${user.id}` : "/auth"}
          className={linkClass("/personal-account")}
        >
          <FaUser className="w-6 mr-3" />
          <span>Профиль</span>
        </Link>
        <Link href="/contracts" className={linkClass("/contracts")}>
          <FaFileContract className="w-6 mr-3" />
          <span>Договора</span>
        </Link>
        <Link href="/my-orders" className={linkClass("/my-orders")}>
          <FaShoppingCart className="w-6 mr-3" />
          <span>Заказы</span>
        </Link>
        <Link href="/price" className={linkClass("/price")}>
          <FaTags className="w-6 mr-3" />
          <span>Прайс-лист</span>
        </Link>
        {user && user.role === "admin" && (
          <Link href="/users" className={linkClass("/users")}>
            <FaUsers className="w-6 mr-3" />
            <span>Клиеты</span>
          </Link>
        )}
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
