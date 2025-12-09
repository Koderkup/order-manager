"use client";

import { useState, useEffect } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaLeaf,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaSyncAlt,
  FaChartLine,
  FaHeadset,
  FaCheckCircle,
  FaSignInAlt,
  FaUserPlus,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { FaXTwitter, FaFacebook } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    code: "",
    name: "",
    inn: "",
    kpp: "",
    legal_address: "",
    actual_address: "",
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setIsLoading(true);

    try {
      if (isRegister) {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            code: formData.code,
            name: formData.name,
            inn: formData.inn,
            kpp: formData.kpp,
            legal_address: formData.legal_address,
            actual_address: formData.actual_address,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ text: "Регистрация успешна!", type: "success" });
          setIsRegister(false);
          setUser(data.user);
          setTimeout(() => {
            router.push("/personal-account");
          }, 1500);
        } else {
          setMessage({
            text: data.error || "Ошибка регистрации",
            type: "error",
          });
        }
      } else {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ text: "Авторизация успешна!", type: "success" });
          setUser(data.user);
          setTimeout(() => {
            router.push("/personal-account");
          }, 1500);
        } else {
          setMessage({
            text: data.error || "Ошибка авторизации",
            type: "error",
          });
        }
      }
    } catch (err: any) {
      setMessage({ text: "Ошибка: " + err.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonColor = "#3E4F5F";
  const buttonColorHover = "#2d3a47";

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-soft border border-gray-200 overflow-hidden">
        {/* Для мобильных: блок приветствия сверху ВСЕГДА (и для входа, и для регистрации) */}
        {isMobile && (
          <div
            className="p-8 text-white"
            style={{ backgroundColor: "#3E4F5F" }}
          >
            <h2 className="text-2xl font-medium mb-4">
              {isRegister ? "Добро пожаловать!" : "С возвращением!"}
            </h2>
            <p className="text-gray-100 mb-6 text-sm leading-relaxed">
              {isRegister
                ? "Создайте учетную запись и получите доступ ко всем функциям нашей платформы. Мы гарантируем безопасность ваших данных и круглосуточную поддержку."
                : "Мы рады снова видеть вас. Получите доступ ко всем функциям вашего аккаунта и продолжайте с того места, где остановились."}
            </p>

            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center mr-3 p-1 shrink-0">
                  <FaShieldAlt className="text-white text-xs" />
                </div>
                <span className="text-sm">
                  Безопасность данных гарантирована
                </span>
              </li>
              <li className="flex items-start">
                <div className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center mr-3 p-1 shrink-0">
                  <FaSyncAlt className="text-white text-xs" />
                </div>
                <span className="text-sm">
                  Синхронизация на всех устройствах
                </span>
              </li>
              <li className="flex items-start">
                <div className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center mr-3 p-1 shrink-0">
                  <FaChartLine className="text-white text-xs" />
                </div>
                <span className="text-sm">Аналитика и персонализация</span>
              </li>
              <li className="flex items-start">
                <div className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center mr-3 p-1 shrink-0">
                  <FaHeadset className="text-white text-xs" />
                </div>
                <span className="text-sm">Поддержка клиентов 24/7</span>
              </li>
            </ul>
          </div>
        )}

        <div className={`flex ${isMobile ? "flex-col" : "flex-row"}`}>
          {/* Левая часть - Форма */}
          <div
            className={`${
              isMobile ? "w-full" : "lg:w-1/2"
            } p-8 md:p-10 lg:p-12`}
          >
            {!isMobile && (
              <>
                {/* Логотип (только на десктопе, на мобильном скрыт) */}
                <div className="flex items-center mb-8">
                  <FaLeaf className="text-2xl" style={{ color: buttonColor }} />
                  <h1 className="text-2xl font-semibold text-gray-900 ml-3">
                    Приложение
                  </h1>
                </div>

                <h2 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">
                  {isRegister ? "Регистрация" : "Вход в систему"}
                </h2>
                <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
                  {isRegister
                    ? "Заполните форму для создания учетной записи"
                    : "Пожалуйста, введите свои учетные данные для доступа к вашему аккаунту"}
                </p>
              </>
            )}

            {/* На мобильном заголовок и описание компактнее */}
            {isMobile && (
              <>
                <h2 className="text-2xl font-medium text-gray-900 mb-2">
                  {isRegister ? "Регистрация" : "Вход в систему"}
                </h2>
                <p className="text-gray-600 mb-6 text-sm">
                  {isRegister
                    ? "Заполните форму для создания учетной записи"
                    : "Пожалуйста, введите свои учетные данные"}
                </p>
              </>
            )}

            {/* Сообщение об успехе/ошибке */}
            {message.text && (
              <div
                className={`p-3 md:p-4 rounded-xl mb-6 flex items-center justify-center ${
                  message.type === "success"
                    ? "bg-green-500 text-white"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {message.type === "success" && (
                  <FaCheckCircle className="mr-2" />
                )}
                <span className="font-medium text-sm md:text-base">
                  {message.text}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {isRegister && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-sm">
                        Код
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm md:text-base"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-sm">
                        Наименование
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm md:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-sm">
                        ИНН
                      </label>
                      <input
                        type="text"
                        name="inn"
                        value={formData.inn}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm md:text-base"
                        required
                        maxLength={12}
                        pattern="\d{10,12}"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-sm">
                        КПП
                      </label>
                      <input
                        type="text"
                        name="kpp"
                        value={formData.kpp}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm md:text-base"
                        maxLength={9}
                        pattern="\d{9}"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      Юридический адрес
                    </label>
                    <input
                      type="text"
                      name="legal_address"
                      value={formData.legal_address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm md:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">
                      Фактический адрес
                    </label>
                    <input
                      type="text"
                      name="actual_address"
                      value={formData.actual_address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm md:text-base"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Электронная почта
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm md:text-base"
                    required
                    placeholder="ваш.email@пример.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Пароль
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm md:text-base"
                    required
                    minLength={6}
                    placeholder="Введите ваш пароль"
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

              {!isRegister && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 rounded focus:ring-gray-500/20 border-gray-300"
                      style={{ accentColor: buttonColor }}
                    />
                    <label
                      htmlFor="remember"
                      className="ml-2 text-gray-700 text-sm"
                    >
                      Запомнить меня
                    </label>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium hover:underline text-left sm:text-right"
                    style={{ color: buttonColor }}
                  >
                    Забыли пароль?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white py-3 md:py-4 px-6 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 text-sm md:text-base"
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
                ) : isRegister ? (
                  <>
                    <FaUserPlus />
                    Зарегистрироваться
                  </>
                ) : (
                  <>
                    <FaSignInAlt />
                    Войти
                  </>
                )}
              </button>
            </form>

            {/* Социальные кнопки - показываем всегда, но только на странице входа */}
            {!isRegister && (
              <>
                <div className="relative my-6 md:my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">
                      или войти через
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-3 md:gap-4 mb-6 md:mb-8">
                  <button
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:-translate-y-1 transition-transform duration-300 opacity-90 hover:opacity-100"
                    title="Войти через Facebook"
                  >
                    <FaFacebook className="text-sm md:text-base" />
                  </button>
                  <button
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-300 bg-white text-gray-700 flex items-center justify-center hover:-translate-y-1 transition-transform duration-300"
                    title="Войти через Google"
                  >
                    <FcGoogle className="text-lg md:text-xl" />
                  </button>
                  <button
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black text-white flex items-center justify-center hover:-translate-y-1 transition-transform duration-300 opacity-90 hover:opacity-100"
                    title="Войти через X (Twitter)"
                  >
                    <FaXTwitter className="text-sm md:text-base" />
                  </button>
                </div>
              </>
            )}

            <div className="text-center text-gray-600 text-sm md:text-base mt-6">
              {isRegister ? (
                <>
                  Уже есть аккаунт?{" "}
                  <button
                    onClick={() => setIsRegister(false)}
                    className="font-medium hover:underline"
                    style={{ color: buttonColor }}
                  >
                    Войти
                  </button>
                </>
              ) : (
                <>
                  Нет учетной записи?{" "}
                  <button
                    onClick={() => setIsRegister(true)}
                    className="font-medium hover:underline"
                    style={{ color: buttonColor }}
                  >
                    Зарегистрируйтесь
                  </button>
                </>
              )}
            </div>
          </div>

          {!isMobile && (
            <div
              className="lg:w-1/2 p-8 md:p-10 lg:p-12 flex flex-col justify-center text-white"
              style={{ backgroundColor: "#3E4F5F" }}
            >
              <h2 className="text-2xl md:text-3xl font-medium mb-4 md:mb-6">
                {isRegister ? "Добро пожаловать!" : "С возвращением!"}
              </h2>
              <p className="text-gray-100 mb-6 md:mb-10 text-sm md:text-base leading-relaxed">
                {isRegister
                  ? "Создайте учетную запись и получите доступ ко всем функциям нашей платформы. Мы гарантируем безопасность ваших данных и круглосуточную поддержку."
                  : "Мы рады снова видеть вас. Получите доступ ко всем функциям вашего аккаунта и продолжайте с того места, где остановились."}
              </p>

              <ul className="space-y-4 md:space-y-6">
                <li className="flex items-start">
                  <div className="bg-white/20 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mr-3 p-1 md:p-1.5 shrink-0">
                    <FaShieldAlt className="text-white text-xs md:text-sm" />
                  </div>
                  <span className="text-sm md:text-base">
                    Безопасность данных гарантирована
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-white/20 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mr-3 p-1 md:p-1.5 shrink-0">
                    <FaSyncAlt className="text-white text-xs md:text-sm" />
                  </div>
                  <span className="text-sm md:text-base">
                    Синхронизация на всех устройствах
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-white/20 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mr-3 p-1 md:p-1.5 shrink-0">
                    <FaChartLine className="text-white text-xs md:text-sm" />
                  </div>
                  <span className="text-sm md:text-base">
                    Аналитика и персонализация
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-white/20 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center mr-3 p-1 md:p-1.5 shrink-0">
                    <FaHeadset className="text-white text-xs md:text-sm" />
                  </div>
                  <span className="text-sm md:text-base">
                    Поддержка клиентов 24/7
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
