/**
 * Jest setup file สำหรับการตั้งค่าการทดสอบ
 * กำหนดค่าเริ่มต้นและ mock functions ที่ใช้ร่วมกัน
 */

require('dotenv').config({ path: '.env.test' });

// Mock logger เพื่อไม่ให้แสดง log ขณะ test
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// ตั้งค่า environment variables สำหรับการทดสอบ
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.DB_DATABASE = 'test_aircraft_management';
process.env.DB_USERNAME = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.FRONTEND_URL = 'http://localhost:3000';

// ตั้งค่า timeout เริ่มต้น
jest.setTimeout(10000);

// Mock uuid สำหรับให้ผลลัพธ์คงที่ในการทดสอบ
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234-5678-9012')
}));

// ฟังก์ชันช่วยสำหรับการทดสอบ
global.testHelpers = {
  /**
   * สร้าง mock request object
   * @param {Object} options - ตัวเลือกสำหรับ request
   * @returns {Object} mock request object
   */
  createMockRequest: (options = {}) => ({
    body: {},
    params: {},
    query: {},
    cookies: {},
    headers: {},
    user: null,
    ...options
  }),

  /**
   * สร้าง mock response object
   * @returns {Object} mock response object
   */
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    return res;
  },

  /**
   * สร้าง mock next function
   * @returns {Function} mock next function
   */
  createMockNext: () => jest.fn()
};

// ล้างค่า console warnings ในการทดสอบ
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // ซ่อน warnings ที่ไม่จำเป็นในการทดสอบ
  const warningMessage = args[0];
  if (
    typeof warningMessage === 'string' && 
    (warningMessage.includes('deprecated') || 
     warningMessage.includes('experimental'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};