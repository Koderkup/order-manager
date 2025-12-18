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
  FaPhone,
  FaTimes,
  FaHistory,
  FaTrash,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { FaXTwitter, FaFacebook } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useToast } from "../ToastProvider";
interface RememberedCredentials {
  email: string;
  password: string;
  remember: boolean;
}
export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState({
    text: "",
    type: "",
  });
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    code: "",
    name: "",
    inn: "",
    kpp: "",
    legal_address: "",
    actual_address: "",
    phone: "",
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const STORAGE_KEY = "remembered_auth_credentials";
  const { notifyError } = useToast();
  const loadSavedCredentials = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData: RememberedCredentials = JSON.parse(savedData);
        if (parsedData.remember) {
          setFormData((prev) => ({
            ...prev,
            email: parsedData.email,
            password: parsedData.password,
          }));
          setRememberMe(true);
        }
      }
    } catch (error) {
      notifyError(`Ошибка при сохранении данных в localStorage:, ${error}`);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const saveCredentials = (
    email: string,
    password: string,
    remember: boolean
  ) => {
    try {
      if (remember) {
        const credentials: RememberedCredentials = {
          email,
          password,
          remember: true,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      notifyError(`Ошибка при сохранении данных в localStorage:, ${error}`);
    }
  };

  const clearSavedCredentials = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData((prev) => ({
      ...prev,
      email: "",
      password: "",
    }));
    setRememberMe(false);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    loadSavedCredentials();
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phone") {
      let formattedValue = value.replace(/\D/g, "");

      if (formattedValue.length > 0) {
        if (!formattedValue.startsWith("7")) {
          formattedValue = "7" + formattedValue;
        }

        let formattedPhone = "+7 ";

        if (formattedValue.length > 1) {
          const part1 = formattedValue.substring(1, 4);
          if (part1) formattedPhone += `(${part1}`;

          if (formattedValue.length > 4) {
            const part2 = formattedValue.substring(4, 7);
            if (part2) formattedPhone += `) ${part2}`;

            if (formattedValue.length > 7) {
              const part3 = formattedValue.substring(7, 9);
              if (part3) formattedPhone += `-${part3}`;

              if (formattedValue.length > 9) {
                const part4 = formattedValue.substring(9, 11);
                if (part4) formattedPhone += `-${part4}`;
              }
            }
          }
        }

        setFormData({ ...formData, [name]: formattedPhone });
      } else {
        setFormData({ ...formData, [name]: "" });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
            phone: formData.phone,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ text: "Регистрация успешна!", type: "success" });
          setIsRegister(false);
          setUser(data.user);
          setTimeout(() => {
            router.push(`/personal-account/${data.user.id}`);
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
          saveCredentials(formData.email, formData.password, rememberMe);
          setTimeout(() => {
            router.push(`/personal-account/${data.user.id}`);
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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage({ text: "", type: "" });
    setIsSendingReset(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setForgotPasswordMessage({
          text: "Инструкции по восстановлению пароля отправлены на ваш email!",
          type: "success",
        });
        setTimeout(() => {
          setShowForgotPasswordModal(false);
          setForgotPasswordEmail("");
          setForgotPasswordMessage({ text: "", type: "" });
        }, 2000);
      } else {
        setForgotPasswordMessage({
          text: data.error || "Произошла ошибка при отправке",
          type: "error",
        });
      }
    } catch (err: any) {
      setForgotPasswordMessage({
        text: "Ошибка: " + err.message,
        type: "error",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const buttonColor = "#3E4F5F";
  const buttonColorHover = "#2d3a47";

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-soft border border-gray-200 overflow-hidden">
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
            <div
              className={`${
                isMobile ? "w-full" : "lg:w-1/2"
              } p-8 md:p-10 lg:p-12`}
            >
              {!isMobile && (
                <>
                  <div className="flex items-center mb-8">
                    <FaLeaf
                      className="text-2xl"
                      style={{ color: buttonColor }}
                    />
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
                        Телефон
                      </label>
                      <div className="relative">
                        <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm md:text-base"
                          placeholder="+7 (999) 123-45-67"
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
                    <div className="flex items-center gap-2">
                      {rememberMe ? (
                        <button
                          type="button"
                          onClick={clearSavedCredentials}
                          className="flex items-center gap-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
                          title="Удалить сохранённые данные"
                        >
                          <FaTrash className="text-red-500" />
                          <span>Забыть меня</span>
                        </button>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded focus:ring-gray-500/20 border-gray-300"
                            style={{ accentColor: buttonColor }}
                          />
                          <label
                            htmlFor="remember"
                            className="text-gray-700 text-sm cursor-pointer flex items-center gap-1"
                          >
                            <FaHistory />
                            <span>Запомнить меня</span>
                          </label>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium hover:underline text-left sm:text-right"
                      style={{ color: buttonColor }}
                      onClick={() => setShowForgotPasswordModal(true)}
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

      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl shadow-soft border border-gray-200 w-full max-w-md overflow-hidden"
            style={{ maxWidth: "400px" }}
          >
            <div
              className="p-6 text-white flex justify-between items-center"
              style={{ backgroundColor: "#3E4F5F" }}
            >
              <h3 className="text-xl font-medium">Восстановление пароля</h3>
              <button
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setForgotPasswordEmail("");
                  setForgotPasswordMessage({ text: "", type: "" });
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                Введите email, на который была совершена регистрация. Мы
                отправим вам инструкции по восстановлению пароля.
              </p>

              {forgotPasswordMessage.text && (
                <div
                  className={`p-3 md:p-4 rounded-xl mb-6 flex items-center justify-center ${
                    forgotPasswordMessage.type === "success"
                      ? "bg-green-500 text-white"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  {forgotPasswordMessage.type === "success" && (
                    <FaCheckCircle className="mr-2" />
                  )}
                  <span className="font-medium text-sm md:text-base">
                    {forgotPasswordMessage.text}
                  </span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Электронная почта
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all text-sm md:text-base"
                      required
                      placeholder="ваш.email@пример.com"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setForgotPasswordEmail("");
                      setForgotPasswordMessage({ text: "", type: "" });
                    }}
                    className="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="flex-1 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
                    {isSendingReset ? (
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    ) : (
                      "Отправить"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
