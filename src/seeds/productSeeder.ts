import { Faker, es_MX, en } from '@faker-js/faker'; // ✅ Agregar 'en' para fallback
import { Product, ProductCreationAttributes } from '../models/product';

// ✅ Faker con múltiples locales: es_MX primero, en como respaldo
const faker = new Faker({ locale: [es_MX, en] });

// Categorías de productos (sin cambios)
const PRODUCT_CATEGORIES = [
  { name: 'Electrónica', priceRange: [50, 50000], stockRange: [5, 100] },
  { name: 'Hogar', priceRange: [20, 5000], stockRange: [10, 200] },
  { name: 'Ropa', priceRange: [30, 3000], stockRange: [20, 500] },
  { name: 'Deportes', priceRange: [40, 15000], stockRange: [5, 150] },
  { name: 'Alimentos', priceRange: [10, 500], stockRange: [50, 1000] },
  { name: 'Oficina', priceRange: [15, 2000], stockRange: [10, 300] },
  { name: 'Juguetes', priceRange: [25, 2000], stockRange: [15, 250] },
  { name: 'Belleza', priceRange: [30, 1500], stockRange: [20, 400] }
] as const;

// Nombres específicos de productos por categoría
const PRODUCT_NAMES: Record<string, string[]> = {
  'Electrónica': [
    'Smartphone Galaxy Pro', 'Laptop UltraBook 15"', 'Audífonos Bluetooth Noise-Cancel',
    'Smart TV 55" 4K', 'Tablet Pro 11"', 'Cámara DSLR Profesional',
    'Consola de Videojuegos Next-Gen', 'Smartwatch Fitness Pro', 'Parlante Portable Waterproof',
    'Teclado Mecánico RGB Gaming'
  ],
  'Hogar': [
    'Juego de Sartenes Antiadherentes', 'Licuadora de Alta Potencia', 'Aspiradora Robot Inteligente',
    'Juego de Sábanas Premium', 'Lámpara LED Inteligente', 'Organizador de Closet Modular',
    'Cafetera Espresso Automática', 'Purificador de Aire HEPA', 'Juego de Toallas Egipcio',
    'Termo Eléctrico 50L'
  ],
  'Ropa': [
    'Jeans Slim Fit Premium', 'Camisa Oxford de Algodón', 'Vestido Casual Verano',
    'Chaqueta Impermeable', 'Zapatillas Deportivas Running', 'Bolso de Cuero Genuino',
    'Suéter de Lana Merino', 'Shorts Deportivos Dry-Fit', 'Abrigo de Invierno Acolchado',
    'Calcetines Técnicos (Pack 6)'
  ],
  'Deportes': [
    'Bicicleta de Montaña 29"', 'Pesas Ajustables 20kg', 'Tapete de Yoga Antideslizante',
    'Balón de Fútbol Profesional', 'Raqueta de Tenis Carbono', 'Mochila de Hidratación 2L',
    'Cuerda de Saltar Speed', 'Guantes de Boxeo Pro', 'Gafas de Natación Anti-empañante',
    'Banda de Resistencia Set (5 niveles)'
  ],
  'Alimentos': [
    'Café de Especialidad 500g', 'Aceite de Oliva Extra Virgen 1L', 'Miel Orgánica 750ml',
    'Chocolate Artesanal 70% Cacao', 'Nueces Mix Premium 500g', 'Té Verde Matcha Grado Ceremonial',
    'Salsa Picante Artesanal', 'Granola Casera con Frutos Secos', 'Quinoa Orgánica 1kg',
    'Aceitunas Rellenas Premium'
  ],
  'Oficina': [
    'Silla Ergonómica Ejecutiva', 'Escritorio Ajustable en Altura', 'Monitor 27" 4K IPS',
    'Webcam HD 1080p con Micrófono', 'Hub USB-C 7 en 1', 'Organizador de Escritorio Bambú',
    'Bloc de Notas Premium A5', 'Bolígrafos Gel (Pack 12)', 'Lámpara de Escritorio LED',
    'Alfombrilla Ergonómica con Gel'
  ],
  'Juguetes': [
    'Set de Construcción 500 piezas', 'Muñeca Interactiva con Accesorios', 'Juego de Mesa Estratégico',
    'Robot Educativo Programable', 'Pista de Carreras Eléctrica', 'Kit de Ciencia para Niños',
    'Peluche Gigante Suave', 'Rompecabezas 1000 piezas', 'Disfraz de Superhéroe Deluxe',
    'Consola Retro con 200 Juegos'
  ],
  'Belleza': [
    'Serum Facial con Vitamina C', 'Paleta de Sombras 24 Colores', 'Secadora de Cabello Iónica',
    'Kit de Manicure Profesional', 'Perfume Eau de Parfum 100ml', 'Crema Hidratante SPF 50',
    'Set de Brochas de Maquillaje (12 pcs)', 'Máscara Facial de Carbón (Pack 10)',
    'Aceite Esencial de Lavanda', 'Exfoliante Corporal de Café'
  ]
};

