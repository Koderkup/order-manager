"use client";

import Link from "next/link";
import { FiHome } from "react-icons/fi";
import { FaUser, FaFileContract, FaShoppingCart, FaTags } from "react-icons/fa";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-6">
    
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
        Цифровая платформа «Молочник»{" "}
        <span className="text-[#3E4F5F]">v1.0</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 text-center max-w-2xl">
        Личный кабинет клиента для самостоятельного оформления заказа продукции
        компании по согласованным ценам (договорам и спецификациям).
      </p>

    
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
        <Link
          href="/personal-account"
          className="flex items-center gap-3 px-5 py-4 rounded-lg bg-[#3E4F5F] text-white font-medium shadow-md hover:shadow-lg hover:bg-[#3E4F5F]/80 transition-colors"
        >
          <FaUser className="text-xl" />
          Профиль
        </Link>
        <Link
          href="/contracts"
          className="flex items-center gap-3 px-5 py-4 rounded-lg bg-[#3E4F5F] text-white font-medium shadow-md hover:shadow-lg hover:bg-[#3E4F5F]/80 transition-colors"
        >
          <FaFileContract className="text-xl" />
          Договора
        </Link>
        <Link
          href="/my-orders"
          className="flex items-center gap-3 px-5 py-4 rounded-lg bg-[#3E4F5F] text-white font-medium shadow-md hover:shadow-lg hover:bg-[#3E4F5F]/80 transition-colors"
        >
          <FaShoppingCart className="text-xl" />
          Заказы
        </Link>
        <Link
          href="/price"
          className="flex items-center gap-3 px-5 py-4 rounded-lg bg-[#3E4F5F] text-white font-medium shadow-md hover:shadow-lg hover:bg-[#3E4F5F]/80 transition-colors"
        >
          <FaTags className="text-xl" />
          Прайс-лист
        </Link>
      </div>
    </div>
  );
}
