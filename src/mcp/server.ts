#!/usr/bin/env node

// Silenciar stdout temporalmente: dotenv v17 imprime logs en stdout que rompen el protocolo MCP stdio
const _origWrite = process.stdout.write.bind(process.stdout);
(process.stdout.write as any) = () => true;

// Cargar dotenv y módulos (database.ts también llama dotenv.config())
require('dotenv').config();
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { createMCPServer } = require('./tools/index');

// Restaurar stdout para el protocolo MCP
process.stdout.write = _origWrite;

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