/**
 * ไฟล์หลักสำหรับจัดการเส้นทาง (routes) ทั้งหมดในแอปพลิเคชัน
 * อัปเดตให้รองรับ HttpOnly cookies authentication
 * @module routes/index
 */

const express = require('express');
const router = express.Router();
const aircraftRoutes = require('./aircraft-routes');
const engineRoutes = require('./engine-routes');
const oilConsumptionRoutes = require('./oil-consumption-routes');
const authRoutes = require('./auth-routes');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { getSystemHealth, getSimpleHealth, getDatabaseHealth } = require('../controllers/health-controller');

// เส้นทาง Health Check (ไม่ต้อง authenticate)
router.get('/health', optionalAuth, getSystemHealth);
router.get('/health/simple', getSimpleHealth);
router.get('/health/database', getDatabaseHealth);

// Debug endpoint สำหรับตรวจสอบ cookies (development only)
router.get('/debug/cookies', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }
  
  res.json({
    success: true,
    message: 'Debug cookies information',
    data: {
      cookies: req.cookies || {},
      headers: {
        cookie: req.headers.cookie,
        authorization: req.headers.authorization,
        'user-agent': req.headers['user-agent'],
        origin: req.headers.origin,
        referer: req.headers.referer
      },
      cookieNames: Object.keys(req.cookies || {}),
      hasCookies: !!(req.cookies && Object.keys(req.cookies).length > 0),
      timestamp: new Date().toISOString()
    }
  });
});

// เส้นทาง Authentication (ไม่ต้องใช้ verifyToken middleware)
// เพราะแต่ละ endpoint ใน auth routes จะจัดการ authentication เอง
router.use('/auth', authRoutes);

// กำหนด middleware สำหรับตรวจสอบ JWT Token
// ใช้สำหรับป้องกันเส้นทางที่ต้องการการยืนยันตัวตน
// รองรับทั้ง HttpOnly cookies และ Authorization header
router.use(verifyToken);

// เส้นทาง API สำหรับเครื่องบิน (ต้อง authenticate)
router.use('/aircraft', aircraftRoutes);

// เส้นทาง API สำหรับเครื่องยนต์ (ต้อง authenticate)
router.use('/engine', engineRoutes);

// เส้นทาง API สำหรับข้อมูลการใช้น้ำมันเครื่อง (ต้อง authenticate)
router.use('/oil-consumptions', oilConsumptionRoutes);

// เส้นทางหลักสำหรับตรวจสอบสถานะ API
router.get('/', (req, res) => {
  res.json({
    message: 'ยินดีต้อนรับสู่ API Service สำหรับจัดการข้อมูลเครื่องบิน',
    version: '1.0.0',
    status: 'online',
    authentication: {
      supported: ['HttpOnly Cookies', 'Authorization Header'],
      primary: 'HttpOnly Cookies',
      fallback: 'Authorization Header'
    },
    endpoints: {
      auth: '/api/auth/*',
      aircraft: '/api/aircraft/*',
      engines: '/api/engines/*',
      oilConsumptions: '/api/oil-consumptions/*'
    }
  });
});

module.exports = router;
