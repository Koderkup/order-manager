"use client";
import { useState, useEffect } from "react";
import { FaTrash, FaEdit, FaPlus, FaSave, FaSearch } from "react-icons/fa";
import { useUserStore } from "@/store/userStore";
import { useToast } from "@/app/ToastProvider";

interface Order {
  id: number;
  number: string;
  order_date: string;
  status: "Выполнен" | "В обработке" | "Отменен";
  client_id: number;
  contract_id: number;
  specification_id: number;
  amount: string;
  contract_code?: string;
  contract_name?: string;
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
  client_name?: string;
}

interface OrderItem {
  id: number;
  product_id?: number;
  name: string;
  code?: string;
  article?: string;
  quantity: number;
  price: number;
  total: number;
  isCustom?: boolean;
}

interface Product {
  id: number;
  code: string;
  name: string;
  article: string;
  spec_price?: number;
  base_price?: number;
}

interface PageProps {
  params: {
    id: string;
  };
}

const OrderPage = ({ params }: PageProps) => {
  const { user } = useUserStore();
  const { notifySuccess, notifyError, notifyInfo } = useToast();

  const [activePage] = useState("orders");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const [createOrderItems, setCreateOrderItems] = useState<OrderItem[]>([
    {
      id: 1,
      name: "Товар 1",
      quantity: 1,
      price: 10000,
      total: 10000,
      isCustom: true,
    },
    {
      id: 2,
      name: "Товар 2",
      quantity: 2,
      price: 5000,
      total: 10000,
      isCustom: true,
    },
  ]);

  const [editOrderItems, setEditOrderItems] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editOrderStatus, setEditOrderStatus] = useState<
    "Выполнен" | "В обработке" | "Отменен"
  >("В обработке");
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const [newOrder, setNewOrder] = useState({
    contract_id: "",
    order_date: new Date().toISOString().split("T")[0],
  });


  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching orders for user:", user?.id);

      const response = await fetch(`/api/my-orders/${user?.id}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Orders response:", data);

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        notifyError(data.error || "Ошибка загрузки заказов");
      }
    } catch (error) {
      console.error("Ошибка при загрузке заказов:", error);
      notifyError("Ошибка загрузки заказов");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      if (!user?.id) return;

      console.log("Fetching contracts for user:", user?.id);

      const response = await fetch(`/api/contracts/${user?.id}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Contracts response:", data);

      if (data.success && Array.isArray(data.contracts)) {
        setContracts(data.contracts);
      } else {
        console.error("Unexpected contracts data format:", data);
        setContracts([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке договоров:", error);
      setContracts([]);
    }
  };

  const fetchOrderProducts = async (orderId: number) => {
    try {
      setIsLoadingProducts(true);
      console.log("Fetching order products for order:", orderId);

      const response = await fetch(`/api/my-orders/${orderId}/products`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Order products response:", data);

      if (data.success && Array.isArray(data.products)) {
        const orderItems = data.products.map((product: any) => ({
          id: product.id,
          product_id: product.product_id,
          name: product.product_name || `Товар #${product.product_id}`,
          code: product.product_code,
          article: product.product_article,
          quantity: Number(product.quantity) || 1,
          price: Number(product.price) || 0,
          total: Number(product.total) || 0,
          isCustom: false,
        }));

        console.log("Mapped order items:", orderItems);


        const calculatedTotal = orderItems.reduce(
          (sum: number, item: OrderItem) => sum + item.total,
          0
        );
        console.log("Calculated total from items:", calculatedTotal);

        setEditOrderItems(orderItems);

        if (orderItems.length === 0) {
          notifyInfo("В заказе пока нет товаров");
        }
      } else {
        notifyError(data.error || "Не удалось загрузить товары заказа");
      }
    } catch (error) {
      console.error("Ошибка загрузки товаров заказа:", error);
      notifyError("Ошибка загрузки товаров заказа");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchAvailableProducts = async (specificationId: number) => {
    try {
      console.log(
        "Fetching available products for specification:",
        specificationId
      );

      const response = await fetch(
        `/api/specifications/${specificationId}/products`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Available products response:", data);

      if (data.success) {
        setAvailableProducts(data.products || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки доступных товаров:", error);
    }
  };


  useEffect(() => {
    if (user?.id) {
      fetchOrders();
      fetchContracts();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedOrder && isEditModalOpen) {
      console.log("Loading data for order:", selectedOrder.id);
      fetchOrderProducts(selectedOrder.id);
      fetchAvailableProducts(selectedOrder.specification_id);
    }
  }, [selectedOrder, isEditModalOpen]);


  useEffect(() => {
    if (editOrderItems.length > 0) {
      console.log("=== DEBUG EDIT ITEMS ===");
      console.log("Edit items:", editOrderItems);
      console.log(
        "Edit total amount:",
        editOrderItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
      );
      console.log(
        "Item totals:",
        editOrderItems.map((item) => ({
          id: item.id,
          name: item.name,
          total: item.total,
          totalType: typeof item.total,
          quantity: item.quantity,
          price: item.price,
          calculated: item.quantity * item.price,
        }))
      );
    }
  }, [editOrderItems]);


  const handleAddItem = () => {
    const newId =
      createOrderItems.length > 0
        ? Math.max(...createOrderItems.map((item) => item.id)) + 1
        : 1;

    setCreateOrderItems([
      ...createOrderItems,
      {
        id: newId,
        name: "",
        quantity: 1,
        price: 0,
        total: 0,
        isCustom: true,
      },
    ]);
  };

  const handleDeleteCreateItem = (id: number) => {
    if (createOrderItems.length > 1) {
      setCreateOrderItems(createOrderItems.filter((item) => item.id !== id));
    }
  };

  const handleCreateItemChange = (
    id: number,
    field: string,
    value: string | number
  ) => {
    setCreateOrderItems(
      createOrderItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item };

          if (field === "quantity") {
            updatedItem.quantity = Math.max(1, Number(value) || 1);
          } else if (field === "price") {
            updatedItem.price = Math.max(0, Number(value) || 0);
          } else if (field === "name") {
            updatedItem.name = value as string;
          }

          updatedItem.total = Number(
            (updatedItem.quantity * updatedItem.price).toFixed(2)
          );

          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleCreateOrder = async () => {
    try {
      if (!newOrder.contract_id) {
        notifyError("Выберите договор");
        return;
      }

      const unnamedItems = createOrderItems.filter(
        (item) => item.isCustom && !item.name.trim()
      );
      if (unnamedItems.length > 0) {
        notifyError("Укажите название для всех товаров");
        return;
      }

      const totalAmount = createOrderItems.reduce(
        (sum, item) => sum + (Number(item.total) || 0),
        0
      );

      console.log("Creating order with total amount:", totalAmount);

      const orderData = {
        client_id: user?.id,
        contract_id: parseInt(newOrder.contract_id),
        order_date: newOrder.order_date,
        amount: Number(totalAmount.toFixed(2)),
        status: "В обработке" as const,
        specification_id: 1,
      };

      console.log("Order data:", orderData);

      const response = await fetch(`/api/my-orders/${user?.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      console.log("Create order response:", data);

      if (response.ok && data.success) {
        setIsCreateModalOpen(false);
        fetchOrders();
        setNewOrder({
          contract_id: "",
          order_date: new Date().toISOString().split("T")[0],
        });
        setCreateOrderItems([
          {
            id: 1,
            name: "Товар 1",
            quantity: 1,
            price: 10000,
            total: 10000,
            isCustom: true,
          },
          {
            id: 2,
            name: "Товар 2",
            quantity: 2,
            price: 5000,
            total: 10000,
            isCustom: true,
          },
        ]);
        notifySuccess(`Заказ успешно создан! Номер: ${data.orderNumber}`);
      } else {
        notifyError(data.error || "Ошибка при создании заказа");
      }
    } catch (error) {
      console.error("Ошибка при создании заказа:", error);
      notifyError("Ошибка при создании заказа");
    }
  };

  const handleEditOrder = async (order: Order) => {
    console.log("Editing order:", order);
    setSelectedOrder(order);
    setEditOrderStatus(order.status);
    setIsEditModalOpen(true);
  };

  const handleAddEditItem = () => {
    const newId =
      editOrderItems.length > 0
        ? Math.max(...editOrderItems.map((item) => item.id)) + 1
        : 1;

    setEditOrderItems([
      ...editOrderItems,
      {
        id: newId,
        name: "",
        quantity: 1,
        price: 0,
        total: 0,
        isCustom: true,
      },
    ]);
  };

  const handleDeleteEditItem = (id: number) => {
    if (editOrderItems.length > 1) {
      setEditOrderItems(editOrderItems.filter((item) => item.id !== id));
    }
  };

  const handleEditItemChange = (
    id: number,
    field: string,
    value: string | number
  ) => {
    setEditOrderItems(
      editOrderItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item };

          if (field === "quantity") {
            updatedItem.quantity = Math.max(1, Number(value) || 1);
          } else if (field === "price") {
            updatedItem.price = Math.max(0, Number(value) || 0);
          } else if (field === "name") {
            updatedItem.name = value as string;
          } else if (field === "code") {
            updatedItem.code = value as string;
          } else if (field === "article") {
            updatedItem.article = value as string;
          }

          updatedItem.total = Number(
            (updatedItem.quantity * updatedItem.price).toFixed(2)
          );

          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleAddProductFromList = () => {
    if (!selectedProductId) {
      notifyInfo("Выберите товар из списка");
      return;
    }

    const product = availableProducts.find(
      (p) => p.id.toString() === selectedProductId
    );

    if (!product) {
      notifyError("Товар не найден");
      return;
    }

    if (editOrderItems.some((item) => item.product_id === product.id)) {
      notifyInfo("Этот товар уже добавлен в заказ");
      setSelectedProductId("");
      return;
    }

    const newId =
      editOrderItems.length > 0
        ? Math.max(...editOrderItems.map((item) => item.id)) + 1
        : 1;

    const price = product.spec_price || product.base_price || 0;

    setEditOrderItems([
      ...editOrderItems,
      {
        id: newId,
        product_id: product.id,
        name: product.name,
        code: product.code,
        article: product.article,
        quantity: 1,
        price: price,
        total: price,
        isCustom: false,
      },
    ]);

    setSelectedProductId("");
    notifySuccess("Товар добавлен в заказ");
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) {
      notifyError("Заказ не выбран");
      return;
    }

    try {
      setIsSaving(true);

      console.log("=== START UPDATE ORDER ===");
      console.log("Selected order ID:", selectedOrder.id);
      console.log("Edit order items:", editOrderItems);

      if (editOrderItems.length === 0) {
        notifyError("Добавьте хотя бы один товар в заказ");
        setIsSaving(false);
        return;
      }

      const unnamedItems = editOrderItems.filter(
        (item) => item.isCustom && !item.name.trim()
      );
      if (unnamedItems.length > 0) {
        notifyError("Укажите название для всех произвольных товаров");
        setIsSaving(false);
        return;
      }

      const regularItems = editOrderItems.filter((item) => !item.isCustom);
      const customItems = editOrderItems.filter((item) => item.isCustom);

      const invalidRegularItems = regularItems.filter(
        (item) => !item.product_id
      );
      if (invalidRegularItems.length > 0) {
        notifyInfo(
          `${invalidRegularItems.length} обычных товаров без привязки к каталогу будут пропущены`
        );
      }

      const validRegularItems = regularItems.filter((item) => {
        if (!item.product_id) return false;
        if (item.quantity <= 0) {
          notifyInfo(
            `Товар "${item.name}" имеет некорректное количество: ${item.quantity}`
          );
          return false;
        }
        if (item.price <= 0) {
          notifyInfo(
            `Товар "${item.name}" имеет некорректную цену: ${item.price}`
          );
          return false;
        }
        return true;
      });

      const validCustomItems = customItems.filter((item) => {
        if (item.quantity <= 0) {
          notifyInfo(
            `Произвольный товар "${item.name}" имеет некорректное количество: ${item.quantity}`
          );
          return false;
        }
        if (item.price <= 0) {
          notifyInfo(
            `Произвольный товар "${item.name}" имеет некорректную цену: ${item.price}`
          );
          return false;
        }
        if (!item.name.trim()) {
          notifyInfo(`Произвольный товар без названия будет пропущен`);
          return false;
        }
        return true;
      });

      const validOrderItems = [...validRegularItems, ...validCustomItems];

      if (validOrderItems.length === 0) {
        notifyError("Нет валидных товаров для сохранения");
        setIsSaving(false);
        return;
      }



      const totalAmount = validOrderItems.reduce((sum, item) => {
        return sum + (Number(item.total) || 0);
      }, 0);

      const roundedAmount = Number(totalAmount.toFixed(2));
      console.log("Calculated total:", totalAmount, "Rounded:", roundedAmount);

      const productsData = validOrderItems.map((item) => ({
        product_id: item.isCustom ? null : item.product_id,
        name: item.isCustom ? item.name : null,
        price: Number(item.price),
        quantity: Number(item.quantity),
      }));

     
      const statusResponse = await fetch(`/api/my-orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: editOrderStatus,
          amount: roundedAmount,
        }),
      });

      const statusData = await statusResponse.json();
      console.log("Status update response:", statusData);

      if (!statusResponse.ok) {
        console.error("Status update failed:", statusData);
        notifyError(statusData.error || "Ошибка при обновлении статуса заказа");
        setIsSaving(false);
        return;
      }

      const productsResponse = await fetch(
        `/api/my-orders/${selectedOrder.id}/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ products: productsData }),
        }
      );

      const productsDataResp = await productsResponse.json();


      if (!productsResponse.ok) {
        console.error("Products update failed:", productsDataResp);
        notifyError(
          productsDataResp.error || "Ошибка при обновлении товаров заказа"
        );
        setIsSaving(false);
        return;
      }

      notifySuccess("Заказ успешно обновлен!");

      setIsEditModalOpen(false);
      setSelectedOrder(null);
      setEditOrderItems([]);
      setEditOrderStatus("В обработке");
      setAvailableProducts([]);
      setSelectedProductId("");

      await fetchOrders();
    } catch (error) {
      console.error("Критическая ошибка при обновлении заказа:", error);
      notifyError(
        `Критическая ошибка: ${
          error instanceof Error ? error.message : "Неизвестная ошибка"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };


  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU");
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string | number | undefined): string => {
    if (amount === undefined || amount === null) return "0 ₽";

    let num: number;

    if (typeof amount === "string") {
      const cleanString = amount.toString().replace(/[^\d.,-]/g, "");
      num = parseFloat(cleanString.replace(",", ".")) || 0;
    } else {
      num = amount;
    }

    return (
      new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num) + " ₽"
    );
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


  const createTotalAmount = createOrderItems.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );

  const editTotalAmount = editOrderItems.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );

  const filteredAvailableProducts = availableProducts.filter(
    (product) => !editOrderItems.some((item) => item.product_id === product.id)
  );

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
                    onClick={() => setIsCreateModalOpen(true)}
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
                      onClick={() => setIsCreateModalOpen(true)}
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
                        {orders.map((order) => (
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
                                onClick={() => handleEditOrder(order)}
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
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-medium text-gray-800">
                Создание нового заказа
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
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
                          {contract.code} - {contract.name}
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
                      {createOrderItems.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="Название товара"
                              value={item.name}
                              onChange={(e) =>
                                handleCreateItemChange(
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
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleCreateItemChange(
                                  item.id,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full px-3 py-1 border rounded"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={(e) =>
                                handleCreateItemChange(
                                  item.id,
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-1 border rounded"
                            />
                          </td>
                          <td className="p-3 font-medium">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteCreateItem(item.id)}
                              disabled={createOrderItems.length <= 1}
                              className={`p-2 rounded-lg transition-all ${
                                createOrderItems.length <= 1
                                  ? "opacity-30 cursor-not-allowed"
                                  : "text-red-500 hover:text-red-700 hover:bg-red-50"
                              }`}
                              title={
                                createOrderItems.length <= 1
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
                    Общая сумма: {formatCurrency(createTotalAmount)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
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

      {/* Модальное окно редактирования заказа */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-medium text-gray-800">
                Редактирование заказа #{selectedOrder.number}
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedOrder(null);
                  setEditOrderItems([]);
                  setEditOrderStatus("В обработке");
                  setAvailableProducts([]);
                  setSelectedProductId("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <span>
                  <b>×</b>
                </span>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-800 mb-4">
                  Информация о заказе
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block mb-2 text-gray-700">
                      Номер заказа
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      value={selectedOrder.number}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700">
                      Дата заказа
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={selectedOrder.order_date.split("T")[0]}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700">Статус</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={editOrderStatus}
                      onChange={(e) =>
                        setEditOrderStatus(
                          e.target.value as
                            | "Выполнен"
                            | "В обработке"
                            | "Отменен"
                        )
                      }
                    >
                      <option value="В обработке">В обработке</option>
                      <option value="Выполнен">Выполнен</option>
                      <option value="Отменен">Отменен</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700">Договор</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      value={`${
                        selectedOrder.contract_code ||
                        `Договор #${selectedOrder.contract_id}`
                      }${
                        selectedOrder.contract_name
                          ? ` - ${selectedOrder.contract_name}`
                          : ""
                      }`}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700">
                      Исходная сумма
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      value={formatCurrency(selectedOrder.amount)}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700">Клиент</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      value={
                        selectedOrder.client_name ||
                        `Клиент #${selectedOrder.client_id}`
                      }
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-800">
                    Позиции заказа
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        className="px-4 py-2 border border-gray-300 rounded-lg pr-10"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                      >
                        <option value="">Добавить товар из спецификации</option>
                        {filteredAvailableProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.code} - {product.name} (
                            {formatCurrency(
                              product.spec_price || product.base_price
                            )}
                            )
                          </option>
                        ))}
                      </select>
                      <FaSearch className="absolute right-3 top-3 text-gray-400" />
                    </div>
                    <button
                      onClick={handleAddProductFromList}
                      disabled={!selectedProductId}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        !selectedProductId
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <FaPlus className="mr-2" />
                      Добавить
                    </button>
                  </div>
                </div>

                {isLoadingProducts ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E4F5F]"></div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-3 text-left">Товар</th>
                            <th className="p-3 text-left">Количество</th>
                            <th className="p-3 text-left">Цена (₽)</th>
                            <th className="p-3 text-left">Сумма (₽)</th>
                            <th className="p-3 text-left">Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editOrderItems.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="p-8 text-center text-gray-500"
                              >
                                В заказе нет товаров
                              </td>
                            </tr>
                          ) : (
                            editOrderItems.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-3">
                                  {item.isCustom ? (
                                    <input
                                      type="text"
                                      placeholder="Название товара"
                                      value={item.name}
                                      onChange={(e) =>
                                        handleEditItemChange(
                                          item.id,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-1 border rounded mb-1"
                                    />
                                  ) : (
                                    <>
                                      <div className="font-medium">
                                        {item.name}
                                      </div>
                                      {item.code && (
                                        <div className="text-sm text-gray-500">
                                          Код: {item.code}
                                        </div>
                                      )}
                                      {item.article && (
                                        <div className="text-sm text-gray-500">
                                          Артикул: {item.article}
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {item.isCustom && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      Произвольный товар
                                    </div>
                                  )}
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleEditItemChange(
                                        item.id,
                                        "quantity",
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="w-full px-3 py-1 border rounded"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.price}
                                    onChange={(e) =>
                                      handleEditItemChange(
                                        item.id,
                                        "price",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-3 py-1 border rounded"
                                  />
                                </td>
                                <td className="p-3 font-medium">
                                  {formatCurrency(item.total)}
                                </td>
                                <td className="p-3">
                                  <button
                                    onClick={() =>
                                      handleDeleteEditItem(item.id)
                                    }
                                    disabled={editOrderItems.length <= 1}
                                    className={`p-2 rounded-lg transition-all ${
                                      editOrderItems.length <= 1
                                        ? "opacity-30 cursor-not-allowed"
                                        : "text-red-500 hover:text-red-700 hover:bg-red-50"
                                    }`}
                                    title={
                                      editOrderItems.length <= 1
                                        ? "Должен остаться хотя бы один товар"
                                        : "Удалить товар"
                                    }
                                  >
                                    <FaTrash className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <button
                      onClick={handleAddEditItem}
                      className="px-5 py-2 bg-[#3E4F5F] text-white rounded-lg hover:bg-[#3E4F5F]/80 transition-all flex items-center mb-6"
                    >
                      <FaPlus className="mr-2" />
                      Добавить произвольный товар
                    </button>
                  </>
                )}

                <div className="mt-6 pt-6 border-t text-right">
                  <div className="text-xl font-semibold">
                    Общая сумма: {formatCurrency(editTotalAmount)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Изменение:{" "}
                    {formatCurrency(
                      editTotalAmount - parseFloat(selectedOrder.amount || "0")
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedOrder(null);
                    setEditOrderItems([]);
                    setEditOrderStatus("В обработке");
                    setAvailableProducts([]);
                    setSelectedProductId("");
                  }}
                  disabled={isSaving}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Отмена
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={isSaving || editOrderItems.length === 0}
                  className={`px-6 py-3 text-white rounded-lg transition-all flex items-center ${
                    isSaving || editOrderItems.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Сохранить изменения
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
