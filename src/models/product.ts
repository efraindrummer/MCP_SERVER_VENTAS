import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ProductAttributes {
  product_id: number;
  product_name: string;
  product_description?: string;
  product_price: number;
  product_stock: number;
  product_image?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'product_id' | 'created_at' | 'updated_at'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public product_id!: number;
  public product_name!: string;
  public product_description?: string;
  public product_price!: number;
  public product_stock!: number;
  public product_image?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Product.init(
  {
    product_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    product_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    product_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 }
    },
    product_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    product_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  }
);