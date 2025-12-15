"use client";
import { useState, useEffect, ReactNode } from "react";
import { FaTrash, FaEdit, FaPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
interface Order {
  id: number;
  number: string;
  order_date: string;
  status: "Выполнен" | "В обработке" | "Отменен";
  client_id: number;
  contract_id: number;
  specification_id: number;
  amount: string;
  contract_number?: string;
  client_name?: string;
}

interface Contract {
  id: number;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  amount: string;
  active: number;
  client_id?: number;
}
interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface PageProps {
  params: {
    id: string;
  };
}

const Page = ({ params }: PageProps) => {
  const router = useRouter();
const user = useUserStore((state) => state.user);
  const [activePage, setActivePage] = useState("orders");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [contracts, setContracts] = useState<
    Array<{
      name: ReactNode;
      code: ReactNode; id: number; number: string; client_name: string 
}>
  >([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: 1, name: "Товар 1", quantity: 1, price: 10000, total: 10000 },
    { id: 2, name: "Товар 2", quantity: 2, price: 5000, total: 10000 },
  ]);


  const [newOrder, setNewOrder] = useState({
    contract_id: "",
    order_date: new Date().toISOString().split("T")[0],
  });

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/my-orders/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          console.error("Error fetching orders:", data.error);
        }
      } else {
        console.error("Failed to fetch orders:", response.status);
      }
    } catch (error) {
      console.error("Ошибка при загрузке заказов:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      if (!user?.id) return;

      const response = await fetch(`/api/contracts/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Contracts API response:", data);

        if (data.success && Array.isArray(data.contracts)) {
          setContracts(data.contracts);
        } else {
          console.error("Unexpected contracts data format:", data);
          setContracts([]);
        }
      } else {
        console.error("Failed to fetch contracts:", response.status);
        setContracts([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке договоров:", error);
      setContracts([]);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
      fetchContracts();
    }
  }, [user?.id]);

  const handleAddItem = () => {
    const newId =
      orderItems.length > 0
        ? Math.max(...orderItems.map((item) => item.id)) + 1
        : 1;
    setOrderItems([
      ...orderItems,
      { id: newId, name: `Товар ${newId}`, quantity: 1, price: 0, total: 0 },
    ]);
  };

  const handleDeleteItem = (id: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (
    id: number,
    field: string,
    value: string | number
  ) => {
    setOrderItems(
      orderItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "price") {
            updatedItem.total = updatedItem.quantity * updatedItem.price;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleCreateOrder = async () => {
    try {
      const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
      const orderData = {
        client_id: user?.id,
        contract_id: parseInt(newOrder.contract_id),
        order_date: newOrder.order_date,
        amount: totalAmount,
        status: "В обработке" as const,
        specification_id: 1,
      };

      const response = await fetch(`/api/my-orders/${user?.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchOrders(); 
        setNewOrder({
          contract_id: "",
          order_date: new Date().toISOString().split("T")[0],
        });
        setOrderItems([
          { id: 1, name: "Товар 1", quantity: 1, price: 10000, total: 10000 },
          { id: 2, name: "Товар 2", quantity: 2, price: 5000, total: 10000 },
        ]);
      }
    } catch (error) {
      console.error("Ошибка при создании заказа:", error);
    }
  };

  const handleEditOrder = (orderId: number) => {
    router.push(`/edit-order/${orderId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU");
  };

  const formatCurrency = (amount: string) => {
    return `${parseFloat(amount).toLocaleString("ru-RU")} ₽`;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Выполнен":
        return "bg-green-50 text-green-700";
      case "В обработке":
        return "bg-yellow-50 text-yellow-700";
      case "Отменен":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="flex min-h-screen">
        <div className="flex-1 p-8 overflow-auto">
          {/* Заголовок */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-medium text-gray-800">
              Заказы клиента #{user?.id}
            </h2>
          </div>

          {/* Контент страницы */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] p-8">
            {activePage === "orders" && (
              <div className="animate-fadeIn">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-2xl font-medium text-gray-800">
                    Список заказов
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-[#3E4F5F] text-white rounded-lg hover:bg-[#3E4F5F]/80 transition-all flex items-center cursor-pointer"
                  >
                    <FaPlus className="mr-2" />
                    Создать заказ
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E4F5F]"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      У клиента пока нет заказов
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-4 px-6 py-3 bg-[#3E4F5F] text-white rounded-lg hover:bg-[#3E4F5F]/80 transition-all inline-flex items-center"
                    >
                      <FaPlus className="mr-2" />
                      Создать первый заказ
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-4 text-gray-700 font-semibold">
                            Номер заказа
                          </th>
                          <th className="text-left p-4 text-gray-700 font-semibold">
                            Дата
                          </th>
                          <th className="text-left p-4 text-gray-700 font-semibold">
                            Договор
                          </th>
                          <th className="text-left p-4 text-gray-700 font-semibold">
                            Сумма
                          </th>
                          <th className="text-left p-4 text-gray-700 font-semibold">
                            Статус
                          </th>
                          <th className="text-left p-4 text-gray-700 font-semibold">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order: any) => (
                          <tr
                            key={order.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="p-4 font-medium">#{order.number}</td>
                            <td className="p-4">
                              {formatDate(order.order_date)}
                            </td>
                            <td className="p-4">
                              {order.contract_code ||
                                `Договор #${order.contract_id}`}
                              {order.contract_name &&
                                ` - ${order.contract_name}`}
                            </td>
                            <td className="p-4 font-medium">
                              {formatCurrency(order.amount)}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleEditOrder(order.id)}
                                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all flex items-center"
                                title="Редактировать заказ"
                              >
                                <FaEdit className="w-4 h-4" />
                                <span className="ml-2">Редактировать</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно создания заказа */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-40 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-medium text-gray-800">
                Создание нового заказа
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <span>×</span>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-800 mb-4">
                  Информация о заказе
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-gray-700">Договор</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={newOrder.contract_id}
                      onChange={(e) =>
                        setNewOrder({
                          ...newOrder,
                          contract_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Выберите договор</option>
                      {contracts.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.code} - {contract.name}{" "}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700">
                      Дата заказа
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={newOrder.order_date}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, order_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-4">
                  Позиции заказа
                </h4>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-left">Номенклатура</th>
                        <th className="p-3 text-left">Количество</th>
                        <th className="p-3 text-left">Цена</th>
                        <th className="p-3 text-left">Сумма</th>
                        <th className="p-3 text-left">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1 border rounded"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "quantity",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-1 border rounded"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "price",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-1 border rounded"
                            />
                          </td>
                          <td className="p-3 font-medium">
                            {item.total.toLocaleString()} ₽
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={orderItems.length <= 1}
                              className={`p-2 rounded-lg transition-all ${
                                orderItems.length <= 1
                                  ? "opacity-30 cursor-not-allowed"
                                  : "text-red-500 hover:text-red-700 hover:bg-red-50"
                              }`}
                              title={
                                orderItems.length <= 1
                                  ? "Должен остаться хотя бы один товар"
                                  : "Удалить строку"
                              }
                            >
                              <FaTrash className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={handleAddItem}
                  className="px-5 py-2 bg-[#3E4F5F] text-white rounded-lg hover:bg-[#3E4F5F]/80 transition-all flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Добавить товар
                </button>

                <div className="mt-6 pt-6 border-t text-right">
                  <div className="text-xl font-semibold">
                    Итого: {totalAmount.toLocaleString()} ₽
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={!newOrder.contract_id}
                  className={`px-6 py-3 text-white rounded-lg transition-all flex items-center ${
                    !newOrder.contract_id
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#3E4F5F] hover:bg-[#3E4F5F]/80"
                  }`}
                >
                  <FaPlus className="mr-2" />
                  Создать заказ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
