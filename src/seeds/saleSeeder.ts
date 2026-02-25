import { Faker, es_MX, en } from '@faker-js/faker';
import { Sale, SaleDetail, SaleCreationAttributes, SaleDetailCreationAttributes } from '../models/sale';
import { Client } from '../models/client';
import { Product } from '../models/product';
import { sequelize } from '../config/database';
import { randomInt, randomSample } from '../utils/seedHelpers';

const faker = new Faker({ locale: [es_MX, en] });

export interface SeedSaleOptions {
  count: number;
  clients: Client[];
  products: Product[];
  progress?: (current: number, total: number) => void;
}

export const seedSales = async ({ 
  count, 
  clients, 
  products, 
  progress 
}: SeedSaleOptions): Promise<Sale[]> => {
  console.log(`🛒 Generando ${count} ventas...`);
  
  if (clients.length === 0 || products.length === 0) {
    throw new Error('Se requieren clientes y productos para generar ventas');
  }
  
  const createdSales: Sale[] = [];
  
  for (let i = 0; i < count; i++) {
    const t = await sequelize.transaction();
    
    try {
      // Seleccionar cliente aleatorio
      const client = faker.helpers.arrayElement(clients);

      // Seleccionar 1-5 productos para esta venta
      const saleProducts = randomSample(products, randomInt(1, 5));
      
      let total = 0;
      const detailsData: Omit<SaleDetailCreationAttributes, 'detail_id'>[] = [];
      
      for (const product of saleProducts) {
        const quantity = randomInt(1, 3);
        const price = product.product_price;
        const subtotal = price * quantity;
        
        total += subtotal;
        
        detailsData.push({
          sale_id: 0, // Se asignará después
          product_id: product.product_id,
          detail_quantity: quantity,
          detail_price: price,
          detail_subtotal: subtotal
        });
        
        // Actualizar stock del producto
        await product.update(
          { product_stock: Math.max(0, product.product_stock - quantity) },
          { transaction: t }
        );
      }
      
      // Crear venta
      const sale = await Sale.create(
        {
          client_id: client.client_id,
          sale_total: parseFloat(total.toFixed(2)),
          sale_status: faker.helpers.arrayElement(['completed', 'completed', 'completed', 'pending'] as const),
          sale_date: faker.date.between({ from: '2023-01-01', to: new Date() })
        },
        { transaction: t }
      );
      
      // Crear detalles
      await SaleDetail.bulkCreate(
        detailsData.map(d => ({ ...d, sale_id: sale.sale_id })),
        { transaction: t }
      );
      
      await t.commit();
      createdSales.push(sale);
      
      if (progress && (i + 1) % 50 === 0) {
        progress(i + 1, count);
      }
      
    } catch (error) {
      await t.rollback();
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error creando venta ${i + 1}: ${msg}`);
      if (createdSales.length === 0 && i >= 2) {
        throw new Error(`Fallo repetido al crear ventas. Detalle: ${msg}`);
      }
    }
  }

  if (createdSales.length === 0) {
    throw new Error('No se pudo crear ninguna venta. Revisa los errores de arriba.');
  }

  console.log(`✅ ${createdSales.length} ventas creadas exitosamente`);
  return createdSales;
};

/**
 * Crea ventas específicas para testing con datos conocidos
 */
export const createTestSales = async (clients: Client[], products: Product[]): Promise<Sale[]> => {
  if (clients.length === 0 || products.length === 0) return [];
  
  const testSales = [
    {
      client: clients[0],
      items: [
        { product: products[0], quantity: 1 }, // Laptop
        { product: products[1], quantity: 2 }  // Mouse x2
      ],
      status: 'completed' as const
    },
    {
      client: clients[1],
      items: [
        { product: products[2], quantity: 1 }, // Teclado
        { product: products[3], quantity: 1 }, // Monitor
        { product: products[4], quantity: 1 }  // Audífonos
      ],
      status: 'completed' as const
    },
    {
      client: clients[2],
      items: [
        { product: products[5], quantity: 3 }, // Webcam x3
        { product: products[7], quantity: 2 }  // Hub x2
      ],
      status: 'pending' as const
    }
  ];
  
  const created: Sale[] = [];
  
  for (const testSale of testSales) {
    const t = await sequelize.transaction();
    
    try {
      let total = 0;
      const detailsData: Omit<SaleDetailCreationAttributes, 'detail_id'>[] = [];
      
      for (const item of testSale.items) {
        const subtotal = item.product.product_price * item.quantity;
        total += subtotal;
        
        detailsData.push({
          sale_id: 0,
          product_id: item.product.product_id,
          detail_quantity: item.quantity,
          detail_price: item.product.product_price,
          detail_subtotal: subtotal
        });
        
        await item.product.update(
          { product_stock: Math.max(0, item.product.product_stock - item.quantity) },
          { transaction: t }
        );
      }
      
      const sale = await Sale.create(
        {
          client_id: testSale.client.client_id,
          sale_total: parseFloat(total.toFixed(2)),
          sale_status: testSale.status,
          sale_date: faker.date.recent({ days: 30 })
        },
        { transaction: t }
      );
      
      await SaleDetail.bulkCreate(
        detailsData.map(d => ({ ...d, sale_id: sale.sale_id })),
        { transaction: t }
      );
      
      await t.commit();
      created.push(sale);
      
    } catch (error) {
      await t.rollback();
      console.error('Error creating test sale:', error);
    }
  }
  
  return created;
};