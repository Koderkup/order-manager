"use client";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-background text-foreground dark:bg-gray-900 dark:text-gray-100 shadow-inner shadow-gray-200 dark:shadow-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        {/* Левая часть: копирайт */}
        <p className="text-sm">
          © {new Date().getFullYear()} Менеджер заказов. Все права защищены.
        </p>

        {/* Центральная часть: навигация */}
        <div className="flex space-x-6">
          <Link href="/" className="hover:text-red-500">
            Главная
          </Link>
          <Link href="/my-orders" className="hover:text-red-500">
            Мои заказы
          </Link>
          <Link href="/profile" className="hover:text-red-500">
            Профиль
          </Link>
          <Link href="/users" className="hover:text-red-500">
            Клиенты
          </Link>
        </div>

        {/* Правая часть: контакты */}
        <div className="flex space-x-4 text-sm">
          <Link href="/about" className="hover:text-red-500">
            О нас
          </Link>
          <Link href="/contacts" className="hover:text-red-500">
            Контакты
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
