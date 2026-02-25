import { sequelize } from '../config/database';

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