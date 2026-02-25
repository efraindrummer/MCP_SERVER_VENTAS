import { Router } from 'express';
import { cancelSale, createSale, getAllSales, getSaleById } from '../controllers/saleController';


const router = Router();

router.post('/', createSale);
router.get('/', getAllSales);
router.get('/:id', getSaleById);
router.delete('/:id/cancel', cancelSale);


export default router;