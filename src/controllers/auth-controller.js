/**
 * Controller สำหรับจัดการ authentication ด้วย HttpOnly cookies
 * รองรับการทำงานร่วมกับ auth-service-nodejs
 * @module controllers/auth-controller
 */

const logger = require('../config/logger');
const {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  hasAuthCookies
} = require('../utils/cookie-utils');

/**
 * ตรวจสอบสถานะการเข้าสู่ระบบจาก HttpOnly cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyAuthStatus = async (req, res) => {
  try {
    // ตรวจสอบว่ามี authentication cookies หรือไม่
    if (!hasAuthCookies(req)) {
      return res.status(401).json({
        success: false,
        message: 'No authentication cookies found',
        authenticated: false,
        error: 'NO_AUTH_COOKIES'
      });
    }

    // ถ้าผ่าน middleware มาแล้ว แสดงว่า token ใน cookie ถูกต้อง
    if (req.user) {
      logger.info(`Auth status verified for user: ${req.user.username}`);
      return res.status(200).json({
        success: true,
        message: 'Authentication verified successfully',
        authenticated: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          requiredDuo: req.user.requiredDuo,
          duoVerified: req.user.duoVerified
        },
        tokenSource: req.tokenSource || 'cookie'
      });
    }

    // ถ้าไม่มี user data แสดงว่าเกิดข้อผิดพลาด
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication state',
      authenticated: false,
      error: 'INVALID_AUTH_STATE'
    });

  } catch (error) {
    logger.error('Error verifying auth status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication verification',
      authenticated: false,
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * จัดการการตั้งค่า authentication cookies (สำหรับรับ token จาก auth service)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const setAuthCookies = async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required',
        error: 'MISSING_ACCESS_TOKEN'
      });
    }

    // ตั้งค่า access token cookie
    setAccessTokenCookie(res, accessToken);

    // ตั้งค่า refresh token cookie ถ้ามี
    if (refreshToken) {
      setRefreshTokenCookie(res, refreshToken);
    }

    logger.info('Authentication cookies set successfully');

    return res.status(200).json({
      success: true,
      message: 'Authentication cookies set successfully',
      cookiesSet: {
        accessToken: true,
        refreshToken: !!refreshToken
      }
    });

  } catch (error) {
    logger.error('Error setting authentication cookies:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error setting authentication cookies',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * ล้าง authentication cookies (logout)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = async (req, res) => {
  try {
    const username = req.user?.username || 'unknown';
    
    // ล้าง authentication cookies
    clearAuthCookies(res);

    logger.info(`User ${username} logged out successfully`);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      authenticated: false
    });

  } catch (error) {
    logger.error('Error during logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * ดึงข้อมูลผู้ใช้จาก authenticated session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'NOT_AUTHENTICATED'
      });
    }

    logger.info(`Profile requested for user: ${req.user.username}`);

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        requiredDuo: req.user.requiredDuo,
        duoVerified: req.user.duoVerified
      },
      tokenSource: req.tokenSource || 'cookie'
    });

  } catch (error) {
    logger.error('Error getting user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error getting user profile',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * ตรวจสอบสถานะ health ของ auth system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const healthCheck = async (req, res) => {
  try {
    const hasAuth = hasAuthCookies(req);
    const isAuthenticated = !!req.user;

    return res.status(200).json({
      success: true,
      message: 'Auth system health check',
      status: 'healthy',
      features: {
        httpOnlyCookies: true,
        fallbackHeaderAuth: true,
        duoSupport: true
      },
      currentRequest: {
        hasAuthCookies: hasAuth,
        isAuthenticated: isAuthenticated,
        tokenSource: req.tokenSource || null,
        user: isAuthenticated ? req.user.username : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in auth health check:', error);
    return res.status(500).json({
      success: false,
      message: 'Auth system health check failed',
      error: 'HEALTH_CHECK_ERROR'
    });
  }
};

module.exports = {
  verifyAuthStatus,
  setAuthCookies,
  logout,
  getUserProfile,
  healthCheck
}; 