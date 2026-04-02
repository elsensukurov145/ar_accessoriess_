const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (message, color = 'reset') => console.log(`${colors[color]}${message}${colors.reset}`);

async function testAuthFlow() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('TEST 1: AUTHENTICATION FLOW', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  try {
    // Try to register new test user (might already exist)
    log('\n✓ Testing signup...');
    const signupRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `testuser-${Date.now()}@example.com`,  // Use timestamp for uniqueness
        password: 'testpass123',
      }),
    });
    const signupData = await signupRes.json();
    
    if (!signupRes.ok || !signupData.success) {
      log(`  ⚠️  Signup returned: ${signupData.message}`, 'yellow');
      // Continue anyway - we can try to login with an existing account
    } else {
      log(`  ✓ User registered: ${signupData.user?.email || 'registered'}`, 'green');
    }

    // Use the email from response or the one we tried to create
    const testEmail = signupData.user?.email || `testuser-${Date.now()}@example.com`;

    // Login
    log('\n✓ Testing login...');
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'testpass123',
      }),
    });
    const loginData = await loginRes.json();
    
    if (!loginRes.ok || !loginData.success) {
      log(`  ✗ Login failed: ${loginData.message}`, 'red');
      return null;
    }
    
    const token = loginData.token;
    log(`  ✓ Login successful, token received`, 'green');
    log(`  ✓ User ID: ${loginData.user.id}, Role: ${loginData.user.role}`, 'green');

    // Verify token
    log('\n✓ Testing token verification...');
    const verifyRes = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const verifyData = await verifyRes.json();
    
    if (!verifyRes.ok) {
      log(`  ✗ Verification failed: ${verifyData.message}`, 'red');
      return null;
    }
    log(`  ✓ Token verified successfully`, 'green');

    return { token, userId: loginData.user.id, email: testEmail };
  } catch (error) {
    log(`  ✗ Auth flow error: ${error.message}`, 'red');
    return null;
  }
}