// ✅ Descripciones genéricas en español (fallback manual)
const GENERIC_DESCRIPTIONS = [
  'Producto de alta calidad con garantía de satisfacción.',
  'Diseñado para ofrecer el mejor rendimiento en su categoría.',
  'Fabricado con materiales premium y atención al detalle.',
  'Ideal para uso diario, duradero y confiable.',
  'Combina funcionalidad y estilo en un solo producto.',
  'Recomendado por expertos y usuarios satisfechos.',
  'Tecnología avanzada para mejorar tu experiencia.',
  'Excelente relación calidad-precio, ¡no te lo pierdas!',
  'Perfecto para regalar o para uso personal.',
  'Disponible en diferentes variantes para adaptarse a tus necesidades.'
];

export interface SeedProductOptions {
  count: number;
  progress?: (current: number, total: number) => void;
}

export const seedProducts = async ({ 
  count, 
  progress 
}: SeedProductOptions): Promise<Product[]> => {
  console.log(`📦 Generando ${count} productos...`);
  
  const products: ProductCreationAttributes[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = PRODUCT_CATEGORIES[randomInt(0, PRODUCT_CATEGORIES.length - 1)];
    const names = PRODUCT_NAMES[category.name];
    const baseName = names[randomInt(0, names.length - 1)];
    
    // Variar ligeramente el nombre para evitar duplicados
    const variant = faker.helpers.arrayElement(['', ' Pro', ' Plus', ' Elite', ' Max', ' Lite']);
    
    // ✅ Usar descripción con fallback seguro
    let description: string;
    try {
      // Intentar usar commerce.productDescription (puede fallar en es_MX)
      description = faker.commerce.productDescription();
    } catch {
      // Fallback a descripción genérica en español
      description = faker.helpers.arrayElement(GENERIC_DESCRIPTIONS);
    }
    
    products.push({
      product_name: `${baseName}${variant}`,
      product_description: description,
      product_price: parseFloat(faker.commerce.price({ 
        min: category.priceRange[0], 
        max: category.priceRange[1], 
        dec: 2 
      })),
      product_stock: randomInt(category.stockRange[0], category.stockRange[1]),
      product_image: faker.image.urlLoremFlickr({ 
        category: faker.helpers.arrayElement(['technology', 'fashion', 'food', 'sports']), 
        width: 400, 
        height: 400 
      })
    });
    
    if (progress && (i + 1) % 100 === 0) {
      progress(i + 1, count);
    }
  }
  
  // Insertar en lotes
  const batchSize = 100;
  const created: Product[] = [];
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const results = await Product.bulkCreate(batch, { validate: true });
    created.push(...results);
  }
  
  console.log(`✅ ${created.length} productos creados`);
  return created;
};

// ... (el resto del archivo: createTestProducts y randomInt se mantienen igual)

export const createTestProducts = async (): Promise<Product[]> => {
  const testProducts = [
    {
      product_name: 'Laptop Dell XPS 15',
      product_description: 'Laptop profesional con procesador Intel i7, 16GB RAM, 512GB SSD',
      product_price: 24999.99,
      product_stock: 15,
      product_image: 'https://picsum.photos/seed/laptop1/400/400'
    },
    {
      product_name: 'Mouse Logitech MX Master 3',
      product_description: 'Mouse inalámbrico ergonómico para productividad',
      product_price: 1899.00,
      product_stock: 45,
      product_image: 'https://picsum.photos/seed/mouse1/400/400'
    },
    {
      product_name: 'Teclado Mecánico Keychron K2',
      product_description: 'Teclado mecánico inalámbrico con switches Gateron',
      product_price: 2299.00,
      product_stock: 30,
      product_image: 'https://picsum.photos/seed/keyboard1/400/400'
    },
    {
      product_name: 'Monitor LG UltraWide 34"',
      product_description: 'Monitor curvo 3440x1440, 144Hz, HDR10',
      product_price: 8999.00,
      product_stock: 12,
      product_image: 'https://picsum.photos/seed/monitor1/400/400'
    },
    {
      product_name: 'Audífonos Sony WH-1000XM5',
      product_description: 'Audífonos con cancelación de ruido líder en la industria',
      product_price: 6499.00,
      product_stock: 25,
      product_image: 'https://picsum.photos/seed/headphones1/400/400'
    },
    {
      product_name: 'Webcam Logitech C920',
      product_description: 'Cámara web Full HD 1080p con micrófono estéreo',
      product_price: 1599.00,
      product_stock: 50,
      product_image: 'https://picsum.photos/seed/webcam1/400/400'
    },
    {
      product_name: 'SSD Samsung 970 EVO 1TB',
      product_description: 'Unidad de estado sólido NVMe M.2 de alta velocidad',
      product_price: 2199.00,
      product_stock: 40,
      product_image: 'https://picsum.photos/seed/ssd1/400/400'
    },
    {
      product_name: 'Hub USB-C Anker 7 en 1',
      product_description: 'Adaptador multipuerto con HDMI, USB 3.0, lector SD',
      product_price: 899.00,
      product_stock: 60,
      product_image: 'https://picsum.photos/seed/hub1/400/400'
    }
  ];
  
  return await Product.bulkCreate(testProducts);
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}