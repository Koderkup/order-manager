"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    if (!token) {
      setMessage({
        text: "Токен не предоставлен",
        type: "error",
      });
      setIsValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/reset-password?token=${token}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        setTokenValid(true);
        setEmail(data.email);
      } else {
        setMessage({
          text: data.error || "Неверный или просроченный токен",
          type: "error",
        });
      }
    } catch (err) {
      setMessage({
        text: "Ошибка проверки токена",
        type: "error",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (password !== confirmPassword) {
      setMessage({
        text: "Пароли не совпадают",
        type: "error",
      });
      return;
    }

    if (password.length < 6) {
      setMessage({
        text: "Пароль должен содержать минимум 6 символов",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: "Пароль успешно изменен! Перенаправляем на страницу входа...",
          type: "success",
        });

        setTimeout(() => {
          router.push("/auth");
        }, 2000);
      } else {
        setMessage({
          text: data.error || "Ошибка изменения пароля",
          type: "error",
        });
      }
    } catch (err: any) {
      setMessage({
        text: "Ошибка: " + err.message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonColor = "#3E4F5F";
  const buttonColorHover = "#2d3a47";

  if (isValidating) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка токена...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-soft border border-gray-200 overflow-hidden">
        <div
          className="p-6 text-white text-center"
          style={{ backgroundColor: "#3E4F5F" }}
        >
          <h1 className="text-2xl font-medium">Восстановление пароля</h1>
          <p className="text-gray-100 mt-2 text-sm">
            {tokenValid
              ? `Для аккаунта: ${email}`
              : "Ссылка для восстановления недействительна"}
          </p>
        </div>

        <div className="p-6 md:p-8">
          {message.text && (
            <div
              className={`p-4 rounded-xl mb-6 flex items-center ${
                message.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <FaCheckCircle className="mr-3 shrink-0" />
              ) : (
                <FaTimes className="mr-3 shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          {tokenValid ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Новый пароль
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm"
                    required
                    minLength={6}
                    placeholder="Введите новый пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm"
                    required
                    minLength={6}
                    placeholder="Повторите пароль"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: buttonColor,
                  boxShadow: "0 5px 15px rgba(62, 79, 95, 0.15)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = buttonColorHover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = buttonColor;
                }}
              >
                {isLoading ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                ) : (
                  "Изменить пароль"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/auth")}
                  className="text-sm text-gray-600 hover:underline"
                  style={{ color: buttonColor }}
                >
                  Вернуться к входу
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Ссылка для восстановления пароля недействительна или устарела.
              </p>
              <button
                onClick={() => router.push("/auth")}
                className="py-3 px-6 rounded-xl font-medium transition-all duration-300 border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Вернуться к входу
              </button>
              <div className="mt-4">
                <button
                  onClick={() => router.push("/auth?forgot=true")}
                  className="text-sm hover:underline"
                  style={{ color: buttonColor }}
                >
                  Запросить новую ссылку
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка страницы...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