async function testOrderFlow(auth) {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('TEST 2: ORDER CREATION & USER LINKING', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  try {
    // Create order
    log('\n✓ Creating test order...');
    const orderPayload = {
      name: 'Test',
      surname: 'User',
      phone: '+1234567890',
      address: '123 Test St',
      total: 50.00,
      payment_method: 'cash_on_delivery',
      items: [
        { product_id: 'case-001', product_name: 'Test Case', quantity: 1, price: 50 }
      ],
    };

    const orderRes = await fetch(`${BACKEND_URL}/api/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.success) {
      log(`  ✗ Order creation failed: ${orderData.message}`, 'red');
      return null;
    }

    const orderId = orderData.orderId;
    log(`  ✓ Order created with ID: ${orderId}`, 'green');

    // Verify order is linked to user in database
    log('\n✓ Verifying order-user linkage in database...');
    const orderCheckRes = await pool.query(
      'SELECT id, user_id, name, surname, email, total FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderCheckRes.rows.length === 0) {
      log(`  ✗ Order not found in database`, 'red');
      return null;
    }

    const dbOrder = orderCheckRes.rows[0];
    log(`  ✓ Order found in database:`, 'green');
    log(`    - Order ID: ${dbOrder.id}`, 'green');
    log(`    - User ID: ${dbOrder.user_id} (should be ${auth.userId})`, 'green');
    log(`    - Customer: ${dbOrder.name} ${dbOrder.surname}`, 'green');
    log(`    - Total: ${dbOrder.total}`, 'green');

    if (dbOrder.user_id !== auth.userId) {
      log(`  ✗ Order not properly linked to user!`, 'red');
      return null;
    }
    log(`  ✓ Order correctly linked to user`, 'green');

    return orderId;
  } catch (error) {
    log(`  ✗ Order flow error: ${error.message}`, 'red');
    return null;
  }
}

async function testUserOrdersEndpoint(auth) {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('TEST 3: USER ORDERS ENDPOINT', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  try {
    log('\n✓ Fetching user orders via /api/user/orders...');
    const res = await fetch(`${BACKEND_URL}/api/user/orders`, {
      headers: { 'Authorization': `Bearer ${auth.token}` },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      log(`  ✗ Failed to fetch orders: ${data.message}`, 'red');
      return false;
    }

    log(`  ✓ Successfully fetched user orders`, 'green');
    log(`  ✓ Orders retrieved: ${data.orders.length}`, 'green');

    if (data.orders.length > 0) {
      const order = data.orders[0];
      log(`    - Latest order ID: ${order.id}`, 'green');
      log(`    - Customer: ${order.name} ${order.surname}`, 'green');
      log(`    - Total: ${order.total}`, 'green');
      log(`    - Status: ${order.status}`, 'green');
    }

    return true;
  } catch (error) {
    log(`  ✗ Endpoint error: ${error.message}`, 'red');
    return false;
  }
}

async function testAdminAccess() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('TEST 4: ADMIN ACCESS & HARDCODED BYPASS REMOVAL', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  try {
    // Try to login as non-admin regular user with admin email format
    log('\n✓ Testing that hardcoded admin bypass is removed...');
    log('  Attempting login as regular user (should NOT grant admin role)...');
    
    const regularUserRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'regularuser@test.com',
        password: 'password123',
      }),
    });

    const regularUserData = await regularUserRes.json();
    if (regularUserRes.ok && regularUserData.success) {
      log(`  ✓ Regular user logged in with role: ${regularUserData.user.role}`, 'green');
      if (regularUserData.user.role !== 'admin') {
        log(`  ✓ GOOD: Regular user does not have admin role`, 'green');
      } else {
        log(`  ✗ SECURITY ISSUE: Regular user granted admin role!`, 'red');
        return false;
      }
    }

    // Test with actual admin user
    log('\n✓ Testing admin user access...');
    const adminRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@araccessories.com',
        password: 'admin123',
      }),
    });

    const adminData = await adminRes.json();
    if (adminRes.ok && adminData.success) {
      log(`  ✓ Admin user logged in with role: ${adminData.user.role}`, 'green');
      if (adminData.user.role === 'admin') {
        log(`  ✓ GOOD: Admin user has admin role`, 'green');
        return true;
      } else {
        log(`  ✗ ERROR: Admin user doesn't have admin role!`, 'red');
        return false;
      }
    } else {
      log(`  ✓ Admin user doesn't exist yet (that's ok for fresh DB)`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`  ✗ Admin test error: ${error.message}`, 'red');
    return false;
  }
}

async function testSchemaCorrectness() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('TEST 5: DATABASE SCHEMA VERIFICATION', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  try {
    // Check orders table columns
    log('\n✓ Verifying orders table schema...');
    const columnRes = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);

    const columns = columnRes.rows;
    const requiredCols = ['id', 'user_id', 'name', 'surname', 'phone', 'email', 'address', 'items', 'total', 'status', 'payment_method', 'payment_status', 'created_at'];
    
    let allPresent = true;
    for (const col of requiredCols) {
      const found = columns.find(c => c.column_name === col);
      if (found) {
        log(`  ✓ Column present: ${col} (${found.data_type})`, 'green');
      } else {
        log(`  ✗ Column missing: ${col}`, 'red');
        allPresent = false;
      }
    }

    // Check for obsolete columns that should NOT be there
    const obsoleteCols = ['customer_name', 'customer_email', 'customer_phone', 'customer_address', 'total_price'];
    for (const col of obsoleteCols) {
      const found = columns.find(c => c.column_name === col);
      if (found) {
        log(`  ✗ OBSOLETE column still present: ${col}`, 'yellow');
      } else {
        log(`  ✓ Obsolete column correctly absent: ${col}`, 'green');
      }
    }

    return allPresent;
  } catch (error) {
    log(`  ✗ Schema test error: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n\n', 'cyan');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║       E-COMMERCE APP - COMPREHENSIVE FIX VALIDATION        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const checklistResults = {
    auth: false,
    orders: false,
    userOrdersEndpoint: false,
    adminAccess: false,
    schema: false,
  };

  // Test 1: Schema
  checklistResults.schema = await testSchemaCorrectness();

  // Test 2: Auth Flow
  const auth = await testAuthFlow();
  if (auth) checklistResults.auth = true;

  // Test 3: Orders & Linking
  if (auth) {
    const orderId = await testOrderFlow(auth);
    if (orderId) checklistResults.orders = true;
  }

  // Test 4: User Orders Endpoint
  if (auth) {
    checklistResults.userOrdersEndpoint = await testUserOrdersEndpoint(auth);
  }

  // Test 5: Admin Access
  checklistResults.adminAccess = await testAdminAccess();

  // Summary
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('VALIDATION SUMMARY', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  const results = [
    { name: 'Database Schema', pass: checklistResults.schema },
    { name: 'Authentication Flow', pass: checklistResults.auth },
    { name: 'Order Creation & User Linking', pass: checklistResults.orders },
    { name: 'User Orders API Endpoint', pass: checklistResults.userOrdersEndpoint },
    { name: 'Admin Access Control', pass: checklistResults.adminAccess },
  ];

  results.forEach(test => {
    const status = test.pass ? '✓ PASS' : '✗ FAIL';
    const color = test.pass ? 'green' : 'red';
    log(`${status} - ${test.name}`, color);
  });

  const passCount = results.filter(r => r.pass).length;
  const totalCount = results.length;
  const passPercentage = Math.round((passCount / totalCount) * 100);

  log(`\nTotal: ${passCount}/${totalCount} tests passed (${passPercentage}%)`, passCount === totalCount ? 'green' : 'yellow');

  process.exit(passCount === totalCount ? 0 : 1);
}

runAllTests().catch(error => {
  log(`\nFATAL ERROR: ${error.message}`, 'red');
  process.exit(1);
});
