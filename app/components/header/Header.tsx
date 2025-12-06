"use client";
import  { useState } from "react";
import ThemeSwitch from "../ThemeSwitch";
import Link from "next/link";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-background text-foreground dark:bg-gray-900 dark:text-gray-100 shadow-md shadow-gray-300 dark:shadow-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Логотип + надпись */}
          <div className="flex items-center space-x-3">
            <Link href="/">
              <img src="/logo-192x192.png" alt="Logo" className="h-12 w-auto" />
            </Link>
            <p className="text-red-600 font-semibold italic">
              Партнерство с 1С
            </p>
          </div>

          {/* Десктоп меню */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/" className="text-foreground hover:text-red-500">
              Главная
            </Link>
            <Link
              href="/my-orders"
              className="text-foreground hover:text-red-500"
            >
              Мои заказы
            </Link>
            <Link
              href="/profile"
              className="text-foreground hover:text-red-500"
            >
              Профиль
            </Link>
            <Link href="/users" className="text-foreground hover:text-red-500">
              Клиенты
            </Link>
            <ThemeSwitch />
            {/* Кнопка Войти */}
            <Link
              href="/auth"
              className="px-4 py-2 rounded transition 
                         bg-[#F5F2DD] text-gray-800 font-medium 
                         shadow-md hover:shadow-lg hover:bg-[#e9e6cc]"
            >
              Войти
            </Link>
          </div>

          {/* Кнопка гамбургер */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 dark:text-white focus:outline-none transition-colors duration-300"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link href="/" className="block text-foreground hover:text-red-500">
            Главная
          </Link>
          <Link
            href="/my-orders"
            className="block text-foreground hover:text-red-500"
          >
            Мои заказы
          </Link>
          <Link
            href="/profile"
            className="block text-foreground hover:text-red-500"
          >
            Профиль
          </Link>
          <Link
            href="/users"
            className="block text-foreground hover:text-red-500"
          >
            Клиенты
          </Link>
          <ThemeSwitch />
          {/* Кнопка Войти в мобильном меню */}
          <Link
            href="/auth"
            className="block px-4 py-2 rounded text-center 
                       bg-[#F5F2DD] text-gray-800 font-medium 
                       shadow-md hover:shadow-lg hover:bg-[#e9e6cc]"
          >
            Войти
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
