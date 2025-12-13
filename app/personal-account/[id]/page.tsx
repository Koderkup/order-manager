"use client";
import { useEffect, useState, useRef } from "react";
import { User, useUserStore } from "@/store/userStore";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/app/ToastProvider";
import { FaKey, FaHistory, FaSave, FaEdit, FaTrash } from "react-icons/fa";
import ConfirmModal from "../../components/ui/ConfirmModal";

interface LoginHistory {
  id: string;
  timestamp: string;
  device?: string;
}

const ChangePasswordModal = ({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Новые пароли не совпадают");
      return;
    }

    if (newPassword.length < 6) {
      setError("Новый пароль должен содержать минимум 6 символов");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка при смене пароля");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-6">Смена пароля</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Текущий пароль
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Новый пароль
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Подтвердите новый пароль
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Смена..." : "Сменить пароль"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LoginHistoryModal = ({
  isOpen,
  onClose,
  history,
}: {
  isOpen: boolean;
  onClose: () => void;
  history: LoginHistory[];
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">История входов</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>
        {history.length === 0 ? (
          <p className="text-gray-500">История входов пуста</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {new Date(item.timestamp).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {item.device && (
                    <span className="text-sm text-gray-500">{item.device}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PersonalAccountPage = () => {
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const params = useParams();
  const router = useRouter();
  const { notifyInfo, notifySuccess, notifyError } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const openDeleteConfirm = () => {
    setShowDeleteConfirm(true);
  };

    const handleDeleteAccount = async () => {
      if (!params?.id) return;

      try {
        const res = await fetch(`/api/personal-account/${params.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Ошибка удаления аккаунта");
        }

        if (data.success) {
          notifySuccess("Аккаунт успешно удален");
          router.push("/login");
        }
      } catch (err: any) {
        console.error("Ошибка удаления аккаунта:", err);
        notifyError(err.message || "Ошибка при удалении аккаунта");
      }
    };

  const saveLoginHistory = (userId: string) => {
    const historyKey = `login_history_${userId}`;
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      device: navigator.userAgent,
    };

    const existingHistory = JSON.parse(
      localStorage.getItem(historyKey) || "[]"
    );
    const updatedHistory = [newEntry, ...existingHistory.slice(0, 9)]; // Храним последние 10 записей
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    return updatedHistory;
  };

  const loadLoginHistory = (userId: string) => {
    const historyKey = `login_history_${userId}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    setLoginHistory(history);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!params?.id) {
          console.warn("Нет id в параметрах");
          return;
        }

        const userId = String(params.id);

        if (user && userId === String(user.id)) {
          setCurrentUser(user);
          setEditedUser({ ...user });
          loadLoginHistory(userId);
          return;
        }

        const res = await fetch(`/api/personal-account/${userId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          notifyError(`Ошибка запроса: ${res.status}`);
          return;
        }

        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          setEditedUser({ ...data.user });
          loadLoginHistory(userId);

          saveLoginHistory(userId);
        } else {
          notifyError(data.error || "Ошибка загрузки данных");
        }
      } catch (err) {
        console.error("Ошибка загрузки пользователя:", err);
        notifyError("Ошибка подключения к серверу");
      }
    };

    fetchUser();
  }, [params?.id, user, notifyError]);

  const handleInputChange = (field: keyof User, value: string) => {
    setEditedUser((prev) => ({ ...prev, [field]: value }));
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!currentUser || !params?.id) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/personal-account/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editedUser),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка сохранения");
      }

      if (data.success) {
        setCurrentUser(data.user);
        updateUser(data.user);
        setIsEditing(false);
        notifySuccess("Изменения успешно сохранены");
      }
    } catch (err: any) {
      console.error("Ошибка сохранения:", err);
      notifyError(err.message || "Ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!params?.id) return;

    try {
      const res = await fetch(`/api/personal-account/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка смены пароля");
      }

      if (data.success) {
        notifySuccess("Пароль успешно изменен");
      }
    } catch (err: any) {
      console.error("Ошибка смены пароля:", err);
      throw err;
    }
  };

  /*const handleDeleteAccount = async () => {
    if (
      !params?.id ||
      !window.confirm(
        "Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/personal-account/${params.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка удаления аккаунта");
      }

      if (data.success) {
        notifySuccess("Аккаунт успешно удален");
        router.push("/login");
      }
    } catch (err: any) {
      console.error("Ошибка удаления аккаунта:", err);
      notifyError(err.message || "Ошибка при удалении аккаунта");
    }
  };
*/
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-700">
        <p className="text-lg">Загрузка данных пользователя...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 text-gray-800">
      {/* Модальные окна */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        message="Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить."
        confirmText="Удалить аккаунт"
        cancelText="Отмена"
        confirmColor="red"
      />
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
      />
      <LoginHistoryModal
        isOpen={showLoginHistory}
        onClose={() => setShowLoginHistory(false)}
        history={loginHistory}
      />

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
            <div className="flex gap-2">
              <button
                onClick={openDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                title="Удалить аккаунт"
              >
                <FaTrash /> Удалить аккаунт
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={!isEditing || isSaving}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isEditing
                    ? "bg-[#3E4F5F]/60 text-white hover:bg-[#2d3a47]/40"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <FaSave /> {isSaving ? "Сохранение..." : "Сохранить изменения"}
              </button>
            </div>
          </div>

          {/* Form */}
          <form ref={formRef} className="space-y-6 max-w-2xl">
            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                Наименование компании
              </label>
              <input
                type="text"
                value={editedUser.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:#D3D3D3"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                Юридический адрес компании
              </label>
              <input
                type="text"
                value={editedUser.legal_address || ""}
                onChange={(e) =>
                  handleInputChange("legal_address", e.target.value)
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:#D3D3D3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  ИНН
                </label>
                <input
                  type="text"
                  value={editedUser.inn || ""}
                  maxLength={12}
                  onChange={(e) => handleInputChange("inn", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:#D3D3D3"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  КПП
                </label>
                <input
                  type="text"
                  value={editedUser.kpp || ""}
                  maxLength={9}
                  onChange={(e) => handleInputChange("kpp", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:#D3D3D3"
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
                  value={editedUser.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:#D3D3D3"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  Контактный телефон
                </label>
                <input
                  type="tel"
                  value={editedUser.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:#D3D3D3"
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
              <button
                onClick={() => setShowChangePassword(true)}
                className="px-4 py-2 text-white rounded-lg bg-[#D3D3D3] hover:bg-[#2d3a47]/30 transition flex items-center justify-center gap-2"
              >
                <FaKey className="text-lg" /> Сменить пароль
              </button>
              <button
                onClick={() => setShowLoginHistory(true)}
                className="px-4 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                <FaHistory className="text-lg" /> История входов
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PersonalAccountPage;
