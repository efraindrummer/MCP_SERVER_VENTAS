import { Client } from '../../models/client';
import { Sale } from '../../models/sale';
import { sequelize } from '../../config/database';
import { QueryTypes } from 'sequelize';

/**
 * Resumen de clientes
 */
export const getClientsSummary = async (): Promise<object> => {
  const [stats] = await sequelize.query(`
    SELECT 
      COUNT(*) as total_clients,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_last_30_days,
      COUNT(DISTINCT CASE WHEN s.sale_id IS NOT NULL THEN c.client_id END) as clients_with_purchases,
      COUNT(DISTINCT CASE WHEN s.sale_id IS NULL THEN c.client_id END) as clients_without_purchases
    FROM clients c
    LEFT JOIN sales s ON c.client_id = s.client_id
  `, { type: QueryTypes.SELECT });
  
  return {
    summary: stats,
    generated_at: new Date().toISOString()
  };
};

/**
 * Mejores clientes por volumen de compras
 */
export const getTopClients = async (limit: number = 10): Promise<object> => {
  const results = await sequelize.query(`
    SELECT 
      c.client_id,
      c.client_name,
      c.client_email,
      COUNT(s.sale_id) as total_purchases,
      SUM(s.sale_total) as total_spent,
      AVG(s.sale_total) as avg_purchase,
      MAX(s.sale_date) as last_purchase
    FROM clients c
    JOIN sales s ON c.client_id = s.client_id
    WHERE s.sale_status = 'completed'
    GROUP BY c.client_id, c.client_name, c.client_email
    ORDER BY total_spent DESC
    LIMIT ?
  `, { 
    replacements: [limit],
    type: QueryTypes.SELECT 
  });
  
  return {
    top_clients: results,
    criteria: { status: 'completed', order_by: 'total_spent' },
    limit
  };
};

/**
 * Clientes por frecuencia de compra
 */
export const getClientsByPurchaseFrequency = async (): Promise<object> => {
  const results = await sequelize.query(`
    SELECT 
      CASE 
        WHEN purchase_count = 0 THEN '0_compras'
        WHEN purchase_count = 1 THEN '1_compra'
        WHEN purchase_count BETWEEN 2 AND 5 THEN '2-5_compras'
        WHEN purchase_count BETWEEN 6 AND 20 THEN '6-20_compras'
        ELSE '21+_compras'
      END as frequency_group,
      COUNT(*) as client_count,
      AVG(total_spent) as avg_total_spent
    FROM (
      SELECT 
        c.client_id,
        COUNT(s.sale_id) as purchase_count,
        COALESCE(SUM(s.sale_total), 0) as total_spent
      FROM clients c
      LEFT JOIN sales s ON c.client_id = s.client_id AND s.sale_status = 'completed'
      GROUP BY c.client_id
    ) as client_stats
    GROUP BY frequency_group
    ORDER BY MIN(purchase_count)
  `, { type: QueryTypes.SELECT });
  
  return {
    frequency_distribution: results,
    generated_at: new Date().toISOString()
  };
};