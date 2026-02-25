import { Router, Request, Response } from 'express';
import { Product } from '../models/product';

const router = Router();

// Create product
router.post('/', async (req: Request, res: Response) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ message: 'Product created', data: product });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error creating product' });
  }
});

// Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll();
    res.json({ data: products });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

export default router;