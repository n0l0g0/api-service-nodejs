/**
 * Test script สำหรับทดสอบ HttpOnly cookies functionality
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8081';

// สร้าง test JWT token
const createTestJWT = () => {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "test-user",
    username: "testUser", 
    email: "test@example.com",
    requiredDuo: false,
    duoVerified: false,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // หมดอายุใน 1 ชั่วโมง
  };
  
  // Simple base64 encoding (ไม่ได้ sign จริง - สำหรับ test อย่างเดียว)
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  return `${base64Header}.${base64Payload}.test-signature`;
};

async function testCookies() {
  console.log('🚀 Starting HttpOnly Cookies Test...\n');
  
  try {
    // Test 1: ตรวจสอบ debug endpoint
    console.log('1️⃣  Testing debug endpoint...');
    const debugResponse = await fetch(`${BASE_URL}/api/debug/cookies`);
    const debugResult = await debugResponse.json();
    console.log('Debug Response:', JSON.stringify(debugResult, null, 2));
    console.log('✅ Debug endpoint working\n');

    // Test 2: ตั้งค่า cookies
    console.log('2️⃣  Setting up authentication cookies...');
    const testToken = createTestJWT();
    console.log('Test JWT:', testToken.substring(0, 50) + '...');
    
    const setCookieResponse = await fetch(`${BASE_URL}/api/auth/cookies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: testToken
      })
    });
    
    const setCookieResult = await setCookieResponse.json();
    console.log('Set Cookie Response:', JSON.stringify(setCookieResult, null, 2));
    
    // ดึง Set-Cookie header
    const setCookieHeaders = setCookieResponse.headers.get('set-cookie');
    console.log('Set-Cookie Headers:', setCookieHeaders);
    console.log('✅ Cookie setting endpoint working\n');

    // Test 3: ทดสอบ auth health endpoint
    console.log('3️⃣  Testing auth health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/auth/health`);
    const healthResult = await healthResponse.json();
    console.log('Auth Health Response:', JSON.stringify(healthResult, null, 2));
    console.log('✅ Auth health endpoint working\n');

    // Test 4: แสดงวิธีใช้งานใน browser
    console.log('4️⃣  Browser Usage Examples:');
    console.log(`
// ใน browser console, ทดสอบดังนี้:

// 1. ตั้งค่า cookies
fetch('${BASE_URL}/api/auth/cookies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // สำคัญมาก!
  body: JSON.stringify({
    accessToken: '${testToken}'
  })
}).then(r => r.json()).then(console.log);

// 2. ตรวจสอบว่ามี cookies หรือไม่
fetch('${BASE_URL}/api/debug/cookies', {
  credentials: 'include' // สำคัญมาก!
}).then(r => r.json()).then(console.log);

// 3. ทดสอบ protected endpoint
fetch('${BASE_URL}/api/aircraft', {
  credentials: 'include' // สำคัญมาก!
}).then(r => r.json()).then(console.log);
    `);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// รัน test
testCookies(); 