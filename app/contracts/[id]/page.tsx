"use client";

import { useState } from "react";
import {
  FaFileContract,
  FaCalendarAlt,
  FaRubleSign,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight,
  FaSearch,
  FaFilter,
  FaEye,
} from "react-icons/fa";
import { useToast } from "@/app/ToastProvider";
const ContractsPage = () => {
  const {notifyInfo} = useToast();
  const [contracts] = useState([
    {
      id: "12345",
      name: "Договор №12345 на поставку оборудования",
      date: "15.03.2023",
      amount: "500 000",
      status: "active",
      statusText: "Активен",
    },
    {
      id: "12344",
      name: "Договор №12344 на техническое обслуживание",
      date: "10.01.2023",
      amount: "150 000",
      status: "active",
      statusText: "Активен",
    },
    {
      id: "12340",
      name: "Договор №12340 на разработку ПО",
      date: "05.12.2022",
      amount: "1 000 000",
      status: "inactive",
      statusText: "Не активен",
    },
    {
      id: "12335",
      name: "Договор №12335 на консультационные услуги",
      date: "20.10.2022",
      amount: "300 000",
      status: "inactive",
      statusText: "Не активен",
    },
    {
      id: "12330",
      name: "Договор №12330 на поставку канцелярии",
      date: "05.09.2022",
      amount: "75 000",
      status: "active",
      statusText: "Активен",
    },
    {
      id: "12325",
      name: "Договор №12325 на аренду оборудования",
      date: "15.08.2022",
      amount: "250 000",
      status: "active",
      statusText: "Активен",
    },
  ]);

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.id.includes(searchTerm);
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && contract.status === "active") ||
      (filter === "inactive" && contract.status === "inactive");
    return matchesSearch && matchesFilter;
  });

  const handleViewPricing = (contractId: string) => {
    notifyInfo(`Переход к прайс-листу договора №${contractId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900">
            Договора компании
          </h1>
          <p className="text-gray-600 mt-2">
            Управление договорами и их статусами
          </p>
        </div>

        {/* Основная карточка */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Шапка с действиями */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-medium text-gray-900">
                Список договоров
              </h2>
            </div>
          </div>

          {/* Панель поиска и фильтров */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Поиск */}
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по названию или номеру договора..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Фильтры */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent bg-white"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Все договора</option>
                    <option value="active">Только активные</option>
                    <option value="inactive">Только неактивные</option>
                  </select>
                </div>

                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setSearchTerm("");
                    setFilter("all");
                  }}
                >
                  Сбросить
                </button>
              </div>
            </div>
          </div>

          {/* Таблица договоров */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Наименование договора
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Дата заключения
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Максимальная сумма
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2 rounded-lg mr-3">
                          <FaFileContract className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {contract.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            №{contract.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-gray-400 mr-2" />
                        <span className="text-gray-700">{contract.date}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <FaRubleSign className="text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {contract.amount} ₽
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          contract.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {contract.status === "active" ? (
                          <FaCheckCircle className="mr-1.5" />
                        ) : (
                          <FaTimesCircle className="mr-1.5" />
                        )}
                        {contract.statusText}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewPricing(contract.id)}
                          className="text-[#5a6c7d] hover:text-[#4a5a6a] font-medium flex items-center"
                        >
                          <FaEye className="mr-1.5" />
                          Перейти к прайсу
                        </button>

                        <button
                          onClick={() =>
                            notifyInfo(`Просмотр договора №${contract.id}`)
                          }
                          className="text-gray-600 hover:text-gray-800 font-medium flex items-center"
                        >
                          <FaArrowRight className="mr-1.5" />
                          Подробнее
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Статистика и пагинация */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-600 text-sm mb-4 md:mb-0">
                Показано {filteredContracts.length} из {contracts.length}{" "}
                договоров
              </div>

              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                  Назад
                </button>
                <span className="px-3 py-1 bg-[#5a6c7d] text-white rounded-lg">
                  1
                </span>
                <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100">
                  2
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100">
                  Вперед
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Всего договоров</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {contracts.length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaFileContract className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Активные договоры</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {contracts.filter((c) => c.status === "active").length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FaCheckCircle className="text-green-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Общая сумма</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {contracts
                    .reduce(
                      (sum, c) => sum + parseInt(c.amount.replace(/\s/g, "")),
                      0
                    )
                    .toLocaleString("ru-RU")}{" "}
                  ₽
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FaRubleSign className="text-purple-600 text-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
