import { Product } from '../../models/product';
import { SaleDetail } from '../../models/sale';
import { sequelize } from '../../config/database';
import { QueryTypes } from 'sequelize';

/**
 * 📦 Inventario actual con alertas de stock bajo
 */
export const getInventoryStatus = async (lowStockThreshold: number = 10): Promise<object> => {
  const products = await Product.findAll({
    attributes: [
      'product_id',
      'product_name',
      'product_price',
      'product_stock',
      'product_image'
    ],
    order: [['product_stock', 'ASC']]
  });
  
  const lowStock = products.filter(p => p.product_stock <= lowStockThreshold);
  const outOfStock = products.filter(p => p.product_stock === 0);
  
  return {
    total_products: products.length,
    low_stock_alert: {
      threshold: lowStockThreshold,
      count: lowStock.length,
      products: lowStock.map(p => ({
        id: p.product_id,
        name: p.product_name,
        stock: p.product_stock,
        price: p.product_price
      }))
    },
    out_of_stock: outOfStock.map(p => ({
      id: p.product_id,
      name: p.product_name
    })),
    generated_at: new Date().toISOString()
  };
};

/**
 * 💰 Productos por categoría de precio
 */
export const getProductsByPriceRange = async (): Promise<object> => {
  const ranges = await sequelize.query(`
    SELECT 
      CASE 
        WHEN product_price < 100 THEN '0-99'
        WHEN product_price < 500 THEN '100-499'
        WHEN product_price < 2000 THEN '500-1999'
        WHEN product_price < 10000 THEN '2000-9999'
        ELSE '10000+'
      END as price_range,
      COUNT(*) as product_count,
      AVG(product_price) as avg_price,
      SUM(product_stock) as total_stock
    FROM products
    GROUP BY 
      CASE 
        WHEN product_price < 100 THEN '0-99'
        WHEN product_price < 500 THEN '100-499'
        WHEN product_price < 2000 THEN '500-1999'
        WHEN product_price < 10000 THEN '2000-9999'
        ELSE '10000+'
      END
    ORDER BY MIN(product_price)
  `, { type: QueryTypes.SELECT });
  
  return {
    price_ranges: ranges,
    currency: 'MXN'
  };
};

/**
 * 🔄 Productos con más rotación (ventas / stock)
 */
export const getProductsTurnover = async (limit: number = 10): Promise<object> => {
  const results = await sequelize.query(`
    SELECT 
      p.product_id,
      p.product_name,
      p.product_stock,
      COALESCE(SUM(sd.detail_quantity), 0) as total_sold,
      CASE 
        WHEN p.product_stock > 0 
        THEN ROUND(COALESCE(SUM(sd.detail_quantity), 0)::numeric / p.product_stock, 2)
        ELSE 999.99 
      END as turnover_ratio
    FROM products p
    LEFT JOIN sale_details sd ON p.product_id = sd.product_id
    LEFT JOIN sales s ON sd.sale_id = s.sale_id AND s.sale_status = 'completed'
    GROUP BY p.product_id, p.product_name, p.product_stock
    HAVING COALESCE(SUM(sd.detail_quantity), 0) > 0
    ORDER BY turnover_ratio DESC
    LIMIT ?
  `, { 
    replacements: [limit],
    type: QueryTypes.SELECT 
  });
  
  return {
    high_turnover_products: results,
    note: 'turnover_ratio = unidades vendidas / stock actual (mayor = más rotación)',
    limit
  };
};