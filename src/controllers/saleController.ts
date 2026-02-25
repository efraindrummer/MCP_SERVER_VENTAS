import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { Sale, SaleDetail, SaleDetailCreationAttributes } from '../models/sale'; // ✅ PascalCase
import { Product } from '../models/product';
import { Client } from '../models/client';

// POST /api/sales - Create a new sale
export const createSale = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();

  try {
    const { client_id, products } = req.body;

    if (!client_id || !Array.isArray(products) || products.length === 0) {
      res.status(400).json({ error: 'client_id and products array are required' });
      return;
    }

    let total = 0;
    
    // ✅ FIX 1: Tipo explícito sin Partial para campos requeridos
    const detailsData: Array<Omit<SaleDetailCreationAttributes, 'detail_id'>> = [];

    for (const item of products) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      
      if (!product) {
        throw new Error(`Product with id ${item.product_id} not found`);
      }
      
      if (product.product_stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.product_name}`);
      }

      const subtotal = product.product_price * item.quantity;
      total += subtotal;

      await product.update(
        { product_stock: product.product_stock - item.quantity },
        { transaction: t }
      );

      // ✅ Todos los campos requeridos definidos (sin undefined)
      detailsData.push({
        sale_id: 0, // Se asignará después
        product_id: item.product_id, // ✅ number (no undefined)
        detail_quantity: item.quantity, // ✅ number
        detail_price: product.product_price, // ✅ number
        detail_subtotal: subtotal // ✅ number
      });
    }

    const sale = await Sale.create(
      { client_id, sale_total: total, sale_status: 'completed' },
      { transaction: t }
    );

    // ✅ FIX 2: Asignar sale_id y usar tipo compatible con bulkCreate
    const details = await SaleDetail.bulkCreate(
      detailsData.map(d => ({ ...d, sale_id: sale.sale_id })),
      { transaction: t }
    );

    await t.commit();

    const completeSale = await Sale.findByPk(sale.sale_id, {
      include: [
        { model: Client, as: 'client', attributes: ['client_id', 'client_name', 'client_email'] },
        { 
          model: SaleDetail, 
          as: 'details',
          include: [{ model: Product, as: 'product', attributes: ['product_id', 'product_name'] }]
        }
      ]
    });

    res.status(201).json({
      message: 'Sale created successfully',
      data: completeSale
    });

  } catch (error: any) {
    await t.rollback();
    console.error('Error creating sale:', error);
    res.status(400).json({ error: error.message || 'Error creating sale' });
  }
};

// GET /api/sales - Get all sales
export const getAllSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await Sale.findAll({
      include: [
        { model: Client, as: 'client', attributes: ['client_id', 'client_name', 'client_email'] },
        { 
          model: SaleDetail, 
          as: 'details',
          include: [{ model: Product, as: 'product', attributes: ['product_id', 'product_name', 'product_price'] }]
        }
      ],
      order: [['sale_date', 'DESC']]
    });

    res.json({ count: sales.length, data: sales });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Error fetching sales' });
  }
};

// GET /api/sales/:id - Get sale by ID
export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // ✅ FIX 3: Convertir string a number para findByPk
    const saleId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    
    if (isNaN(saleId)) {
      res.status(400).json({ error: 'Invalid sale ID' });
      return;
    }

    const sale = await Sale.findByPk(saleId, {
      include: [
        { model: Client, as: 'client' },
        { 
          model: SaleDetail, 
          as: 'details',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    res.json({ data: sale });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Error fetching sale' });
  }
};

// DELETE /api/sales/:id - Cancel a sale
export const cancelSale = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // ✅ FIX 4: Convertir string a number
    const saleId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    
    if (isNaN(saleId)) {
      res.status(400).json({ error: 'Invalid sale ID' });
      return;
    }

    const sale = await Sale.findByPk(saleId, { transaction: t });
    
    if (!sale) {
      await t.rollback();
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    if (sale.sale_status === 'cancelled') {
      await t.rollback();
      res.status(400).json({ error: 'Sale already cancelled' });
      return;
    }

    const details = await SaleDetail.findAll({ where: { sale_id: saleId }, transaction: t });
    
    for (const detail of details) {
      const product = await Product.findByPk(detail.product_id, { transaction: t });
      if (product) {
        await product.update(
          { product_stock: product.product_stock + detail.detail_quantity },
          { transaction: t }
        );
      }
    }

    await sale.update({ sale_status: 'cancelled' }, { transaction: t });
    
    await t.commit();
    res.json({ message: 'Sale cancelled successfully', data: sale });

  } catch (error: any) {
    await t.rollback();
    console.error('Error cancelling sale:', error);
    res.status(400).json({ error: error.message || 'Error cancelling sale' });
  }
};