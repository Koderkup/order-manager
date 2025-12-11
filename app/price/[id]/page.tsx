'use client'

const PricePage = () => {
  const priceItems = [
    {
      id: 1,
      name: "Ноутбук бизнес-класса",
      code: "NB001",
      unit: "шт",
      price: "85 000 ₽",
    },
    {
      id: 2,
      name: 'Монитор 24"',
      code: "MN001",
      unit: "шт",
      price: "15 000 ₽",
    },
    {
      id: 3,
      name: "Офисный стол",
      code: "TB001",
      unit: "шт",
      price: "12 500 ₽",
    },
    {
      id: 4,
      name: "Офисное кресло",
      code: "CH001",
      unit: "шт",
      price: "8 000 ₽",
    },
    {
      id: 5,
      name: "МФУ лазерное",
      code: "MF001",
      unit: "шт",
      price: "22 000 ₽",
    },
    {
      id: 6,
      name: "Техническое обслуживание (месяц)",
      code: "SV001",
      unit: "мес",
      price: "5 000 ₽",
    },
    {
      id: 7,
      name: "Консультация специалиста",
      code: "CS001",
      unit: "час",
      price: "3 500 ₽",
    },
  ];

  const contracts = [
    { id: "12345", name: "Договор №12345 на поставку оборудования" },
    { id: "12344", name: "Договор №12344 на техническое обслуживание" },
    { id: "12340", name: "Договор №12340 на разработку ПО" },
    { id: "12335", name: "Договор №12335 на консультационные услуги" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <h1 className="pl-4 md:pl-8 text-[20px] md:text-[28px] font-bold text-gray-800">
        Прайс-лист
      </h1>
      {/* Основное содержимое */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] p-6 md:p-8">
        {/* Заголовок страницы с фильтром */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h3 className="text-xl md:text-2xl font-medium text-gray-800">
              Прайс-лист
            </h3>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <span className="text-gray-600 whitespace-nowrap">Договор:</span>
              <select
                id="contract-select"
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-w-[250px] lg:min-w-[300px]"
              >
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Таблица прайс-листа */}
        <div className="overflow-x-auto animate-fadeIn">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 md:p-4 text-gray-700 font-semibold">
                  Номенклатура
                </th>
                <th className="text-left p-3 md:p-4 text-gray-700 font-semibold">
                  Код товара
                </th>
                <th className="text-left p-3 md:p-4 text-gray-700 font-semibold">
                  Единица измерения
                </th>
                <th className="text-left p-3 md:p-4 text-gray-700 font-semibold">
                  Цена
                </th>
              </tr>
            </thead>
            <tbody>
              {priceItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-3 md:p-4">{item.name}</td>
                  <td className="p-3 md:p-4 font-medium">{item.code}</td>
                  <td className="p-3 md:p-4 text-gray-600">{item.unit}</td>
                  <td className="p-3 md:p-4 font-semibold text-gray-800">
                    {item.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-gray-500">
            Всего позиций: {priceItems.length}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PricePage;
