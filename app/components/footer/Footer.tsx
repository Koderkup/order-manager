"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/userStore";
interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") {
      return true;
    }
    if (href !== "/" && pathname.startsWith(href)) {
      return true;
    }

    return false;
  };

  const linkClass = (href: string) => {
    const active = isActive(href);
    return [
      "px-2 py-1 transition hover:text-red-500",
      "border-b-2 border-transparent",
      active ? "border-b-[#5A6C7D] text-gray-800 font-medium" : "",
    ].join(" ");
  };

  return (
    <footer
      className={`bg-background text-foreground dark:bg-gray-900 dark:text-gray-100 shadow-inner shadow-gray-200 dark:shadow-gray-800 transition-colors duration-300 h-20 flex items-center ${
        className ?? ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-6">
          <Link href="/" className={linkClass("/")}>
            Главная
          </Link>
          <Link
            href={`/personal-account`}
            className={linkClass("/personal-account")}
          >
            Профиль
          </Link>
          <Link href="/contracts" className={linkClass("/contracts")}>
            Договора
          </Link>
          <Link href="/my-orders" className={linkClass("/my-orders")}>
            Заказы
          </Link>
          <Link href="/price" className={linkClass("/price")}>
            Прайс
          </Link>
        </div>

        <p className="text-sm text-center">
          ЦПМ "Молочник версия 1.0" © {new Date().getFullYear()} Все права
          защищены.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
