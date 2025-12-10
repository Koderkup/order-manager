import { FiLock } from "react-icons/fi";
import Link from "next/link";
export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-6xl font-bold mb-4">403</h1>
      <p className="text-xl mb-6">Доступ запрещён</p>
      <p className="text-md text-gray-500 dark:text-gray-400">
        У вас нет прав для просмотра этой страницы.
      </p>
      <Link
        href="/"
        className="mt-6 px-4 py-2 flex items-center gap-2 rounded 
                 bg-[#3E4F5F] text-white font-medium shadow-md 
                 hover:shadow-lg hover:bg-[#3E4F5F]/80 transition-colors"
      >
        <FiLock className="text-xl" />
        Вернуться на главную
      </Link>
    </div>
  );
}
