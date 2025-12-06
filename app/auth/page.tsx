"use client";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="w-full max-w-md bg-background text-foreground shadow-lg rounded-lg p-6 border border-gray-300 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {isRegister ? "Регистрация" : "Авторизация"}
        </h1>

        <form className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block mb-1">Имя</label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-background text-foreground focus:outline-none focus:ring focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Фамилия</label>
                <input
                  type="text"
                  name="sirname"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-background text-foreground focus:outline-none focus:ring focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">ИНН</label>
                <input
                  type="number"
                  name="inn"
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
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-background text-foreground focus:outline-none focus:ring focus:border-blue-500"
              required
            />
          </div>

          <div className="relative">
            <label className="block mb-1">Пароль</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
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
