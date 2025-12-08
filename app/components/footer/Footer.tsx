"use client";
import Link from "next/link";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer
      className={`bg-background text-foreground dark:bg-gray-900 dark:text-gray-100 shadow-inner shadow-gray-200 dark:shadow-gray-800 transition-colors duration-300 ${
        className ?? ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <p className="text-sm">
          © {new Date().getFullYear()} ЦПМ "Молочник версия 1.0" Все права
          защищены.
        </p>
        <div className="flex space-x-6">
          <Link href="/" className="hover:text-red-500">
            Главная
          </Link>
          <Link href="/personal-account" className="hover:text-red-500">
            Профиль
          </Link>
          <Link href="/contracts" className="hover:text-red-500">
            Договора
          </Link>
          <Link href="/my-orders" className="hover:text-red-500">
            Заказы
          </Link>
          <Link href="/price" className="hover:text-red-500">
            Прайс-лист
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
