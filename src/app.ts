import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models';

// Import models to register associations
import './models/client';
import './models/product';
import './models/sale';

// Import routes
import clientRoutes from './routes/client_routes';
import productRoutes from './routes/product_routes';
import saleRoutes from './routes/sale_routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
});

// Start server with database connection
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('CONEXIÓN EXITOSA A LA BASE DE DATOS');
    
    // Sync models (use migrations in production)
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('Base de datos sincronizada');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('error en startServer:', error);
    process.exit(1);
  }
};

startServer();