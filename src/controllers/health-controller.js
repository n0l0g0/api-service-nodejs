/**
 * Controller สำหรับตรวจสอบสถานะ health ของระบบ
 * รวมข้อมูล authentication status ด้วย HttpOnly cookies
 * @module controllers/health-controller
 */

const logger = require('../config/logger');
const { hasAuthCookies } = require('../utils/cookie-utils');

/**
 * ตรวจสอบสถานะ health ของระบบทั้งหมด
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSystemHealth = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // ตรวจสอบ authentication status
    const hasAuth = hasAuthCookies(req);
    const isAuthenticated = !!req.user;
    
    // รวบรวมข้อมูล health
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: {
          status: 'online',
          responseTime: Date.now() - startTime
        },
        authentication: {
          status: 'online',
          cookieSupport: true,
          headerFallback: true,
          features: {
            httpOnlyCookies: true,
            duoVerification: true,
            refreshTokens: true
          }
        },
        database: {
          status: 'unknown', // จะต้องตรวจสอบจริงถ้าต้องการ
          type: 'postgresql'
        }
      },
      request: {
        hasAuthCookies: hasAuth,
        isAuthenticated: isAuthenticated,
        tokenSource: req.tokenSource || null,
        user: isAuthenticated ? {
          username: req.user.username,
          id: req.user.id
        } : null
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    };

    logger.info('System health check completed successfully');

    return res.status(200).json({
      success: true,
      message: 'System health check completed',
      data: healthData
    });

  } catch (error) {
    logger.error('Error in system health check:', error);
    
    return res.status(500).json({
      success: false,
      status: 'unhealthy',
      message: 'System health check failed',
      error: 'HEALTH_CHECK_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * ตรวจสอบสถานะ health แบบง่าย (สำหรับ load balancer)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSimpleHealth = async (req, res) => {
  try {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * ตรวจสอบสถานะ database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDatabaseHealth = async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    
    // ลอง authenticate กับ database
    await sequelize.authenticate();
    
    return res.status(200).json({
      success: true,
      status: 'healthy',
      message: 'Database connection is healthy',
      database: {
        type: 'postgresql',
        status: 'connected'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Database health check failed:', error);
    
    return res.status(500).json({
      success: false,
      status: 'unhealthy',
      message: 'Database connection failed',
      error: 'DATABASE_CONNECTION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getSystemHealth,
  getSimpleHealth,
  getDatabaseHealth
};
