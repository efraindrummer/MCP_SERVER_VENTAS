import { Faker, es_MX, en } from '@faker-js/faker'; 

import { Client, ClientCreationAttributes } from '../models/client';

const faker = new Faker({ locale: [es_MX, en] });

export interface SeedClientOptions {
  count: number;
  progress?: (current: number, total: number) => void;
}

export const seedClients = async ({ 
  count, 
  progress 
}: SeedClientOptions): Promise<Client[]> => {
  console.log(`👥 Generando ${count} clientes...`);
  
  const clients: ClientCreationAttributes[] = [];
  
  for (let i = 0; i < count; i++) {
    clients.push({
      client_name: faker.person.fullName(),
      client_email: faker.internet.email().toLowerCase(),
      client_phone: faker.phone.number({ style: 'international' }),
      client_address: faker.location.streetAddress(true)
    });
    
    // Progreso cada 100 registros
    if (progress && (i + 1) % 100 === 0) {
      progress(i + 1, count);
    }
  }
  
  // Insertar en lotes de 100 para mejor rendimiento
  const batchSize = 100;
  const created: Client[] = [];
  
  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize);
    const results = await Client.bulkCreate(batch, { validate: true });
    created.push(...results);
  }
  
  console.log(`✅ ${created.length} clientes creados`);
  return created;
};

/**
 * Crea clientes específicos para testing
 */
export const createTestClients = async (): Promise<Client[]> => {
  const testClients = [
    {
      client_name: 'Juan Pérez García',
      client_email: 'juan.perez@test.com',
      client_phone: '+52 55 1234 5678',
      client_address: 'Av. Reforma 123, CDMX'
    },
    {
      client_name: 'María López Hernández',
      client_email: 'maria.lopez@test.com',
      client_phone: '+52 33 8765 4321',
      client_address: 'Blvd. Díaz Ordaz 456, Guadalajara'
    },
    {
      client_name: 'Carlos Ramírez Silva',
      client_email: 'carlos.ramirez@test.com',
      client_phone: '+52 81 2468 1357',
      client_address: 'Calle Juárez 789, Monterrey'
    },
    {
      client_name: 'Ana Martínez Torres',
      client_email: 'ana.martinez@test.com',
      client_phone: '+52 222 135 7924',
      client_address: 'Av. Universidad 321, Puebla'
    },
    {
      client_name: 'Empresa Demo S.A. de C.V.',
      client_email: 'contacto@empresademomx.test',
      client_phone: '+52 55 9999 0000',
      client_address: 'Torre Corporativa, Piso 15, CDMX'
    }
  ];
  
  return await Client.bulkCreate(testClients);
};