"use client";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const [formData, setFormData] = useState({
    name: "",
    sirname: "",
    inn: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      if (isRegister) {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            sirname: formData.sirname,
            email: formData.email,
            password: formData.password,
            inn: formData.inn,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage("Регистрация успешна!");
          setIsRegister(false);
          setUser(data.user);
          router.push("/profile");
        } else {
          setMessage(data.error || "Ошибка регистрации");
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
          setMessage("Авторизация успешна!");
          setUser(data.user);
          router.push("/profile");
       
        } else {
          setMessage(data.error || "Ошибка авторизации");
        }
      }
    } catch (err: any) {
      setMessage("Ошибка: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="w-full max-w-md bg-background text-foreground shadow-lg rounded-lg p-6 border border-gray-300 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {isRegister ? "Регистрация" : "Авторизация"}
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div>
                <label className="block mb-1">Имя</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-background text-foreground focus:outline-none focus:ring focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Фамилия</label>
                <input
                  type="text"
                  name="sirname"
                  value={formData.sirname}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-background text-foreground focus:outline-none focus:ring focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">ИНН</label>
                <input
                  type="number"
                  name="inn"
                  value={formData.inn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-background text-foreground focus:outline-none focus:ring focus:border-blue-500"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-background text-foreground focus:outline-none focus:ring focus:border-blue-500"
              required
            />
          </div>

          <div className="relative">
            <label className="block mb-1">Пароль</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-background text-foreground focus:outline-none focus:ring focus:border-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-500 dark:text-gray-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Кнопка Войти / Зарегистрироваться */}
          <button
            type="submit"
            className="w-full py-2 rounded font-medium 
             bg-yellow-300 text-gray-800 
             shadow-md hover:shadow-lg 
             hover:bg-yellow-400 transition"
          >
            {isRegister ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-red-500">{message}</p>
        )}

        <p className="mt-4 text-center text-sm">
          {isRegister ? (
            <>
              Уже есть аккаунт?{" "}
              <button
                onClick={() => setIsRegister(false)}
                className="text-blue-600 hover:underline"
              >
                Войти
              </button>
            </>
          ) : (
            <>
              Нет аккаунта?{" "}
              <button
                onClick={() => setIsRegister(true)}
                className="text-blue-600 hover:underline"
              >
                Зарегистрироваться
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
