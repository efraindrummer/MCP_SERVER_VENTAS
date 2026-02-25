// Valida y sanitiza queries para prevenir inyección SQL
import { z } from 'zod';

// Palabras peligrosas que NO permitimos en queries custom
const DANGEROUS_PATTERNS = [
  /\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|REPLACE|GRANT|REVOKE)\b/i,
  /\b(UNION\s+SELECT|INSERT\s+INTO|UPDATE\s+\w+\s+SET)\b/i,
  /;\s*(DROP|DELETE|TRUNCATE)/i,
  /--|\#|\/\*|\*\//, // Comentarios SQL
];

export const validateCustomQuery = (query: string): { valid: boolean; error?: string } => {
  const trimmed = query.trim().toUpperCase();
  
  // Solo permitimos SELECT
  if (!trimmed.startsWith('SELECT')) {
    return { valid: false, error: 'Solo se permiten consultas SELECT' };
  }
  
  // Verificar patrones peligrosos
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(query)) {
      return { valid: false, error: 'Consulta contiene operaciones no permitidas' };
    }
  }
  
  // Limitar complejidad (evitar queries muy largas)
  if (query.length > 2000) {
    return { valid: false, error: 'Consulta demasiado larga (máx 2000 caracteres)' };
  }
  
  return { valid: true };
};

// ✅ Esquemas Zod compatibles con Zod v4
// Nota: .min() y .max() ahora requieren mensaje de error como segundo parámetro
export const Schemas = {
  dateRange: z.object({
    start_date: z.string().date().optional(),
    end_date: z.string().date().optional(),
  }),
  
  pagination: z.object({
    page: z.number().int({ message: 'Debe ser un número entero' }).gte(1, { message: 'Mínimo 1' }).default(1),
    limit: z.number().int({ message: 'Debe ser un número entero' }).gte(1, { message: 'Mínimo 1' }).lte(100, { message: 'Máximo 100' }).default(50),
  }),
  
  customQuery: z.object({
    query: z.string().refine((q) => validateCustomQuery(q).valid, {
      message: 'Consulta SQL no válida o no permitida'
    }),
    params: z.record(z.unknown()).optional(),
  }),
  
  topProducts: z.object({
    limit: z.number().int({ message: 'Debe ser un número entero' }).gte(1, { message: 'Mínimo 1' }).lte(20, { message: 'Máximo 20' }).default(10),
    min_sales: z.number().int({ message: 'Debe ser un número entero' }).gte(0, { message: 'No puede ser negativo' }).default(1),
  }),
};

// ✅ Tipos inferidos
export type DateRangeInput = z.infer<typeof Schemas.dateRange>;
export type PaginationInput = z.infer<typeof Schemas.pagination>;
export type CustomQueryInput = z.infer<typeof Schemas.customQuery>;
export type TopProductsInput = z.infer<typeof Schemas.topProducts>;