"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { useToast } from "@/app/ToastProvider";
import { User, useUserStore } from "@/store/userStore";


interface Contract {
  id: number;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  amount: string;
  active: number;
}

const ContractsPage = () => {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const { notifyInfo, notifyError, notifySuccess } = useToast();


  const [formData, setFormData] = useState({
    code: "",
    name: "",
    start_date: "",
    end_date: "",
    amount: "",
    active: true,
  });


  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        
        const currentUser = useUserStore.getState().user;

        if (!currentUser) {
          router.push("/login");
          return;
        }

        if (currentUser.role !== "admin") {
          router.push(`/contracts/${currentUser.id}`);
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      }
    };

    checkAuthAndRole();
  }, [router, user]);


  const loadContracts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contracts`, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      } else {
        notifyError("Ошибка загрузки договоров");
      }
    } catch (error) {
      notifyError(`Ошибка сети: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCheckingAuth || !user || user.role !== "admin") {
      return;
    }
    loadContracts();
  }, [isCheckingAuth, user]);


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };


  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat("ru-RU").format(parseFloat(amount));
  };


  const getContractStatus = (contract: Contract) => {
    const now = new Date();
    const endDate = new Date(contract.end_date);
    const startDate = new Date(contract.start_date);

    if (contract.active === 0) {
      return { status: "inactive", text: "Не активен" };
    }

    if (now > endDate) {
      return { status: "expired", text: "Истек" };
    }

    if (now < startDate) {
      return { status: "pending", text: "Ожидает" };
    }

    return { status: "active", text: "Активен" };
  };


  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAddContract = () => {
    setEditingContract(null);
    setFormData({
      code: "",
      name: "",
      start_date: "",
      end_date: "",
      amount: "",
      active: true,
    });
    setShowForm(true);
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      code: contract.code,
      name: contract.name,
      start_date: contract.start_date.split("T")[0], 
      end_date: contract.end_date.split("T")[0],
      amount: contract.amount,
      active: contract.active === 1,
    });
    setShowForm(true);
  };

  const handleDeleteContract = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот договор?")) {
      return;
    }

    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        notifySuccess(data.message || "Договор успешно удален");
        loadContracts();
      } else {
        notifyError(data.error || "Ошибка удаления договора");
      }
    } catch (error) {
      notifyError("Ошибка сети при удалении договора");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = "/api/contracts";
      const method = editingContract ? "PUT" : "POST";
      const body = editingContract
        ? { id: editingContract.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        notifySuccess(data.message || "Договор успешно сохранен");
        setShowForm(false);
        setEditingContract(null);
        loadContracts();
      } else {
        notifyError(data.error || "Ошибка сохранения договора");
      }
    } catch (error) {
      notifyError("Ошибка сети при сохранении договора");
    }
  };


  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.id.toString().includes(searchTerm);

    const status = getContractStatus(contract);

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && status.status === "active") ||
      (filter === "inactive" &&
        (status.status === "inactive" || status.status === "expired"));

    return matchesSearch && matchesFilter;
  });


  const calculateTotalAmount = () => {
    return contracts.reduce((total, contract) => {
      return total + parseFloat(contract.amount);
    }, 0);
  };


  const countActiveContracts = () => {
    return contracts.filter((contract) => {
      const status = getContractStatus(contract);
      return status.status === "active";
    }).length;
  };

  const handleViewPricing = (contractId: number) => {
    notifyInfo(`Переход к прайс-листу договора №${contractId}`);
  };

  const handleViewDetails = (contractId: number) => {
    notifyInfo(`Просмотр договора №${contractId}`);
  };

  if (isCheckingAuth || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5a6c7d] mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isCheckingAuth ? "Проверка доступа..." : "Загрузка договоров..."}
          </p>
        </div>
      </div>
    );
  }


  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5a6c7d] mx-auto"></div>
          <p className="mt-4 text-gray-600">Перенаправление...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-medium text-gray-900">
                Договора компании
              </h1>
              <p className="text-gray-600 mt-2">
                Управление договорами и их статусами
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Администратор
                </span>
              </div>
            </div>
            <button
              onClick={handleAddContract}
              className="px-4 py-2 bg-[#5a6c7d] text-white rounded-lg hover:bg-[#4a5a6a] flex items-center gap-2 transition-colors"
            >
              <FaPlus />
              Добавить договор
            </button>
          </div>
        </div>

        {/* Модальное окно формы */}
        {showForm && (
          <div className="fixed inset-0 bg-white/84 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-medium text-gray-900">
                    {editingContract
                      ? "Редактирование договора"
                      : "Создание нового договора"}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Код договора *
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                        placeholder="C-001"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Сумма договора *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="amount"
                        value={formData.amount}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                        placeholder="100000.00"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Наименование договора *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                        placeholder="Договор на поставку оборудования"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дата начала *
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дата окончания *
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="active"
                        name="active"
                        checked={formData.active}
                        onChange={handleFormChange}
                        className="h-4 w-4 text-[#5a6c7d] border-gray-300 rounded focus:ring-[#5a6c7d]"
                      />
                      <label
                        htmlFor="active"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Активен
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#5a6c7d] text-white rounded-lg hover:bg-[#4a5a6a] font-medium transition-colors"
                    >
                      {editingContract ? "Сохранить" : "Создать"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Основная карточка */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Шапка с действиями */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-medium text-gray-900">
                Список договоров
              </h2>
              <div className="text-sm text-gray-600">
                Всего договоров:{" "}
                <span className="font-semibold">{contracts.length}</span>
              </div>
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
                    placeholder="Поиск по названию, коду или ID договора..."
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
                    <option value="inactive">Неактивные и истекшие</option>
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
                    Договор
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Период действия
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Сумма
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
                {filteredContracts.length > 0 ? (
                  filteredContracts.map((contract) => {
                    const status = getContractStatus(contract);
                    return (
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
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <span>Код: {contract.code}</span>
                                <span className="text-xs">•</span>
                                <span>ID: {contract.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-gray-400 mr-2 text-sm" />
                              <span className="text-gray-700 text-sm">
                                Начало: {formatDate(contract.start_date)}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-gray-400 mr-2 text-sm" />
                              <span className="text-gray-700 text-sm">
                                Окончание: {formatDate(contract.end_date)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <FaRubleSign className="text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {formatAmount(contract.amount)} ₽
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              status.status === "active"
                                ? "bg-green-100 text-green-800"
                                : status.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {status.status === "active" ? (
                              <FaCheckCircle className="mr-1.5" />
                            ) : (
                              <FaTimesCircle className="mr-1.5" />
                            )}
                            {status.text}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleEditContract(contract)}
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                            >
                              <FaEdit className="mr-1.5" />
                              Изменить
                            </button>

                            <button
                              onClick={() => handleDeleteContract(contract.id)}
                              className="text-red-600 hover:text-red-800 font-medium flex items-center"
                            >
                              <FaTrash className="mr-1.5" />
                              Удалить
                            </button>

                            <button
                              onClick={() => handleViewPricing(contract.id)}
                              className="text-[#5a6c7d] hover:text-[#4a5a6a] font-medium flex items-center"
                            >
                              <FaEye className="mr-1.5" />
                              Прайс-лист
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-6 text-center">
                      <div className="text-gray-500">
                        {contracts.length === 0
                          ? "Договоры не найдены"
                          : "По вашему запросу ничего не найдено"}
                      </div>
                    </td>
                  </tr>
                )}
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
                <button
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Назад
                </button>
                <span className="px-3 py-1 bg-[#5a6c7d] text-white rounded-lg">
                  1
                </span>
                <button
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100"
                  disabled={contracts.length <= 10}
                >
                  2
                </button>
                <button
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100"
                  disabled={contracts.length <= 10}
                >
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
                  {countActiveContracts()}
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
                  {formatAmount(calculateTotalAmount().toString())} ₽
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
