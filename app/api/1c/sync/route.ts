// ..Валидный код внизу это просто временная заглушка


import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log('1C -> ЛК:', JSON.stringify(body, null, 2));

  return NextResponse.json({
    status: 'ok',
    message: 'Запрос получен, но не сохранен. Так как это просто заглушка. Вот что пришло ============> ',
    receivedData: body, 
  });
}













// import { NextRequest, NextResponse } from 'next/server';
// import { getConnection } from '@/lib/db';
// import { RowDataPacket, ResultSetHeader } from 'mysql2';

// // const ONE_C_API_KEY = 'your-secure-hash-key-here-please-change-it';

// interface Product {
//   code: string;
//   name: string;
//   artice?: string;
//   active: boolean;
//   price: number;
// }

// interface Specification {
//   code: string;
//   name: string;
//   startDate: string;
//   endDate: string;
//   maxAmount: number;
//   active: boolean;
//   products?: Product[];
// }

// interface Contract {
//   code: string;
//   name: string;
//   startDate: string;
//   endDate: string;
//   maxAmount: number;
//   active: boolean;
//   specifications?: Specification[];
// }

// interface SyncRequest {
//   clientINN: string;
//   contracts: Contract[];
// }

// export async function POST(request: NextRequest) {
//   const connection = await getConnection();

//   try {
    
//     // const apiKey = request.headers.get('x-api-key');
//     // if (!apiKey || apiKey !== ONE_C_API_KEY) {
//     //   return NextResponse.json(
//     //     {
//     //       error: 'Неавторизованный доступ',
//     //       message: 'Неверный или отсутствующий API ключ',
//     //     },
//     //     { status: 401 },
//     //   );
//     // }

   
//     const body: SyncRequest = await request.json();

//     if (!body.clientINN || !body.contracts || !Array.isArray(body.contracts)) {
//       return NextResponse.json(
//         {
//           error: 'Неверный формат данных',
//           message: 'Ожидаются clientINN и contracts (массив)',
//         },
//         { status: 400 },
//       );
//     }

    
//     if (!/^\d{10,12}$/.test(body.clientINN)) {
//       return NextResponse.json(
//         {
//           error: 'Неверный формат ИНН',
//           message: 'ИНН должен содержать 10 или 12 цифр',
//         },
//         { status: 400 },
//       );
//     }

//     await connection.beginTransaction();

   
//     const [clients] = await connection.execute<RowDataPacket[]>(
//       `SELECT id, inn, name, active 
//        FROM users 
//        WHERE inn = ? AND role = 'client'`,
//       [body.clientINN],
//     );

//     if (clients.length === 0) {
//       await connection.rollback();
//       return NextResponse.json(
//         {
//           error: 'Клиент не найден',
//           message: `Клиент с ИНН ${body.clientINN} не зарегистрирован в системе`,
//         },
//         { status: 404 },
//       );
//     }

//     const clientId = clients[0].id;
//     const stats = {
//       clientINN: body.clientINN,
//       clientName: clients[0].name,
//       contractsUpdated: 0,
//       contractsCreated: 0,
//       specificationsUpdated: 0,
//       specificationsCreated: 0,
//       productsUpdated: 0,
//       productsCreated: 0,
//     };

    
//     for (const contractData of body.contracts) {
      
//       if (
//         !contractData.code ||
//         !contractData.name ||
//         !contractData.startDate ||
//         !contractData.endDate
//       ) {
//         console.warn(
//           `Пропущен договор с code=${contractData.code}: отсутствуют обязательные поля`,
//         );
//         continue;
//       }

     
//       const [existingContracts] = await connection.execute<RowDataPacket[]>(
//         'SELECT id FROM contracts WHERE code = ? AND client_id = ?',
//         [contractData.code, clientId],
//       );

//       let contractId: number;
//       const isNewContract = existingContracts.length === 0;

//       if (!isNewContract) {
        
//         await connection.execute(
//           `UPDATE contracts 
//            SET name = ?, 
//                start_date = ?, 
//                end_date = ?, 
//                amount = ?, 
//                active = ?
//            WHERE code = ? AND client_id = ?`,
//           [
//             contractData.name,
//             contractData.startDate,
//             contractData.endDate,
//             contractData.maxAmount,
//             contractData.active ? 1 : 0,
//             contractData.code,
//             clientId,
//           ],
//         );
//         contractId = existingContracts[0].id;
//         stats.contractsUpdated++;
//       } else {
       
