"use client";

import { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight,
  FaSearch,
  FaFilter,
  FaEye,
  FaUserTie,
  FaCrown,
  FaUserCircle,
  FaCalendarAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaTrash,
} from "react-icons/fa";
import { useToast } from "@/app/ToastProvider";
import ConfirmModal from "../components/ui/ConfirmModal";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "client" | "manager";
  inn: string;
  kpp: string;
  legal_address: string;
  actual_address: string;
  code: string;
  access: number;
  create_time: string;
  active: boolean;
  phone?: string;
}


type EditUserForm = {
  name: string;
  email: string;
  role: "admin" | "client" | "manager";
  inn: string;
  kpp: string;
  legal_address: string;
  actual_address: string;
  code: string;
  access: number;
  active: boolean;
  phone: string;
};

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { notifyInfo, notifyError, notifySuccess, notifyWarning } = useToast();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: number;
    active: boolean;
    name: string;
  } | null>(null);

 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<EditUserForm>({
    name: "",
    email: "",
    role: "client",
    inn: "",
    kpp: "",
    legal_address: "",
    actual_address: "",
    code: "",
    access: 0,
    active: true,
    phone: "",
  });
  const [editLoading, setEditLoading] = useState(false);


  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.warn("Некорректный формат данных:", data);
        setUsers([]);
      }

      setError(null);
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
      setError(
        "Не удалось загрузить пользователей. Проверьте подключение к сети."
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.inn.includes(searchTerm) ||
      user.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && user.active) ||
      (filter === "inactive" && !user.active) ||
      (filter === "admin" && user.role === "admin") ||
      (filter === "client" && user.role === "client") ||
      (filter === "manager" && user.role === "manager");

    return matchesSearch && matchesFilter;
  });

  const handleViewProfile = (userId: number) => {
    window.location.href = `/personal-account/${userId}`;
  };

  const openConfirmModal = (
    userId: number,
    currentActive: boolean,
    userName: string
  ) => {
    setSelectedUser({ id: userId, active: currentActive, name: userName });
    setModalOpen(true);
  };

  const handleToggleActive = async (userId: number, currentActive: boolean) => {
    if (!selectedUser) return;

    const prevUsers = [...users];

   
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, active: !currentActive } : user
      )
    );

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !currentActive }),
        credentials: "include",
      });

      if (res.ok) {
        notifySuccess(
          `Пользователь успешно ${
            currentActive ? "деактивирован" : "активирован"
          }`
        );
      } else {
     
        setUsers(prevUsers);
        notifyError("Ошибка при обновлении статуса пользователя");
      }
    } catch (error) {
      console.error("Ошибка обновления:", error);
      setUsers(prevUsers);
      notifyError("Произошла ошибка при обновлении статуса");
    } finally {
      setModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "client",
      inn: user.inn || "",
      kpp: user.kpp || "",
      legal_address: user.legal_address || "",
      actual_address: user.actual_address || "",
      code: user.code || "",
      access: user.access || 0,
      active: user.active,
      phone: user.phone || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setEditFormData((prev) => ({
        ...prev,
        [name]: checkbox.checked,
      }));
    } else if (name === "access") {
      setEditFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  
  const handleSaveUser = async () => {
    if (!editingUser) return;

    setEditLoading(true);

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();

        setUsers(
          users.map((user) =>
            user.id === editingUser.id ? { ...user, ...editFormData } : user
          )
        );

        notifySuccess(data.message || "Данные пользователя успешно обновлены");
        setIsEditModalOpen(false);
        setEditingUser(null);
      } else {
        const errorData = await res.json();
        notifyError(
          errorData.error || "Ошибка при обновлении данных пользователя"
        );
      }
    } catch (error) {
      console.error("Ошибка обновления:", error);
      notifyError("Произошла ошибка при обновлении данных");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };


  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);

    const prevUsers = [...users];

   
    setUsers(users.filter((user) => user.id !== userToDelete.id));

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        notifySuccess(data.message || "Пользователь успешно удален");
      } else {
        
        setUsers(prevUsers);
        const errorData = await res.json();
        notifyError(errorData.error || "Ошибка при удалении пользователя");
      }
    } catch (error) {
      console.error("Ошибка удаления:", error);
      setUsers(prevUsers);
      notifyError("Произошла ошибка при удалении пользователя");
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <FaCrown className="text-red-500" />;
      case "manager":
        return <FaUserTie className="text-green-500" />;
      case "client":
        return <FaUserCircle className="text-blue-500" />;
      default:
        return <FaUser className="text-gray-500" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "manager":
        return "Менеджер";
      case "client":
        return "Клиент";
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900">
            Управление пользователями
          </h1>
          <p className="text-gray-600 mt-2">
            Просмотр и управление учетными записями пользователей
          </p>
        </div>

        {/* Основная карточка */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Шапка с действиями */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-medium text-gray-900">
                Список пользователей
              </h2>
              <button
                className="px-4 py-2 bg-[#5a6c7d] text-white rounded-lg hover:bg-[#4a5a6a] transition-colors font-medium"
                onClick={() => {
               
                  notifyInfo("Функция создания нового пользователя");
                }}
              >
                + Добавить пользователя
              </button>
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
                    placeholder="Поиск по имени, email, ИНН или коду..."
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
                    <option value="all">Все пользователи</option>
                    <option value="active">Только активные</option>
                    <option value="inactive">Только неактивные</option>
                    <option value="admin">Только админы</option>
                    <option value="manager">Только менеджеры</option>
                    <option value="client">Только клиенты</option>
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

          {/* Таблица пользователей */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Контактная информация
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Регистрация
                  </th>
                  <th className="py-4 px-6 text-left text-gray-700 font-medium text-sm uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2 rounded-lg mr-3">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Код: {user.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <FaEnvelope className="text-gray-400 mr-2 text-sm" />
                          <span className="text-gray-700 text-sm">
                            {user.email}
                          </span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center">
                            <FaPhone className="text-gray-400 mr-2 text-sm" />
                            <span className="text-gray-700 text-sm">
                              {user.phone}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <FaIdCard className="text-gray-400 mr-2 text-sm" />
                          <span className="text-gray-700 text-sm">
                            ИНН: {user.inn}
                          </span>
                        </div>
                        {user.kpp && (
                          <div className="flex items-center">
                            <FaIdCard className="text-gray-400 mr-2 text-sm" />
                            <span className="text-gray-700 text-sm">
                              КПП: {user.kpp}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : user.role === "manager"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {getRoleIcon(user.role)}
                          <span className="ml-1.5">
                            {getRoleText(user.role)}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.active ? (
                            <FaCheckCircle className="mr-1.5" />
                          ) : (
                            <FaTimesCircle className="mr-1.5" />
                          )}
                          {user.active ? "Активен" : "Не активен"}
                        </span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.access === 1
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.access === 1 ? (
                            <FaCheckCircle className="mr-1.5" />
                          ) : (
                            <FaTimesCircle className="mr-1.5" />
                          )}
                          {user.access === 1
                            ? "Доступ разрешен"
                            : "Доступ ограничен"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-gray-400 mr-2" />
                        <span className="text-gray-700">
                          {formatDate(user.create_time)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleViewProfile(user.id)}
                          className="text-[#5a6c7d] hover:text-[#4a5a6a] font-medium flex items-center text-sm"
                        >
                          <FaEye className="mr-1.5" />
                          Профиль
                        </button>

                        <button
                          onClick={() =>
                            openConfirmModal(user.id, user.active, user.name)
                          }
                          className={`text-sm font-medium flex items-center ${
                            user.active
                              ? "text-red-600 hover:text-red-800"
                              : "text-green-600 hover:text-green-800"
                          }`}
                        >
                          {user.active ? (
                            <>
                              <FaTimesCircle className="mr-1.5" />
                              Деактивировать
                            </>
                          ) : (
                            <>
                              <FaCheckCircle className="mr-1.5" />
                              Активировать
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-gray-600 hover:text-gray-800 font-medium flex items-center text-sm"
                        >
                          <FaArrowRight className="mr-1.5" />
                          Редактировать
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800 font-medium flex items-center text-sm"
                        >
                          <FaTrash className="mr-1.5" />
                          Удалить
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
                Показано {filteredUsers.length} из {users.length} пользователей
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Всего пользователей</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {users.length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaUser className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Активные</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {users.filter((u) => u.active).length}
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
                <p className="text-gray-600 text-sm">Администраторы</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <FaCrown className="text-red-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Клиенты</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">
                  {users.filter((u) => u.role === "client").length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FaUserCircle className="text-purple-600 text-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения активации/деактивации */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => {
          if (selectedUser) {
            handleToggleActive(selectedUser.id, selectedUser.active);
          }
        }}
        message={
          selectedUser
            ? `Вы уверены, что хотите ${
                selectedUser.active ? "деактивировать" : "активировать"
              } пользователя "${selectedUser.name}"?`
            : ""
        }
        confirmText={selectedUser?.active ? "Деактивировать" : "Активировать"}
        confirmColor={selectedUser?.active ? "red" : "green"}
      />

      {/* Модальное окно подтверждения удаления */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        message={
          userToDelete
            ? `Вы уверены, что хотите удалить пользователя "${userToDelete.name}" (${userToDelete.email})? Это действие нельзя отменить.`
            : ""
        }
        confirmText="Удалить"
        confirmColor="red"
      />

      {/* Модальное окно редактирования пользователя */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Заголовок модального окна */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-medium text-gray-900">
                  Редактирование пользователя
                </h2>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>
              <p className="text-gray-600 mt-1">
                ID: {editingUser.id} • {editingUser.email}
              </p>
            </div>

            {/* Форма редактирования */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Основная информация */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaUser className="mr-2" />
                    Основная информация
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя пользователя
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                      placeholder="+7 (XXX) XXX-XX-XX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Роль
                    </label>
                    <select
                      name="role"
                      value={editFormData.role}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                    >
                      <option value="client">Клиент</option>
                      <option value="manager">Менеджер</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Код пользователя
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={editFormData.code}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Статус и доступ */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaCheckCircle className="mr-2" />
                    Статус и доступ
                  </h3>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="active"
                        checked={editFormData.active}
                        onChange={handleEditFormChange}
                        className="h-4 w-4 text-[#5a6c7d] focus:ring-[#5a6c7d] border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">Активен</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="access"
                        checked={editFormData.access === 1}
                        onChange={(e) => {
                          setEditFormData((prev) => ({
                            ...prev,
                            access: e.target.checked ? 1 : 0,
                          }));
                        }}
                        className="h-4 w-4 text-[#5a6c7d] focus:ring-[#5a6c7d] border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">
                        Доступ разрешен
                      </span>
                    </label>
                  </div>

                  {/* Реквизиты */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FaBuilding className="mr-2" />
                      Реквизиты компании
                    </h3>

                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ИНН
                        </label>
                        <input
                          type="text"
                          name="inn"
                          value={editFormData.inn}
                          onChange={handleEditFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          КПП
                        </label>
                        <input
                          type="text"
                          name="kpp"
                          value={editFormData.kpp}
                          onChange={handleEditFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Адреса */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaMapMarkerAlt className="mr-2" />
                    Адреса
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Юридический адрес
                      </label>
                      <input
                        type="text"
                        name="legal_address"
                        value={editFormData.legal_address}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Фактический адрес
                      </label>
                      <input
                        type="text"
                        name="actual_address"
                        value={editFormData.actual_address}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c7d] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Кнопки действий в форме редактирования */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                {/* Кнопка удаления в форме редактирования */}
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                    handleDeleteUser(editingUser);
                  }}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  disabled={editLoading}
                >
                  <FaTrash className="inline mr-2" />
                  Удалить пользователя
                </button>

                {/* Кнопки отмены и сохранения */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingUser(null);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={editLoading}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSaveUser}
                    disabled={editLoading}
                    className="px-4 py-2 bg-[#5a6c7d] text-white rounded-lg hover:bg-[#4a5a6a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Сохранение...
                      </span>
                    ) : (
                      "Сохранить изменения"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
