import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ClientAttributes {
  client_id: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ClientCreationAttributes extends Optional<ClientAttributes, 'client_id' | 'created_at' | 'updated_at'> {}

export class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
  public client_id!: number;
  public client_name!: string;
  public client_email!: string;
  public client_phone?: string;
  public client_address?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Client.init(
  {
    client_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    client_email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    client_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    client_address: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'clients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  }
);