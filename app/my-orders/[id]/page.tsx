'use client';
import { useState, useEffect } from 'react';
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaSave,
  FaTimes,
} from 'react-icons/fa';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/app/ToastProvider';

interface Order {
  id: number;
  number: string;
  order_date: string;
  status: 'Новый' | 'Сформирован';
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
}

interface SpecificationProduct {
  id: number;
  product_id: number;
  price: string;
  product_code: string;
  product_name: string;
  product_article: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

const OrderPage = ({ params }: PageProps) => {
  const { user } = useUserStore();
  const { notifySuccess, notifyError, notifyInfo } = useToast();

  const [activePage] = useState('orders');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  
  const [createOrderItems, setCreateOrderItems] = useState<OrderItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<
    SpecificationProduct[]
  >([]);
  const [isLoadingAvailableProducts, setIsLoadingAvailableProducts] =
    useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedContractSpecId, setSelectedContractSpecId] = useState<
    number | null
  >(null);

  
  const [editOrderItems, setEditOrderItems] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editOrderStatus, setEditOrderStatus] = useState<
    'Новый' | 'Сформирован'
  >('Новый');
  const [editAvailableProducts, setEditAvailableProducts] = useState<
    SpecificationProduct[]
  >([]);
  const [isLoadingEditProducts, setIsLoadingEditProducts] = useState(false);
  const [editSelectedProductId, setEditSelectedProductId] =
    useState<string>('');

  const [newOrder, setNewOrder] = useState({
    contract_id: '',
    order_date: new Date().toISOString().split('T')[0],
  });

  
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/my-orders/${user?.id}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        notifyError(data.error || 'Ошибка загрузки заказов');
      }
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error);
      notifyError('Ошибка загрузки заказов');
    } finally {
      setIsLoading(false);
    }
  };

  
  const fetchContracts = async () => {
    try {
      if (!user?.id) return;
      const response = await fetch(`/api/contracts/${user?.id}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.contracts)) {
        setContracts(data.contracts);
      } else {
        setContracts([]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке договоров:', error);
      setContracts([]);
    }
  };

  interface ApiProduct {
  id: number;
  code: string;
  name: string;
  article: string;
  spec_price: number | null;
  base_price: number;
}
  const fetchSpecificationProducts = async (contractId: string) => {
    if (!contractId) return;

    setIsLoadingAvailableProducts(true);
    try {
     
      const selectedContract = contracts.find(
        (c) => c.id.toString() === contractId,
      );
      if (!selectedContract) {
        setAvailableProducts([]);
        return;
      }

      
      const specResponse = await fetch(
        `/api/contracts/${contractId}/specifications`,
      );
      let specificationId = null;

      if (specResponse.ok) {
        const specData = await specResponse.json();
        if (
          specData.success &&
          specData.specifications &&
          specData.specifications.length > 0
        ) {
          specificationId = specData.specifications[0].id;
          setSelectedContractSpecId(specificationId);
        }
      }

      if (!specificationId) {
        setAvailableProducts([]);
        setSelectedContractSpecId(null);
        return;
      }

      // Загружаем товары спецификации
      const productsResponse = await fetch(
        `/api/specifications/${specificationId}/products`,
      );
      const productsData = await productsResponse.json();

      if (productsData.success && Array.isArray(productsData.products)) {
        const formattedProducts = productsData.products.map(
          (p: ApiProduct) => ({
            id: p.id,
            product_id: p.id,
            price: p.spec_price || p.base_price || 0,
            product_code: p.code,
            product_name: p.name,
            product_article: p.article,
          }),
        );
        setAvailableProducts(formattedProducts);
      } else {
        setAvailableProducts([]);
      }
    } catch (error) {
      console.error('Error fetching specification products:', error);
      setAvailableProducts([]);
    } finally {
      setIsLoadingAvailableProducts(false);
    }
  };

  // Загрузка товаров спецификации для редактирования
  const fetchEditSpecificationProducts = async (specificationId: number) => {
    setIsLoadingEditProducts(true);
    try {
      const response = await fetch(
        `/api/specifications/${specificationId}/products`,
      );
      const data = await response.json();

      if (data.success && Array.isArray(data.products)) {
        const formattedProducts = data.products.map((p: ApiProduct) => ({
          id: p.id,
          product_id: p.id,
          price: p.spec_price || p.base_price || 0,
          product_code: p.code,
          product_name: p.name,
          product_article: p.article,
        }));
        setEditAvailableProducts(formattedProducts);
      } else {
        setEditAvailableProducts([]);
      }
    } catch (error) {
      console.error('Error fetching specification products:', error);
      setEditAvailableProducts([]);
    } finally {
      setIsLoadingEditProducts(false);
    }
  };
interface OrderProduct {
  id: number;
  product_id: number;
  product_name: string;
  product_code?: string;
  product_article?: string;
  quantity: number | string;
  price: number | string;
  total: number | string;
}
  // Загрузка товаров заказа для редактирования
  const fetchOrderProducts = async (orderId: number) => {
    try {
      setIsLoadingProducts(true);
      const response = await fetch(`/api/my-orders/${orderId}/products`);
      const data = await response.json();

      if (data.success && Array.isArray(data.products)) {
        const orderItems = data.products.map((product: OrderProduct) => ({
          id: product.id,
          product_id: product.product_id,
          name: product.product_name || `Товар #${product.product_id}`,
          code: product.product_code,
          article: product.product_article,
          quantity: Number(product.quantity) || 1,
          price: Number(product.price) || 0,
          total: Number(product.total) || 0,
        }));
        setEditOrderItems(orderItems);
      } else {
        setEditOrderItems([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки товаров заказа:', error);
      setEditOrderItems([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
      fetchContracts();
    }
  }, [user?.id]);

  useEffect(() => {
    if (isCreateModalOpen && selectedContractId) {
      fetchSpecificationProducts(selectedContractId);
    }
  }, [isCreateModalOpen, selectedContractId, contracts]);

  useEffect(() => {
    if (selectedOrder && isEditModalOpen) {
      fetchOrderProducts(selectedOrder.id);
      fetchEditSpecificationProducts(selectedOrder.specification_id);
    }
  }, [selectedOrder, isEditModalOpen]);

  

  const getNextId = (items: OrderItem[]) => {
    return items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  };

  const handleContractChange = (contractId: string) => {
    setSelectedContractId(contractId);
    setNewOrder({ ...newOrder, contract_id: contractId });
    setCreateOrderItems([]);
    setSelectedProductId('');
  };

  // Добавление товара из выпадающего списка
  const handleAddProductFromDropdown = () => {
    if (!selectedProductId) {
      notifyInfo('Выберите товар из списка');
      return;
    }

    const product = availableProducts.find(
      (p) => p.id.toString() === selectedProductId,
    );
    if (!product) {
      notifyError('Товар не найден');
      return;
    }

    if (
      createOrderItems.some((item) => item.product_id === product.product_id)
    ) {
      notifyInfo('Этот товар уже добавлен в заказ');
      setSelectedProductId('');
      return;
    }

    const price = Number(product.price);
    setCreateOrderItems([
      ...createOrderItems,
      {
        id: getNextId(createOrderItems),
        product_id: product.product_id,
        name: product.product_name,
        code: product.product_code,
        article: product.product_article,
        quantity: 1,
        price: price,
        total: price,
      },
    ]);
    setSelectedProductId('');
  };

  const handleDeleteCreateItem = (id: number) => {
    setCreateOrderItems(createOrderItems.filter((item) => item.id !== id));
  };

  const handleCreateQuantityChange = (id: number, quantity: number) => {
    setCreateOrderItems(
      createOrderItems.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, quantity);
          const newTotal = newQuantity * item.price;
          return { ...item, quantity: newQuantity, total: newTotal };
        }
        return item;
      }),
    );
  };

  const handleCreateOrder = async () => {
    try {
      if (!newOrder.contract_id) {
        notifyError('Выберите договор');
        return;
      }

      if (createOrderItems.length === 0) {
        notifyError('Добавьте хотя бы один товар в заказ');
        return;
      }

      const totalAmount = createOrderItems.reduce(
        (sum, item) => sum + item.total,
        0,
      );
      const roundedAmount = Number(totalAmount.toFixed(2));

      const response = await fetch(`/api/my-orders/${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          client_id: user?.id,
          contract_id: parseInt(newOrder.contract_id),
          order_date: newOrder.order_date,
          amount: roundedAmount,
          status: 'Новый',
          specification_id: selectedContractSpecId || 1,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const productsData = createOrderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        }));

        await fetch(`/api/my-orders/${data.orderId}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ products: productsData }),
        });

        notifySuccess(`Заказ успешно создан! Номер: ${data.orderNumber}`);
        setIsCreateModalOpen(false);
        setNewOrder({
          contract_id: '',
          order_date: new Date().toISOString().split('T')[0],
        });
        setSelectedContractId('');
        setCreateOrderItems([]);
        setSelectedProductId('');
        fetchOrders();
      } else {
        notifyError(data.error || 'Ошибка при создании заказа');
      }
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
      notifyError('Ошибка при создании заказа');
    }
  };

  

  const handleEditOrder = async (order: Order) => {
    setSelectedOrder(order);
    setEditOrderStatus(order.status);
    setIsEditModalOpen(true);
  };

  const handleAddEditProductFromDropdown = () => {
    if (!editSelectedProductId) {
      notifyInfo('Выберите товар из списка');
      return;
    }

    const product = editAvailableProducts.find(
      (p) => p.id.toString() === editSelectedProductId,
    );
    if (!product) {
      notifyError('Товар не найден');
      return;
    }

    if (editOrderItems.some((item) => item.product_id === product.product_id)) {
      notifyInfo('Этот товар уже добавлен в заказ');
      setEditSelectedProductId('');
      return;
    }

    const price = Number(product.price);
    setEditOrderItems([
      ...editOrderItems,
      {
        id: getNextId(editOrderItems),
        product_id: product.product_id,
        name: product.product_name,
        code: product.product_code,
        article: product.product_article,
        quantity: 1,
        price: price,
        total: price,
      },
    ]);
    setEditSelectedProductId('');
  };

  const handleDeleteEditItem = (id: number) => {
    setEditOrderItems(editOrderItems.filter((item) => item.id !== id));
  };

  const handleEditQuantityChange = (id: number, quantity: number) => {
    setEditOrderItems(
      editOrderItems.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, quantity);
          const newTotal = newQuantity * item.price;
          return { ...item, quantity: newQuantity, total: newTotal };
        }
        return item;
      }),
    );
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) {
      notifyError('Заказ не выбран');
      return;
    }

    try {
      setIsSaving(true);

      if (editOrderItems.length === 0) {
        notifyError('Добавьте хотя бы один товар в заказ');
        setIsSaving(false);
        return;
      }

      const totalAmount = editOrderItems.reduce(
        (sum, item) => sum + item.total,
        0,
      );
      const roundedAmount = Number(totalAmount.toFixed(2));

      const statusResponse = await fetch(`/api/my-orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: editOrderStatus,
          amount: roundedAmount,
        }),
      });

      if (!statusResponse.ok) {
        notifyError('Ошибка при обновлении статуса заказа');
        setIsSaving(false);
        return;
      }

      const productsData = editOrderItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const productsResponse = await fetch(
        `/api/my-orders/${selectedOrder.id}/products`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ products: productsData }),
        },
      );

      if (!productsResponse.ok) {
        notifyError('Ошибка при обновлении товаров заказа');
        setIsSaving(false);
        return;
      }

      notifySuccess('Заказ успешно обновлен!');
      setIsEditModalOpen(false);
      setSelectedOrder(null);
      setEditOrderItems([]);
      setEditOrderStatus('Новый');
      setEditSelectedProductId('');
      fetchOrders();
    } catch (error) {
      console.error('Критическая ошибка при обновлении заказа:', error);
      notifyError('Ошибка при обновлении заказа');
    } finally {
      setIsSaving(false);
    }
  };

 

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string | number | undefined): string => {
    if (amount === undefined || amount === null) return '0 ₽';
    const num =
      typeof amount === 'string'
        ? parseFloat(amount.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0
        : amount;
    return (
      new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num) + ' ₽'
    );
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Сформирован':
        return 'bg-green-50 text-green-700';
      case 'Новый':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const createTotalAmount = createOrderItems.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const editTotalAmount = editOrderItems.reduce(
    (sum, item) => sum + item.total,
    0,
  );

  return (
    <div className='min-h-screen bg-gray-50 text-gray-800 font-sans'>
      <div className='flex min-h-screen'>
        <div className='flex-1 p-8 overflow-auto'>
          <div className='flex justify-between items-center mb-8'>
            <h2 className='text-3xl font-medium text-gray-800'>
              Заказы клиента #{user?.id}
            </h2>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] p-8'>
            <div className='flex justify-between items-center mb-6 pb-6 border-b border-gray-200'>
              <h3 className='text-2xl font-medium text-gray-800'>
                Список заказов
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className='px-6 py-3 bg-[#3E4F5F] text-white rounded-lg hover:bg-[#3E4F5F]/80 transition-all flex items-center cursor-pointer'
              >
                <FaPlus className='mr-2' /> Создать заказ
              </button>
            </div>

            {isLoading ? (
              <div className='flex justify-center items-center h-64'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E4F5F]'></div>
              </div>
            ) : orders.length === 0 ? (
              <div className='text-center py-12'>
                <p className='text-gray-500 text-lg'>
                  У клиента пока нет заказов
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className='mt-4 px-6 py-3 bg-[#3E4F5F] text-white rounded-lg'
                >
                  <FaPlus className='inline mr-2' /> Создать первый заказ
                </button>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='text-left p-4'>Номер заказа</th>
                      <th className='text-left p-4'>Дата</th>
                      <th className='text-left p-4'>Договор</th>
                      <th className='text-left p-4'>Сумма</th>
                      <th className='text-left p-4'>Статус</th>
                      <th className='text-left p-4'>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className='border-b border-gray-100 hover:bg-gray-50'
                      >
                        <td className='p-4 font-medium'>#{order.number}</td>
                        <td className='p-4'>{formatDate(order.order_date)}</td>
                        <td className='p-4'>
                          {order.contract_code ||
                            `Договор #${order.contract_id}`}
                        </td>
                        <td className='p-4 font-medium'>
                          {formatCurrency(order.amount)}
                        </td>
                        <td className='p-4'>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className='p-4'>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className='px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100'
                          >
                            <FaEdit className='inline mr-2' /> Редактировать
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно создания заказа */}
      {isCreateModalOpen && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center'>
          <div className='bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-auto'>
            <div className='p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white'>
              <h3 className='text-2xl font-medium text-gray-800'>
                Создание нового заказа
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                <FaTimes className='w-6 h-6' />
              </button>
            </div>
            <div className='p-6'>
              <div className='mb-8'>
                <h4 className='text-lg font-medium text-gray-800 mb-4'>
                  Информация о заказе
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block mb-2 text-gray-700'>Договор</label>
                    <select
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg'
                      value={selectedContractId}
                      onChange={(e) => handleContractChange(e.target.value)}
                    >
                      <option value=''>Выберите договор</option>
                      {contracts.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.code} - {contract.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block mb-2 text-gray-700'>
                      Дата заказа
                    </label>
                    <input
                      type='date'
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg'
                      value={newOrder.order_date}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, order_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className='flex justify-between items-center mb-4'>
                  <h4 className='text-lg font-medium text-gray-800'>
                    Позиции заказа
                  </h4>
                  <div className='flex gap-2'>
                    <select
                      className='px-4 py-2 border border-gray-300 rounded-lg w-64'
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      disabled={
                        !selectedContractId || isLoadingAvailableProducts
                      }
                    >
                      <option value=''>-- Выберите товар --</option>
                      {availableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.product_code} - {product.product_name} (
                          {formatCurrency(product.price)})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddProductFromDropdown}
                      disabled={!selectedProductId}
                      className={`px-4 py-2 rounded-lg flex items-center ${!selectedProductId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      <FaPlus className='mr-2' /> Добавить товар
                    </button>
                  </div>
                </div>

                {isLoadingAvailableProducts && selectedContractId && (
                  <div className='flex justify-center items-center h-20'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-[#3E4F5F]'></div>
                    <span className='ml-2 text-gray-500'>
                      Загрузка товаров...
                    </span>
                  </div>
                )}

                <div className='overflow-x-auto mb-6'>
                  <table className='w-full'>
                    <thead>
                      <tr className='bg-gray-50'>
                        <th className='p-3 text-left'>Товар</th>
                        <th className='p-3 text-left w-32'>Количество</th>
                        <th className='p-3 text-left w-40'>Цена (₽)</th>
                        <th className='p-3 text-left w-40'>Сумма (₽)</th>
                        <th className='p-3 text-left w-20'>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createOrderItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className='p-8 text-center text-gray-500'
                          >
                            Нет добавленных товаров. Выберите товар из списка и
                            нажмите &quot;Добавить товар&rquot;
                          </td>
                        </tr>
                      ) : (
                        createOrderItems.map((item) => (
                          <tr
                            key={item.id}
                            className='border-b hover:bg-gray-50'
                          >
                            <td className='p-3'>
                              <div className='font-medium'>{item.name}</div>
                              <div className='text-sm text-gray-500'>
                                Код: {item.code} | Артикул: {item.article}
                              </div>
                            </td>
                            <td className='p-3'>
                              <input
                                type='number'
                                min='1'
                                value={item.quantity}
                                onChange={(e) =>
                                  handleCreateQuantityChange(
                                    item.id,
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className='w-24 px-3 py-1 border rounded'
                              />
                            </td>
                            <td className='p-3'>
                              <span className='font-medium'>
                                {formatCurrency(item.price)}
                              </span>
                            </td>
                            <td className='p-3 font-medium'>
                              {formatCurrency(item.total)}
                            </td>
                            <td className='p-3'>
                              <button
                                onClick={() => handleDeleteCreateItem(item.id)}
                                className='p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50'
                              >
                                <FaTrash className='w-5 h-5' />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className='mt-6 pt-6 border-t text-right'>
                  <div className='text-xl font-semibold'>
                    Общая сумма: {formatCurrency(createTotalAmount)}
                  </div>
                </div>
              </div>

              <div className='flex justify-end gap-4 mt-8 pt-6 border-t'>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className='px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50'
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={
                    !selectedContractId || createOrderItems.length === 0
                  }
                  className={`px-6 py-3 text-white rounded-lg flex items-center ${!selectedContractId || createOrderItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3E4F5F] hover:bg-[#3E4F5F]/80'}`}
                >
                  <FaPlus className='mr-2' /> Создать заказ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования заказа */}
      {isEditModalOpen && selectedOrder && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center'>
          <div className='bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-auto'>
            <div className='p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white'>
              <h3 className='text-2xl font-medium text-gray-800'>
                Редактирование заказа #{selectedOrder.number}
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedOrder(null);
                  setEditOrderItems([]);
                }}
                className='text-gray-500 hover:text-gray-700'
              >
                <FaTimes className='w-6 h-6' />
              </button>
            </div>
            <div className='p-6'>
              <div className='mb-8'>
                <h4 className='text-lg font-medium text-gray-800 mb-4'>
                  Информация о заказе
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div>
                    <label className='block mb-2 text-gray-700'>
                      Номер заказа
                    </label>
                    <input
                      type='text'
                      className='w-full px-4 py-2 border rounded-lg bg-gray-50'
                      value={selectedOrder.number}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className='block mb-2 text-gray-700'>
                      Дата заказа
                    </label>
                    <input
                      type='date'
                      className='w-full px-4 py-2 border rounded-lg bg-gray-50'
                      value={selectedOrder.order_date.split('T')[0]}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className='block mb-2 text-gray-700'>Статус</label>
                    <select
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg'
                      value={editOrderStatus}
                      onChange={(e) =>
                        setEditOrderStatus(
                          e.target.value as 'Новый' | 'Сформирован',
                        )
                      }
                    >
                      <option value='Новый'>Новый</option>
                      <option value='Сформирован'>Сформирован</option>
                    </select>
                  </div>
                  <div>
                    <label className='block mb-2 text-gray-700'>Договор</label>
                    <input
                      type='text'
                      className='w-full px-4 py-2 border rounded-lg bg-gray-50'
                      value={`${selectedOrder.contract_code || `Договор #${selectedOrder.contract_id}`}`}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className='block mb-2 text-gray-700'>Клиент</label>
                    <input
                      type='text'
                      className='w-full px-4 py-2 border rounded-lg bg-gray-50'
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
                <div className='flex justify-between items-center mb-4'>
                  <h4 className='text-lg font-medium text-gray-800'>
                    Позиции заказа
                  </h4>
                  <div className='flex gap-2'>
                    <select
                      className='px-4 py-2 border border-gray-300 rounded-lg w-64'
                      value={editSelectedProductId}
                      onChange={(e) => setEditSelectedProductId(e.target.value)}
                      disabled={isLoadingEditProducts}
                    >
                      <option value=''>-- Выберите товар --</option>
                      {editAvailableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.product_code} - {product.product_name} (
                          {formatCurrency(product.price)})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddEditProductFromDropdown}
                      disabled={!editSelectedProductId}
                      className={`px-4 py-2 rounded-lg flex items-center ${!editSelectedProductId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      <FaPlus className='mr-2' /> Добавить товар
                    </button>
                  </div>
                </div>

                {isLoadingProducts ? (
                  <div className='flex justify-center items-center h-40'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E4F5F]'></div>
                  </div>
                ) : (
                  <>
                    <div className='overflow-x-auto mb-6'>
                      <table className='w-full'>
                        <thead>
                          <tr className='bg-gray-50'>
                            <th className='p-3 text-left'>Товар</th>
                            <th className='p-3 text-left w-32'>Количество</th>
                            <th className='p-3 text-left w-40'>Цена (₽)</th>
                            <th className='p-3 text-left w-40'>Сумма (₽)</th>
                            <th className='p-3 text-left w-20'>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editOrderItems.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className='p-8 text-center text-gray-500'
                              >
                                В заказе нет товаров
                              </td>
                            </tr>
                          ) : (
                            editOrderItems.map((item) => (
                              <tr
                                key={item.id}
                                className='border-b hover:bg-gray-50'
                              >
                                <td className='p-3'>
                                  <div className='font-medium'>{item.name}</div>
                                  <div className='text-sm text-gray-500'>
                                    Код: {item.code} | Артикул: {item.article}
                                  </div>
                                </td>
                                <td className='p-3'>
                                  <input
                                    type='number'
                                    min='1'
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleEditQuantityChange(
                                        item.id,
                                        parseInt(e.target.value) || 1,
                                      )
                                    }
                                    className='w-24 px-3 py-1 border rounded'
                                  />
                                </td>
                                <td className='p-3'>
                                  <span className='font-medium'>
                                    {formatCurrency(item.price)}
                                  </span>
                                </td>
                                <td className='p-3 font-medium'>
                                  {formatCurrency(item.total)}
                                </td>
                                <td className='p-3'>
                                  <button
                                    onClick={() =>
                                      handleDeleteEditItem(item.id)
                                    }
                                    className='p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50'
                                  >
                                    <FaTrash className='w-5 h-5' />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className='mt-6 pt-6 border-t text-right'>
                      <div className='text-xl font-semibold'>
                        Общая сумма: {formatCurrency(editTotalAmount)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className='flex justify-end gap-4 mt-8 pt-6 border-t'>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedOrder(null);
                    setEditOrderItems([]);
                  }}
                  disabled={isSaving}
                  className='px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50'
                >
                  Отмена
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={isSaving || editOrderItems.length === 0}
                  className={`px-6 py-3 text-white rounded-lg flex items-center ${isSaving || editOrderItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isSaving ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>{' '}
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <FaSave className='mr-2' /> Сохранить изменения
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
