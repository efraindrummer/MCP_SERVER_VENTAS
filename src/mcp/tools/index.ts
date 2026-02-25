// src/mcp/tools/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { sequelize } from '../../config/database';
import { QueryTypes } from 'sequelize';

// Importar todas las herramientas
import * as salesTools from './salesTools';
import * as productsTools from './productsTools';
import * as clientsTools from './clientsTools';
import { Schemas, validateCustomQuery } from '../utils/queryValidator';

// Definición de herramientas MCP
export const TOOLS = [
  {
    name: 'get_sales_summary',
    description: 'Obtiene resumen estadístico general de todas las ventas: total vendido, tickets promedio, estado de ventas, etc.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_sales_by_date_range',
    description: 'Obtiene ventas filtradas por rango de fechas con paginación. Útil para reportes mensuales o personalizados.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', format: 'date', description: 'Fecha inicio (YYYY-MM-DD)' },
        end_date: { type: 'string', format: 'date', description: 'Fecha fin (YYYY-MM-DD)' },
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 }
      }
    }
  },
  {
    name: 'get_top_products',
    description: 'Obtiene los productos más vendidos por ingresos generados. Ideal para identificar bestsellers.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 10, description: 'Número de productos a retornar' },
        min_sales: { type: 'integer', minimum: 0, default: 1, description: 'Mínimo de ventas para incluir' }
      }
    }
  },
  {
    name: 'get_revenue_by_period',
    description: 'Obtiene ingresos agrupados por día/semana/mes para generar gráficos de tendencias.',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['day', 'week', 'month'], default: 'day' },
        start_date: { type: 'string', format: 'date' },
        end_date: { type: 'string', format: 'date' }
      }
    }
  },
  {
    name: 'search_sales',
    description: 'Busca ventas por nombre de cliente, email o ID de venta. Soporta búsqueda parcial.',
    inputSchema: {
      type: 'object',
      properties: {
        search_term: { type: 'string', description: 'Término a buscar (nombre, email o ID)' },
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 }
      },
      required: ['search_term']
    }
  },
  {
    name: 'get_inventory_status',
    description: 'Obtiene estado del inventario con alertas de productos con stock bajo o agotados.',
    inputSchema: {
      type: 'object',
      properties: {
        low_stock_threshold: { type: 'integer', minimum: 0, default: 10, description: 'Umbral para alertas de stock bajo' }
      }
    }
  },
  {
    name: 'get_products_by_price_range',
    description: 'Agrupa productos por rangos de precio para análisis de portafolio.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_products_turnover',
    description: 'Identifica productos con mayor rotación (ventas vs stock). Útil para decisiones de reorden.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 }
      }
    }
  },
  {
    name: 'get_clients_summary',
    description: 'Obtiene estadísticas generales de clientes: totales, nuevos, con/sin compras.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_top_clients',
    description: 'Obtiene los clientes que más han comprado por volumen total gastado.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 }
      }
    }
  },
  {
    name: 'get_clients_by_purchase_frequency',
    description: 'Agrupa clientes por frecuencia de compra para análisis de fidelidad.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'execute_custom_query',
    description: 'Ejecuta una consulta SELECT personalizada (solo lectura). Útil para reportes específicos no cubiertos por otras herramientas.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { 
          type: 'string', 
          description: 'Consulta SELECT válida. Solo lectura, sin operaciones de escritura.' 
        }
      },
      required: ['query']
    }
  }
];

/**
 * Helper seguro para extraer valores de args con tipado
 */
const getArg = <T>(args: Record<string, unknown> | undefined, key: string, defaultValue: T): T => {
  if (!args || !(key in args)) return defaultValue;
  const value = args[key];
  // Validación básica de tipos en runtime
  if (value === null || value === undefined) return defaultValue;
  return value as T;
};

/**
 * Crea y configura el servidor MCP
 */
export const createMCPServer = (): Server => {
  const server = new Server(
    { name: 'ventas-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // Listar herramientas disponibles
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS
  }));

  // Ejecutar herramienta solicitada
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      let result: any;
      
      switch (name) {
        // === Ventas ===
        case 'get_sales_summary':
          result = await salesTools.getSalesSummary();
          break;
          
        case 'get_sales_by_date_range':
          const dateInput = Schemas.dateRange.merge(Schemas.pagination).parse(args || {});
          result = await salesTools.getSalesByDateRange(dateInput);
          break;
          
        case 'get_top_products':
          const topInput = Schemas.topProducts.parse(args || {});
          result = await salesTools.getTopProducts(topInput);
          break;
          
        case 'get_revenue_by_period':
          //  Parsear period con Zod para tipo seguro
          const periodSchema = z.object({
            period: z.enum(['day', 'week', 'month']).default('day')
          });
          const { period } = periodSchema.parse(args || {});
          const periodInput = Schemas.dateRange.parse(args || {});
          result = await salesTools.getRevenueByPeriod(period, periodInput);
          break;
          
        case 'search_sales':
          //  Extraer searchTerm como string con validación
          const searchTerm = getArg<string>(args, 'search_term', '');
          if (!searchTerm) {
            throw new Error('El campo "search_term" es requerido');
          }
          const paginationInput = Schemas.pagination.parse(args || {});
          result = await salesTools.searchSales(searchTerm, paginationInput);
          break;
          
        // === Productos ===
        case 'get_inventory_status':
          //  Extraer threshold como número
          const threshold = getArg<number>(args, 'low_stock_threshold', 10);
          result = await productsTools.getInventoryStatus(threshold);
          break;
          
        case 'get_products_by_price_range':
          result = await productsTools.getProductsByPriceRange();
          break;
          
        case 'get_products_turnover':
          const turnoverInput = Schemas.topProducts.parse(args || {});
          result = await productsTools.getProductsTurnover(turnoverInput.limit);
          break;
          
        // === Clientes ===
        case 'get_clients_summary':
          result = await clientsTools.getClientsSummary();
          break;
          
        case 'get_top_clients':
          // Extraer limit como número
          const clientsLimit = getArg<number>(args, 'limit', 10);
          result = await clientsTools.getTopClients(clientsLimit);
          break;
          
        case 'get_clients_by_purchase_frequency':
          result = await clientsTools.getClientsByPurchaseFrequency();
          break;
          
        // === Query personalizada ===
        case 'execute_custom_query':
          // Extraer query como string y validar
          const query = getArg<string>(args, 'query', '');
          
          if (!query) {
            throw new Error('El campo "query" es requerido');
          }
          
          const validation = validateCustomQuery(query);
          if (!validation.valid) {
            throw new Error(validation.error || 'Consulta no válida');
          }
          
          // sequelize y QueryTypes ahora están importados
          result = await sequelize.query(query, { type: QueryTypes.SELECT });
          break;
          
        default:
          throw new Error(`Herramienta desconocida: ${name}`);
      }
      
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
      
    } catch (error: any) {
      console.error(`Error ejecutando herramienta ${name}:`, error);
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({ 
            error: error.message || 'Error interno del servidor',
            tool: name,
            timestamp: new Date().toISOString()
          }, null, 2) 
        }]
      };
    }
  });

  return server;
};