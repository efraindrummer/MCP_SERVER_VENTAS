import { sequelize } from '../config/database';
import { Client } from './client';
import { Product } from './product';
import { Sale, SaleDetail } from './sale';

// Client ↔ Sale
Client.hasMany(Sale, { foreignKey: 'client_id', as: 'sales' });
Sale.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Sale ↔ SaleDetail
Sale.hasMany(SaleDetail, { foreignKey: 'sale_id', as: 'details' });
SaleDetail.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

// Product ↔ SaleDetail
Product.hasMany(SaleDetail, { foreignKey: 'product_id', as: 'saleDetails' });
SaleDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

export { sequelize, Client, Product, Sale, SaleDetail };