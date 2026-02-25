#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMCPServer } from './tools/index';
import dotenv from 'dotenv';

dotenv.config();

const startMCPServer = async () => {
  console.error('Iniciando MCP Server para Ventas...');
  
  try {
    // Crear servidor con herramientas
    const server = createMCPServer();
    
    // Conectar transporte stdio (para Claude Desktop)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('MCP Server listo. Esperando conexiones de Claude...');
    
    // Manejar cierre limpio
    process.on('SIGINT', async () => {
      console.error('Cerrando MCP Server...');
      await server.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error iniciando MCP Server:', error);
    process.exit(1);
  }
};

startMCPServer();