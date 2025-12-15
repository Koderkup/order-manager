"use client";

import { useEffect, useState, useRef } from "react";
import { useUserStore } from "@/store/userStore";
import { usePathname, useRouter } from "next/navigation";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isChecking, setIsChecking] = useState(true);
  const { user, setUser } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    
    if (hasChecked.current || pathname === "/login") {
      setIsChecking(false);
      return;
    }

    const checkAuth = async () => {
      try {
        console.log("AuthProvider: Начинаю проверку авторизации...");

        const res = await fetch("/api/checkAuth", {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        console.log("AuthProvider: Ответ от /api/checkAuth:", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("AuthProvider: Пользователь получен:", data.user?.email);

          setUser(data.user);
          hasChecked.current = true;

        } else {
 
          console.log("AuthProvider: Пользователь не авторизован");
          setUser(null);

          if (!pathname.startsWith("/login") && pathname !== "/") {
            console.log("AuthProvider: Редирект на логин");
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("AuthProvider: Ошибка проверки авторизации:", error);
        setUser(null);

        if (!pathname.startsWith("/login") && pathname !== "/") {
          router.push("/login");
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();

    return () => {
      hasChecked.current = true;
    };
  }, [pathname, router, setUser]);


  if (isChecking && !pathname.startsWith("/login") && pathname !== "/") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5a6c7d] mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
