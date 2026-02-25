import { Router, Request, Response } from 'express';
import { Client } from '../models/client';

const router = Router();

// Create client
router.post('/', async (req: Request, res: Response) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json({ message: 'Client created', data: client });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error creating client' });
  }
});

// Get all clients
router.get('/', async (req: Request, res: Response) => {
  try {
    const clients = await Client.findAll();
    res.json({ data: clients });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching clients' });
  }
});

export default router;