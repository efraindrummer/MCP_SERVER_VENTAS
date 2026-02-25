import { Sale, SaleDetail } from '../../models/sale';
import { Product } from '../../models/product';
import { Client } from '../../models/client';
import { sequelize } from '../../config/database';
import { DateRangeInput, PaginationInput, TopProductsInput } from '../utils/queryValidator';
import { QueryTypes } from 'sequelize';

/**
 * 📊 Resumen general de ventas
 */
export const getSalesSummary = async (): Promise<object> => {
  const [summary] = await sequelize.query(`
    SELECT 
      COUNT(DISTINCT s.sale_id) as total_sales,
      COUNT(DISTINCT s.client_id) as unique_clients,
      SUM(s.sale_total) as total_revenue,
      AVG(s.sale_total) as avg_ticket,
      MIN(s.sale_date) as first_sale,
      MAX(s.sale_date) as last_sale,
      COUNT(CASE WHEN s.sale_status = 'completed' THEN 1 END) as completed_sales,
      COUNT(CASE WHEN s.sale_status = 'pending' THEN 1 END) as pending_sales,
      COUNT(CASE WHEN s.sale_status = 'cancelled' THEN 1 END) as cancelled_sales
    FROM sales s
  `, { type: QueryTypes.SELECT });
  
  return {
    summary,
    generated_at: new Date().toISOString()
  };
};

/**
 * 📈 Ventas por rango de fechas
 */
export const getSalesByDateRange = async (
  input: DateRangeInput & PaginationInput
): Promise<object> => {
  const { start_date, end_date, page = 1, limit = 50 } = input;
  const offset = (page - 1) * limit;
  
  const whereClauses: string[] = [];
  const params: any[] = [];
  
  if (start_date) {
    whereClauses.push(`s.sale_date >= ?`);
    params.push(start_date);
  }
  if (end_date) {
    whereClauses.push(`s.sale_date <= ?`);
    params.push(end_date);
  }
  
  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  
  // Query principal con paginación
  const [sales, totalResult] = await Promise.all([
    sequelize.query(`
      SELECT 
        s.sale_id, s.sale_total, s.sale_status, s.sale_date,
        c.client_name, c.client_email
      FROM sales s
      JOIN clients c ON s.client_id = c.client_id
      ${whereSql}
      ORDER BY s.sale_date DESC
      LIMIT ? OFFSET ?
    `, { 
      replacements: [...params, limit, offset],
      type: QueryTypes.SELECT 
    }),
    
    sequelize.query(`
      SELECT COUNT(*) as count FROM sales s ${whereSql}
    `, {
      replacements: params,
      type: QueryTypes.SELECT
    })
  ]);
  
  const total = (totalResult as any)[0]?.count || 0;
  
  return {
    sales,
    pagination: {
      page,
      limit,
      total: Number(total),
      pages: Math.ceil(Number(total) / limit)
    },
    filters: { start_date, end_date }
  };
};

/**
 * 🏆 Productos más vendidos
 */
export const getTopProducts = async (input: TopProductsInput): Promise<object> => {
  const { limit = 10, min_sales = 1 } = input;
  
  const results = await sequelize.query(`
    SELECT 
      p.product_id,
      p.product_name,
      p.product_price,
      SUM(sd.detail_quantity) as units_sold,
      SUM(sd.detail_subtotal) as revenue_generated,
      COUNT(DISTINCT sd.sale_id) as times_sold
    FROM products p
    JOIN sale_details sd ON p.product_id = sd.product_id
    JOIN sales s ON sd.sale_id = s.sale_id
    WHERE s.sale_status = 'completed'
    GROUP BY p.product_id, p.product_name, p.product_price
    HAVING SUM(sd.detail_quantity) >= ?
    ORDER BY revenue_generated DESC
    LIMIT ?
  `, { 
    replacements: [min_sales, limit],
    type: QueryTypes.SELECT 
  });
  
  return {
    top_products: results,
    criteria: { limit, min_sales },
    generated_at: new Date().toISOString()
  };
};

/**
 * 📅 Ventas agrupadas por período (para gráficos)
 */
export const getRevenueByPeriod = async (
  period: 'day' | 'week' | 'month' = 'day',
  input: DateRangeInput
): Promise<object> => {
  const { start_date, end_date } = input;
  
  // Formato de agrupación según período
  const dateFormats: Record<string, string> = {
    day: 'DATE(s.sale_date)',
    week: "TO_CHAR(DATE_TRUNC('week', s.sale_date), 'YYYY-MM-DD')",
    month: "TO_CHAR(DATE_TRUNC('month', s.sale_date), 'YYYY-MM')"
  };
  
  const whereClauses: string[] = ["s.sale_status = 'completed'"];
  const params: any[] = [];
  
  if (start_date) {
    whereClauses.push(`s.sale_date >= ?`);
    params.push(start_date);
  }
  if (end_date) {
    whereClauses.push(`s.sale_date <= ?`);
    params.push(end_date);
  }
  
  const results = await sequelize.query(`
    SELECT 
      ${dateFormats[period]} as period,
      COUNT(*) as sales_count,
      SUM(s.sale_total) as total_revenue,
      AVG(s.sale_total) as avg_ticket
    FROM sales s
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY ${dateFormats[period]}
    ORDER BY period ASC
  `, { 
    replacements: params,
    type: QueryTypes.SELECT 
  });
  
  return {
    period,
    data: results,
    filters: { start_date, end_date }
  };
};

/**
 * 🔍 Búsqueda flexible de ventas
 */
export const searchSales = async (
  searchTerm: string,
  input: PaginationInput
): Promise<object> => {
  const { page = 1, limit = 50 } = input;
  const offset = (page - 1) * limit;
  
  const search = `%${searchTerm}%`;
  
  const [sales, totalResult] = await Promise.all([
    sequelize.query(`
      SELECT 
        s.sale_id, s.sale_total, s.sale_status, s.sale_date,
        c.client_name, c.client_email
      FROM sales s
      JOIN clients c ON s.client_id = c.client_id
      WHERE 
        c.client_name ILIKE ? OR 
        c.client_email ILIKE ? OR
        s.sale_id::text LIKE ?
      ORDER BY s.sale_date DESC
      LIMIT ? OFFSET ?
    `, { 
      replacements: [search, search, search, limit, offset],
      type: QueryTypes.SELECT 
    }),
    
    sequelize.query(`
      SELECT COUNT(*) as count 
      FROM sales s
      JOIN clients c ON s.client_id = c.client_id
      WHERE 
        c.client_name ILIKE ? OR 
        c.client_email ILIKE ? OR
        s.sale_id::text LIKE ?
    `, {
      replacements: [search, search, search],
      type: QueryTypes.SELECT
    })
  ]);
  
  const total = (totalResult as any)[0]?.count || 0;
  
  return {
    search_term: searchTerm,
    sales,
    pagination: {
      page,
      limit,
      total: Number(total),
      pages: Math.ceil(Number(total) / limit)
    }
  };
};