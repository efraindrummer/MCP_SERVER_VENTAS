#!/usr/bin/env node
import { program } from 'commander';
import { runSeeds } from '../seeds';

program
  .name('seed')
  .description('Poblar la base de datos con datos de prueba')
  .option('-c, --clients <number>', 'Número de clientes', '100')
  .option('-p, --products <number>', 'Número de productos', '200')
  .option('-s, --sales <number>', 'Número de ventas', '500')
  .option('--no-test', 'No incluir datos de prueba específicos')
  .option('--no-clean', 'No limpiar tablas antes de sembrar')
  .action(async (options: { clients: string; products: string; sales: string; test: any; clean: any; }) => {
    await runSeeds({
      clients: parseInt(options.clients),
      products: parseInt(options.products),
      sales: parseInt(options.sales),
      includeTestData: options.test,
      clean: options.clean
    });
  });

program.parse();