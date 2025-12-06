"use client";

import { useUserStore } from "@/store/userStore";

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-6 bg-white border border-gray-300 shadow-sm">
          <p className="text-gray-700">Пользователь не авторизован</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white border border-gray-300 shadow-sm">
        <div className="bg-yellow-200 border-b border-gray-300 px-4 py-2">
          <h1 className="text-lg font-semibold text-gray-800">
            Личная информация
          </h1>
        </div>

        <div className="p-6">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="w-1/3 font-medium text-gray-700 py-2">Имя</td>
                <td className="py-2">{user.name}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="font-medium text-gray-700 py-2">Фамилия</td>
                <td className="py-2">{user.sirname}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="font-medium text-gray-700 py-2">Email</td>
                <td className="py-2">{user.email}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="font-medium text-gray-700 py-2">ИНН</td>
                <td className="py-2">{user.inn}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="font-medium text-gray-700 py-2">Роль</td>
                <td className="py-2">{user.role}</td>
              </tr>    
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 flex justify-end">
          <button className="px-4 py-1 bg-yellow-300 border border-gray-400 text-gray-800 hover:bg-yellow-400">
            Редактировать
          </button>
        </div>
      </div>
    </div>
  );
}
