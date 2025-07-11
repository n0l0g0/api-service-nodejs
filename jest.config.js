/**
 * Jest configuration สำหรับ API Service
 * กำหนดค่าการทดสอบสำหรับ Node.js Express API
 */

module.exports = {
    // สภาพแวดล้อมการทดสอบ
    testEnvironment: 'node',
    
    // กำหนด coverage threshold
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/index.js', // ไม่รวม entry point
      '!src/config/**', // ไม่รวม config files
      '!src/docs/**' // ไม่รวม documentation
    ],
    
    // กำหนดรูปแบบไฟล์ test - เพิ่ม src/**/*.test.js เพื่อรองรับไฟล์ test ใน src directory
    testMatch: [
      '**/tests/**/*.test.js',
      '**/tests/**/*.spec.js',
      '**/src/**/*.test.js',
      '**/src/**/*.spec.js'
    ],
    
    // Setup files สำหรับการทดสอบ
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    
    // Coverage threshold
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    },
    
    // กำหนด timeout สำหรับ async tests
    testTimeout: 10000,
    
    // กำหนด reporters - เอา jest-junit ออกเนื่องจากยังไม่ได้ติดตั้ง package นี้
    reporters: [
      'default'
    ],
    
    // Clear mocks หลังจากแต่ละ test
    clearMocks: true,
    
    // Restore mocks หลังจากแต่ละ test
    restoreMocks: true
  };