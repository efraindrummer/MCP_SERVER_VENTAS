import { sequelize } from '../config/database';

/**
 * Elimina tablas y FK constraints obsoletas de versiones anteriores.
 * Esto evita conflictos cuando la BD tiene restos de esquemas anteriores.
 */
export const dropStaleSchema = async (): Promise<void> => {
  console.log('🗑️  Eliminando esquema obsoleto...');

  // Eliminar FKs huérfanas en sales que apunten a tablas viejas
  const [rows] = await sequelize.query(`
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_class f ON f.oid = c.confrelid
    WHERE r.relname = 'sales' AND c.contype = 'f' AND f.relname != 'clients'
  `);
  const constraints = rows as { conname: string }[];

  for (const row of constraints) {
    await sequelize.query(`ALTER TABLE sales DROP CONSTRAINT IF EXISTS "${row.conname}"`);
    console.log(`  ✅ FK eliminada: ${row.conname}`);
  }

  // Eliminar tablas obsoletas si existen
  const staleTables = ['detalle_ventas', 'detail_sale', 'client'];
  for (const table of staleTables) {
    await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
  }

  console.log('✅ Esquema obsoleto eliminado');
};

/**
 * Limpia todas las tablas en orden inverso de dependencias
 */
export const clearTables = async (): Promise<void> => {
  console.log('🧹 Limpiando tablas...');

  // Orden importante: primero las que tienen foreign keys
  await sequelize.query('TRUNCATE TABLE sale_details RESTART IDENTITY CASCADE');
  await sequelize.query('TRUNCATE TABLE sales RESTART IDENTITY CASCADE');
  await sequelize.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
  await sequelize.query('TRUNCATE TABLE clients RESTART IDENTITY CASCADE');

  console.log('✅ Tablas limpiadas');
};

/**
 * Espera un tiempo aleatorio para simular carga real
 */
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Genera un número aleatorio entre min y max (inclusive)
 */
export const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Selecciona elementos aleatorios de un array
 */
export const randomSample = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};