//         const [result] = await connection.execute<ResultSetHeader>(
//           `INSERT INTO contracts (code, name, start_date, end_date, amount, active, client_id)
//            VALUES (?, ?, ?, ?, ?, ?, ?)`,
//           [
//             contractData.code,
//             contractData.name,
//             contractData.startDate,
//             contractData.endDate,
//             contractData.maxAmount,
//             contractData.active ? 1 : 0,
//             clientId,
//           ],
//         );
//         contractId = result.insertId;
//         stats.contractsCreated++;
//       }

     
//       if (
//         contractData.specifications &&
//         contractData.specifications.length > 0
//       ) {
//         for (const specData of contractData.specifications) {
          
//           if (
//             !specData.code ||
//             !specData.name ||
//             !specData.startDate ||
//             !specData.endDate
//           ) {
//             console.warn(
//               `Пропущена спецификация с code=${specData.code}: отсутствуют обязательные поля`,
//             );
//             continue;
//           }

         
//           const [existingSpecs] = await connection.execute<RowDataPacket[]>(
//             'SELECT id FROM specifications WHERE code = ? AND contract_id = ?',
//             [specData.code, contractId],
//           );

//           let specificationId: number;
//           const isNewSpec = existingSpecs.length === 0;

//           if (!isNewSpec) {
          
//             await connection.execute(
//               `UPDATE specifications 
//                SET name = ?, 
//                    start_date = ?, 
//                    end_date = ?, 
//                    amount = ?, 
//                    active = ?
//                WHERE code = ? AND contract_id = ?`,
//               [
//                 specData.name,
//                 specData.startDate,
//                 specData.endDate,
//                 specData.maxAmount,
//                 specData.active ? 1 : 0,
//                 specData.code,
//                 contractId,
//               ],
//             );
//             specificationId = existingSpecs[0].id;
//             stats.specificationsUpdated++;
//           } else {
           
//             const [result] = await connection.execute<ResultSetHeader>(
//               `INSERT INTO specifications (code, name, contract_id, start_date, end_date, amount, active)
//                VALUES (?, ?, ?, ?, ?, ?, ?)`,
//               [
//                 specData.code,
//                 specData.name,
//                 contractId,
//                 specData.startDate,
//                 specData.endDate,
//                 specData.maxAmount,
//                 specData.active ? 1 : 0,
//               ],
//             );
//             specificationId = result.insertId;
//             stats.specificationsCreated++;
//           }

          
//           if (specData.products && specData.products.length > 0) {
//             for (const productData of specData.products) {
              
//               if (!productData.code || !productData.name) {
//                 console.warn(
//                   `Пропущен товар с code=${productData.code}: отсутствуют обязательные поля`,
//                 );
//                 continue;
//               }

              
//               const [existingProducts] = await connection.execute<
//                 RowDataPacket[]
//               >('SELECT id FROM products WHERE code = ?', [productData.code]);

//               let productId: number;
//               const isNewProduct = existingProducts.length === 0;

//               if (!isNewProduct) {
                
//                 await connection.execute(
//                   `UPDATE products 
//                    SET name = ?, 
//                        article = ?, 
//                        price = ?, 
//                        active = ?
//                    WHERE code = ?`,
//                   [
//                     productData.name,
//                     productData.artice || null,
//                     productData.price,
//                     productData.active ? 1 : 0,
//                     productData.code,
//                   ],
//                 );
//                 productId = existingProducts[0].id;
//                 stats.productsUpdated++;
//               } else {
                
//                 const [result] = await connection.execute<ResultSetHeader>(
//                   `INSERT INTO products (code, name, article, price, active)
//                    VALUES (?, ?, ?, ?, ?)`,
//                   [
//                     productData.code,
//                     productData.name,
//                     productData.artice || null,
//                     productData.price,
//                     productData.active ? 1 : 0,
//                   ],
//                 );
//                 productId = result.insertId;
//                 stats.productsCreated++;
//               }

              
//               await connection.execute(
//                 `INSERT INTO specification_products (specification_id, product_id, price)
//                  VALUES (?, ?, ?)
//                  ON DUPLICATE KEY UPDATE price = VALUES(price)`,
//                 [specificationId, productId, productData.price],
//               );
//             }
//           }
//         }
//       }
//     }

//     await connection.commit();

//     return NextResponse.json(
//       {
//         success: true,
//         message: 'Данные успешно синхронизированы',
//         timestamp: new Date().toISOString(),
//         stats,
//       },
//       { status: 200 },
//     );
//   } catch (error) {
//     await connection.rollback();
//     console.error('Ошибка синхронизации с 1С:', error);

//     return NextResponse.json(
//       {
//         error: 'Внутренняя ошибка сервера',
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Неизвестная ошибка при синхронизации',
//       },
//       { status: 500 },
//     );
//   } finally {
//     await connection.end();
//   }
// }
