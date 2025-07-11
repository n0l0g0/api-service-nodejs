/**
 * Routes สำหรับจัดการ Authentication ด้วย HttpOnly Cookies
 * รองรับการทำงานร่วมกับ auth-service-nodejs
 * @module routes/auth-routes
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validators');
const { 
  verifyToken, 
  optionalAuth, 
  requireCookieAuth 
} = require('../middleware/auth');
const {
  verifyAuthStatus,
  setAuthCookies,
  logout,
  getUserProfile,
  healthCheck
} = require('../controllers/auth-controller');

/**
 * POST /auth/cookies
 * ตั้งค่า authentication cookies จาก access token
 * ใช้สำหรับการรับ token จาก auth service และแปลงเป็น HttpOnly cookies
 */
router.post('/cookies',
  [
    body('accessToken')
      .notEmpty()
      .withMessage('Access token is required')
      .isJWT()
      .withMessage('Access token must be a valid JWT'),
    body('refreshToken')
      .optional()
      .isJWT()
      .withMessage('Refresh token must be a valid JWT if provided')
  ],
  validate, // ตรวจสอบ validation errors
  setAuthCookies
);

/**
 * GET /auth/verify
 * ตรวจสอบสถานะการเข้าสู่ระบบจาก HttpOnly cookies
 * ใช้สำหรับ frontend ตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่
 */
router.get('/verify',
  verifyToken, // ต้อง authenticate ก่อน
  verifyAuthStatus
);

/**
 * GET /auth/profile
 * ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
 * ใช้ได้ทั้ง cookies และ Authorization header
 */
router.get('/profile',
  verifyToken, // ต้อง authenticate ก่อน
  getUserProfile
);

/**
 * POST /auth/logout
 * ล็อกเอาต์และลบ authentication cookies
 * ต้องใช้ HttpOnly cookies เท่านั้น (เพื่อความปลอดภัย)
 */
router.post('/logout',
  requireCookieAuth, // บังคับให้ใช้ cookies เท่านั้น
  logout
);

/**
 * GET /auth/health
 * ตรวจสอบสถานะ health ของระบบ authentication
 * สามารถเรียกได้โดยไม่ต้องล็อกอิน แต่จะแสดงข้อมูลเพิ่มเติมถ้าล็อกอินแล้ว
 */
router.get('/health',
  optionalAuth, // authentication เป็น optional
  healthCheck
);

/**
 * GET /auth/status
 * Alias สำหรับ /auth/verify เพื่อความสะดวก
 */
router.get('/status',
  verifyToken,
  verifyAuthStatus
);

module.exports = router; 