"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";

interface Contract {
  id: number;
  code: string;
  name: string;
  client_name: string;
  client_code: string;
}

interface PriceItem {
  id: number;
  code: string;
  name: string;
  article: string;
  price: number;
  unit: string;
  spec_code: string;
  spec_name: string;
  contract_code: string;
}

const PricePage = () => {
  const { user } = useUserStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>("");
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const fetchUserContracts = async () => {
    try {
      setLoading(true);
      setError("");

      const urlParams = new URLSearchParams(window.location.search);
      const clientIdFromUrl = urlParams.get("clientId");

      let targetUserId = user?.id;

      if (user?.role === "admin" && clientIdFromUrl) {
        targetUserId = parseInt(clientIdFromUrl);
        console.log(
          "Admin viewing client contracts, clientId:",
          clientIdFromUrl
        );
      }

      if (user?.role !== "admin" && clientIdFromUrl) {
        setError("У вас нет доступа к договорам другого клиента");
        setContracts([]);
        return;
      }

      const response = await fetch(`/api/admin-query-contracts/${targetUserId}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      console.log("Contracts data:", data);

      if (response.ok && data.success) {
        setContracts(data.contracts || []);

        const contractIdFromUrl = urlParams.get("contractId");
        if (
          contractIdFromUrl &&
          data.contracts?.some(
            (c: Contract) => c.id.toString() === contractIdFromUrl
          )
        ) {
          setSelectedContract(contractIdFromUrl);
        } else if (data.contracts && data.contracts.length > 0) {
          setSelectedContract(data.contracts[0].id.toString());
        }
      } else {
        setError(data.error || "Ошибка загрузки договоров");
      }
    } catch (err) {
      console.error("Ошибка загрузки договоров:", err);
      setError("Ошибка загрузки договоров. Проверьте подключение к серверу.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceList = async (contractId: string) => {
    if (!contractId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/price/${contractId}/pricelist`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("Нет доступа к выбранному договору");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPriceItems(data.priceItems || []);
      } else {
        setError(data.error || "Ошибка загрузки прайс-листа");
        setPriceItems([]);
      }
    } catch (err) {
      console.error("Ошибка загрузки прайс-листа:", err);
      setError("Ошибка загрузки прайс-листа");
      setPriceItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserContracts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedContract) {
      fetchPriceList(selectedContract);
    }
  }, [selectedContract]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Требуется авторизация
          </h2>
          <p className="text-gray-500">
            Пожалуйста, войдите в систему для доступа к прайс-листу
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <h1 className="pl-4 md:pl-8 text-[20px] md:text-[28px] font-bold text-gray-800">
        Прайс-лист
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] p-6 md:p-8">
        {/* Заголовок страницы с фильтром */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-medium text-gray-800">
                Прайс-лист
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {user.role === "admin"
                  ? "Все договоры"
                  : `Ваши договоры (${user.name})`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <span className="text-gray-600 whitespace-nowrap">Договор:</span>
              <select
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-w-[250px] lg:min-w-[300px]"
                disabled={loading || contracts.length === 0}
              >
                {contracts.length === 0 ? (
                  <option value="">Нет доступных договоров</option>
                ) : (
                  contracts.map((contract) => (
                    <option key={contract.id} value={contract.id.toString()}>
                      {contract.code} - {contract.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Сообщения об ошибке/загрузке */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <div className="text-gray-500">Загрузка...</div>
            </div>
          </div>
        ) : (
          /* Таблица прайс-листа */
          <div className="overflow-x-auto animate-fadeIn">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 md:p-4 text-gray-700 font-semibold">
                    Код товара
                  </th>
                  <th className="text-left p-3 md:p-4 text-gray-700 font-semibold">
                    Артикул
                  </th>
                  <th className="text-left p-3 md:p-4 text-gray-700 font-semibold">
                    Номенклатура
                  </th>
                  <th className="text-left p-3 md:p-4 text-gray-700 font-semibold">
                    Единица измерения
                  </th>
                  <th className="text-left p-3 md:p-4 text-gray-700 font-semibold">
                    Цена
                  </th>
                  <th className="text-left p-3 md:p-4 text-gray-700 font-semibold">
                    Спецификация
                  </th>
                </tr>
              </thead>
              <tbody>
                {priceItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      {selectedContract
                        ? "Нет товаров для выбранного договора"
                        : "Выберите договор"}
                    </td>
                  </tr>
                ) : (
                  priceItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 md:p-4 font-medium text-gray-800">
                        {item.code}
                      </td>
                      <td className="p-3 md:p-4 text-gray-600">
                        {item.article || "-"}
                      </td>
                      <td className="p-3 md:p-4">
                        <div className="font-medium">{item.name}</div>
                      </td>
                      <td className="p-3 md:p-4 text-gray-600">{item.unit}</td>
                      <td className="p-3 md:p-4 font-semibold text-gray-800">
                        {formatPrice(item.price)}
                      </td>
                      <td className="p-3 md:p-4 text-sm text-gray-500">
                        <div className="font-medium">{item.spec_code}</div>
                        <div className="text-xs">{item.spec_name}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Подвал таблицы */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-gray-500">
            Всего позиций: {priceItems.length}
          </div>
          <div className="text-sm text-gray-500">
            {selectedContract &&
              contracts.find((c) => c.id.toString() === selectedContract) && (
                <>
                  Договор:{" "}
                  {
                    contracts.find((c) => c.id.toString() === selectedContract)!
                      .code
                  }
                </>
              )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PricePage;
