const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

const initDb = async () => {
  try {
    console.log('Connecting to PostgreSQL to initialize tables...');

    // Drop only non-user tables to preserve user data
    await pool.query(`DROP TABLE IF EXISTS "order_items" CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS "orders" CASCADE;`);
    // Do NOT drop users table - preserve user accounts permanently
    await pool.query(`DROP TABLE IF EXISTS "products" CASCADE;`);

    // Create users table (only if it doesn't exist)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE products (
        id VARCHAR(100) PRIMARY KEY,
        name JSONB NOT NULL,
        description JSONB NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        discount_price NUMERIC(10, 2),
        category VARCHAR(100) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        colors JSONB DEFAULT '[]',
        in_stock BOOLEAN DEFAULT TRUE,
        stock INTEGER DEFAULT 10,
        specs JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create new orders table with user_id relationship
    await pool.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        surname VARCHAR(200) NOT NULL,
        phone VARCHAR(100) NOT NULL,
        email VARCHAR(200),
        address TEXT NOT NULL,
        items JSONB NOT NULL,
        total NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'manual',
        payment_status VARCHAR(50) DEFAULT 'pending',
        provider_name VARCHAR(100) DEFAULT 'manual',
        provider_transaction_id VARCHAR(255),
        provider_payment_url TEXT,
        stripe_session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Admin User (only if not exists)
    console.log('Seeding Admin User...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING`,
      ['admin@araccessories.com', adminPassword, 'admin']
    );

    // Seed Products
    console.log('Seeding Products...');
    const seedProducts = [
      {
        id: 'case-001',
        name: { az: 'Premium Silikon Keys — Qara', ru: 'Премиум Силиконовый Чехол — Чёрный', en: 'Premium Silicone Case — Black' },
        description: { az: 'Yüksək keyfiyyətli silikon material, əl yaxşı hiss edir.', ru: 'Высококачественный силикон.', en: 'High-quality silicone material.' },
        price: 25, discount_price: null, category: 'cases', image_url: '/products/case-black.jpg',
        colors: ['#1a1a1a', '#1e3a5f', '#8b0000'], in_stock: true, specs: { az: ['Material: Silikon'], ru: ['Материал: Силикон'], en: ['Material: Silicone'] }
      },
      {
        id: 'case-002',
        name: { az: 'Şəffaf Qoruyucu Keys', ru: 'Прозрачный Защитный Чехол', en: 'Clear Protective Case' },
        description: { az: 'Ultra şəffaf dizayn.', ru: 'Ультрапрозрачный дизайн.', en: 'Ultra-clear design.' },
        price: 20, discount_price: 15, category: 'cases', image_url: '/products/case-clear.jpg',
        colors: ['transparent'], in_stock: true, specs: { az: ['Material: TPU'], ru: ['Материал: ТПУ'], en: ['Material: TPU'] }
      },
      {
        id: 'case-003',
        name: { az: 'Premium Silikon Keys — Göy', ru: 'Премиум Силиконовый Чехол — Синий', en: 'Premium Silicone Case — Navy' },
        description: { az: 'Dərin göy rəngdə elegant dizayn.', ru: 'Элегантный дизайн глубокого синего цвета.', en: 'Elegant deep navy design.' },
        price: 30, discount_price: null, category: 'cases', image_url: '/products/case-navy.jpg',
        colors: ['#1e3a5f', '#1a1a1a', '#2d5016'], in_stock: true, specs: { az: ['Material: Silikon + MagSafe'], ru: ['Материал: Силикон + MagSafe'], en: ['Material: Silicone + MagSafe'] }
      },
      {
        id: 'case-004',
        name: { az: 'Dəri Keys — Qırmızı', ru: 'Кожаный Чехол — Красный', en: 'Leather Case — Red' },
        description: { az: 'Həqiqi dəridən hazırlanmış premium keys.', ru: 'Премиум чехол из натуральной кожи.', en: 'Premium case made from genuine leather.' },
        price: 45, discount_price: 35, category: 'cases', image_url: '/products/case-red.jpg',
        colors: ['#8b0000', '#4a2c2a', '#1a1a1a'], in_stock: true, specs: { az: ['Material: Həqiqi Dəri'], ru: ['Материал: Натуральная кожа'], en: ['Material: Genuine Leather'] }
      },
      {
        id: 'charger-001',
        name: { az: 'Simsiz Şarj Stansiyası', ru: 'Беспроводная Зарядная Станция', en: 'Wireless Charging Pad' },
        description: { az: '15W sürətli simsiz şarj.', ru: 'Быстрая беспроводная зарядка 15 Вт.', en: '15W fast wireless charging.' },
        price: 35, discount_price: null, category: 'chargers', image_url: '/products/charger-wireless.jpg',
        colors: ['#f5f5f5', '#1a1a1a'], in_stock: true, specs: { az: ['Güc: 15W'], ru: ['Мощность: 15 Вт'], en: ['Power: 15W'] }
      },
      {
        id: 'charger-002',
        name: { az: '20W USB-C Sürətli Adapter', ru: '20W USB-C Быстрый Адаптер', en: '20W USB-C Fast Charger' },
        description: { az: 'Kompakt dizaynlı 20W sürətli şarj adapteri.', ru: 'Компактный адаптер быстрой зарядки 20 Вт.', en: 'Compact 20W fast charging adapter.' },
        price: 18, discount_price: 14, category: 'chargers', image_url: '/products/charger-wall.jpg',
        colors: ['#f5f5f5', '#1a1a1a'], in_stock: true, specs: { az: ['Güc: 20W'], ru: ['Мощность: 20 Вт'], en: ['Power: 20W'] }
      },
      {
        id: 'charger-003',
        name: { az: 'Avtomobil Şarj Cihazı', ru: 'Автомобильное Зарядное Устройство', en: 'Car Charger' },
        description: { az: 'İkili USB portlu avtomobil şarj cihazı.', ru: 'Автомобильное зарядное с двумя USB-портами.', en: 'Dual USB port car charger.' },
        price: 22, discount_price: null, category: 'chargers', image_url: '/products/charger-car.jpg',
        colors: ['#1a1a1a'], in_stock: true, specs: { az: ['Güc: 36W (18W+18W)'], ru: ['Мощность: 36 Вт'], en: ['Power: 36W (18W+18W)'] }
      },
      {
        id: 'charger-004',
        name: { az: 'MagSafe Şarj Cihazı', ru: 'Зарядное устройство MagSafe', en: 'MagSafe Charger' },
        description: { az: 'Maqnit bağlantılı sürətli şarj.', ru: 'Быстрая зарядка с магнитным креплением.', en: 'Magnetic fast charging.' },
        price: 40, discount_price: 32, category: 'chargers', image_url: '/products/charger-magsafe.jpg',
        colors: ['#f5f5f5'], in_stock: false, specs: { az: ['Güc: 15W'], ru: ['Мощность: 15 Вт'], en: ['Power: 15W'] }
      },
      {
        id: 'cable-001',
        name: { az: 'USB-C Örmə Kabel — Qara', ru: 'USB-C Плетёный Кабель — Чёрный', en: 'USB-C Braided Cable — Black' },
        description: { az: 'Davamlı örmə dizaynlı USB-C kabel.', ru: 'Прочный плетёный USB-C кабель.', en: 'Durable braided USB-C cable.' },
        price: 12, discount_price: null, category: 'cables', image_url: '/products/cable-usbc-black.jpg',
        colors: ['#1a1a1a', '#f5f5f5', '#8b0000'], in_stock: true, specs: { az: ['Tip: USB-C to USB-A'], ru: ['Тип: USB-C to USB-A'], en: ['Type: USB-C to USB-A'] }
      },
      {
        id: 'cable-002',
        name: { az: 'Lightning Kabel — Ağ', ru: 'Lightning Кабель — Белый', en: 'Lightning Cable — White' },
        description: { az: 'MFi sertifikatlı Lightning kabel.', ru: 'Кабель Lightning с сертификатом MFi.', en: 'MFi certified Lightning cable.' },
        price: 15, discount_price: 10, category: 'cables', image_url: '/products/cable-lightning.jpg',
        colors: ['#f5f5f5'], in_stock: true, specs: { az: ['Tip: Lightning to USB-A'], ru: ['Тип: Lightning to USB-A'], en: ['Type: Lightning to USB-A'] }
      },
      {
        id: 'cable-003',
        name: { az: '3-ü 1-də Universal Kabel', ru: 'Универсальный Кабель 3-в-1', en: '3-in-1 Universal Cable' },
        description: { az: 'USB-C, Lightning və Micro-USB.', ru: 'USB-C, Lightning и Micro-USB.', en: 'USB-C, Lightning and Micro-USB.' },
        price: 18, discount_price: 13, category: 'cables', image_url: '/products/cable-3in1.jpg',
        colors: ['#1a1a1a', '#f5f5f5'], in_stock: true, specs: { az: ['Tip: 3-ü 1-də'], ru: ['Тип: 3-в-1'], en: ['Type: 3-in-1'] }
      }
    ];

    for (let p of seedProducts) {
      await pool.query(
        `INSERT INTO products (id, name, description, price, discount_price, category, image_url, colors, in_stock, stock, specs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [p.id, JSON.stringify(p.name), JSON.stringify(p.description), p.price, p.discount_price, p.category, p.image_url, JSON.stringify(p.colors), p.in_stock, p.stock || 10, JSON.stringify(p.specs)]
      );
    }

    console.log('✅ Database tables successfully initialized and seeded!');
  } catch (err) {
    console.error('❌ Error initializing database tables:', err);
  } finally {
    pool.end();
  }
};

initDb();
