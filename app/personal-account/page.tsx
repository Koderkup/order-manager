"use client";
import React from "react";
import { useUserStore } from "@/store/userStore";
import Sidebar from "../components/sidebar/Sidebar";

const PersonalAccountPage = () => {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-700">
        <p className="text-lg">
          Нет данных пользователя. Пожалуйста, авторизуйтесь.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 text-gray-800">
      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">
            Профиль компании
          </h2>
        </header>

        <section className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-xl font-medium text-gray-800">
              Данные компании
            </h3>
            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition">
              <i className="fas fa-save mr-2"></i> Сохранить изменения
            </button>
          </div>

          {/* Form */}
          <form className="space-y-6 max-w-2xl">
            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                Наименование компании
              </label>
              <input
                type="text"
                defaultValue={user.name ?? ""}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                Юридический адрес компании
              </label>
              <input
                type="text"
                defaultValue={user.legal_address ?? ""}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  ИНН
                </label>
                <input
                  type="text"
                  defaultValue={user.inn ?? ""}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  КПП
                </label>
                <input
                  type="text"
                  defaultValue={user.kpp ?? ""}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  Контактный телефон
                </label>
                <input
                  type="tel"
                  defaultValue="+7 (999) 123-45-67"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>
          </form>

          {/* Security section */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-medium text-gray-800 mb-4">
              Безопасность
            </h4>
            <div className="flex flex-col md:flex-row gap-4">
              <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition">
                <i className="fas fa-key mr-2"></i> Сменить пароль
              </button>
              <button className="px-4 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <i className="fas fa-history mr-2"></i> История входов
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PersonalAccountPage;
