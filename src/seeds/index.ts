import dotenv from 'dotenv';
import { sequelize } from '../config/database';
import { clearTables, dropStaleSchema } from '../utils/seedHelpers';
import { seedClients, createTestClients } from './clientSeeder';
import { seedProducts, createTestProducts } from './productSeeder';
import { seedSales, createTestSales } from './saleSeeder';
// Registrar modelos y asociaciones antes de hacer cualquier operación
import '../models/index';

dotenv.config();

interface SeedOptions {
  /** Número de clientes a generar (default: 100) */
  clients?: number;
  /** Número de productos a generar (default: 200) */
  products?: number;
  /** Número de ventas a generar (default: 500) */
  sales?: number;
  /** Crear datos específicos para testing */
  includeTestData?: boolean;
  /** Limpiar tablas antes de sembrar */
  clean?: boolean;
}

const DEFAULT_OPTIONS: Required<SeedOptions> = {
  clients: 100,
  products: 200,
  sales: 500,
  includeTestData: true,
  clean: true
};

/**
 * Barra de progreso simple en consola
 */
const showProgress = (current: number, total: number, label: string) => {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round((percent / 100) * 20);
  const empty = 20 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  process.stdout.write(`\r${label} [${bar}] ${percent}% (${current}/${total})`);
  if (current === total) process.stdout.write('\n');
};

/**
 * Función principal para ejecutar todos los seeds
 */
export const runSeeds = async (options: SeedOptions = {}): Promise<void> => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  console.log('🌱 Iniciando población de base de datos...\n');
  console.log(`Configuración:
  👥 Clientes: ${config.clients}
  📦 Productos: ${config.products}
  🛒 Ventas: ${config.sales}
  🧪 Datos de test: ${config.includeTestData ? 'Sí' : 'No'}
  🧹 Limpiar antes: ${config.clean ? 'Sí' : 'No'}
  `);
  
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a BD establecida\n');

    // Eliminar tablas/FKs obsoletas de versiones anteriores
    await dropStaleSchema();

    // Sincronizar esquema (crea tablas si no existen, no borra datos)
    await sequelize.sync({ force: false });
    console.log('✅ Esquema sincronizado\n');

    // Limpiar tablas si se solicita
    if (config.clean) {
      await clearTables();
      console.log('');
    }
    
    // 1. Crear clientes
    const clients = await seedClients({
      count: config.clients,
      progress: (curr, total) => showProgress(curr, total, '👥 Clientes')
    });
    
    // 2. Crear productos
    const products = await seedProducts({
      count: config.products,
      progress: (curr, total) => showProgress(curr, total, '📦 Productos')
    });
    
    // 3. Crear ventas
    const sales = await seedSales({
      count: config.sales,
      clients,
      products,
      progress: (curr, total) => showProgress(curr, total, '🛒 Ventas')
    });
    
    // 4. Datos específicos para testing (opcional)
    if (config.includeTestData) {
      console.log('\n Creando datos de prueba específicos...');
      
      const testClients = await createTestClients();
      const testProducts = await createTestProducts();
      await createTestSales(testClients, testProducts);
      
      console.log('Datos de prueba creados');
    }
    
    // Resumen final
    console.log('\n📊 Resumen de población:');
    console.log(`  👥 Total clientes: ${clients.length}`);
    console.log(`  📦 Total productos: ${products.length}`);
    console.log(`  🛒 Total ventas: ${sales.length}`);
    
    // Calcular estadísticas básicas
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.sale_total), 0);
    console.log(`  💰 Ingresos totales: $${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    
    console.log('\n¡Población completada exitosamente!');
    
  } catch (error) {
    console.error('Error durante la población:', error);
    throw error;
  } finally {
    // Cerrar conexión
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  runSeeds({
    clients: parseInt(process.env.SEED_CLIENTS || '100'),
    products: parseInt(process.env.SEED_PRODUCTS || '200'),
    sales: parseInt(process.env.SEED_SALES || '500'),
    includeTestData: process.env.SEED_TEST_DATA !== 'false',
    clean: process.env.SEED_CLEAN !== 'false'
  })
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
}