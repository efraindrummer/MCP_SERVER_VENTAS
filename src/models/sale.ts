import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// ========== Sale Model ==========
export interface SaleAttributes {
  sale_id: number;
  client_id: number;
  sale_total: number;
  sale_status?: 'pending' | 'completed' | 'cancelled';
  sale_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface SaleCreationAttributes extends Optional<SaleAttributes, 'sale_id' | 'sale_date' | 'created_at' | 'updated_at'> {}

export class Sale extends Model<SaleAttributes, SaleCreationAttributes> implements SaleAttributes {
  public sale_id!: number;
  public client_id!: number;
  public sale_total!: number;
  public sale_status!: 'pending' | 'completed' | 'cancelled';
  public sale_date!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Sale.init(
  {
    sale_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'clients', key: 'client_id' }
    },
    sale_total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 }
    },
    sale_status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    sale_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'sales',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  }
);

// ========== SaleDetail Model ==========
export interface SaleDetailAttributes {
  detail_id: number;
  sale_id: number;
  product_id: number;
  detail_quantity: number;
  detail_price: number;
  detail_subtotal: number;
}

export interface SaleDetailCreationAttributes extends Optional<SaleDetailAttributes, 'detail_id'> {}

export class SaleDetail extends Model<SaleDetailAttributes, SaleDetailCreationAttributes> implements SaleDetailAttributes {
  public detail_id!: number;
  public sale_id!: number;
  public product_id!: number;
  public detail_quantity!: number;
  public detail_price!: number;
  public detail_subtotal!: number;
}

SaleDetail.init(
  {
    detail_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sale_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'sales', key: 'sale_id' }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'products', key: 'product_id' }
    },
    detail_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    detail_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 }
    },
    detail_subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 }
    }
  },
  {
    sequelize,
    tableName: 'sale_details',
    timestamps: false,
    underscored: true
  }
);