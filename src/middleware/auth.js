/**
 * Middleware สำหรับตรวจสอบ JWT Token จาก HttpOnly Cookies และ Auth Service
 * อัปเดตให้รองรับ HttpOnly cookies พร้อม fallback สำหรับ Authorization header
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { getAccessTokenFromCookie, hasAuthCookies } = require('../utils/cookie-utils');

/**
 * ดึง JWT token จาก request (cookies หรือ Authorization header)
 * ลำดับความสำคัญ: 1) HttpOnly cookies 2) Authorization header (backward compatibility)
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token หรือ null ถ้าไม่พบ
 */
const extractTokenFromRequest = (req) => {
  // Debug: แสดงข้อมูล cookies ที่เข้ามา
  logger.debug('Request cookies:', JSON.stringify(req.cookies, null, 2));
  logger.debug('Request headers authorization:', req.headers.authorization);
  
  // ลองดึงจาก HttpOnly cookies ก่อน (วิธีใหม่)
  const cookieToken = getAccessTokenFromCookie(req);
  if (cookieToken) {
    logger.debug('Token extracted from HttpOnly cookie:', cookieToken.substring(0, 20) + '...');
    return cookieToken;
  }

  logger.debug('No token found in cookies or Authorization header');
  logger.debug('Available cookie names:', Object.keys(req.cookies || {}));
  return null;
};

/**
 * Middleware สำหรับตรวจสอบ JWT Token
 * รองรับทั้ง HttpOnly cookies และ Authorization header
 * ใช้สำหรับป้องกัน protected routes
 */
const verifyToken = (req, res, next) => {
  try {
    // ดึง token จาก cookies หรือ header
    const token = extractTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.',
        error: 'MISSING_TOKEN',
        hint: 'Token should be provided via HttpOnly cookies or Authorization header'
      });
    }

    // Verify token ด้วย JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ตรวจสอบว่า token หมดอายุหรือไม่
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json({
        message: 'Access denied. Token expired.',
        error: 'TOKEN_EXPIRED'
      });
    }

    // เก็บข้อมูล user ใน request object เพื่อใช้ใน controller
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email,
      requiredDuo: decoded.requiredDuo,
      duoVerified: decoded.duoVerified
    };

    // เก็บข้อมูลเพิ่มเติมเกี่ยวกับ token source สำหรับ debugging
    req.tokenSource = hasAuthCookies(req) ? 'cookie' : 'header';

    logger.info(`User ${decoded.username} authenticated successfully via ${req.tokenSource}`);
    next();
  } catch (error) {
    logger.error('Token verification failed:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Access denied. Invalid token.',
        error: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Access denied. Token expired.',
        error: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      message: 'Internal server error during authentication.',
      error: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware สำหรับตรวจสอบ Duo verification (optional)
 * ใช้สำหรับ routes ที่ต้องการ 2FA
 */
const requireDuoVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required.',
      error: 'NOT_AUTHENTICATED'
    });
  }

  // ถ้าผู้ใช้ต้องการ Duo แต่ยังไม่ได้ verify
  if (req.user.requiredDuo && !req.user.duoVerified) {
    return res.status(403).json({
      message: 'Duo verification required.',
      error: 'DUO_VERIFICATION_REQUIRED'
    });
  }

  next();
};

/**
 * Middleware สำหรับ optional authentication
 * ไม่บังคับให้มี token แต่ถ้ามีจะ verify และเก็บข้อมูล user
 * รองรับทั้ง cookies และ Authorization header
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      return next(); // ไม่มี token ก็ผ่าน
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email,
      requiredDuo: decoded.requiredDuo,
      duoVerified: decoded.duoVerified
    };

    req.tokenSource = hasAuthCookies(req) ? 'cookie' : 'header';
    logger.debug(`Optional auth successful for user ${decoded.username} via ${req.tokenSource}`);
  } catch (error) {
    logger.warn('Optional auth token verification failed:', error.message);
    // ไม่ return error เพราะเป็น optional
  }

  next();
};

/**
 * Middleware สำหรับบังคับใช้ HttpOnly cookies เท่านั้น
 * ใช้สำหรับ routes ที่ต้องการความปลอดภัยสูง
 */
const requireCookieAuth = (req, res, next) => {
  try {
    const cookieToken = getAccessTokenFromCookie(req);

    if (!cookieToken) {
      return res.status(401).json({
        message: 'Access denied. HttpOnly cookie authentication required.',
        error: 'COOKIE_AUTH_REQUIRED',
        hint: 'This endpoint requires authentication via HttpOnly cookies only'
      });
    }

    // Verify token
    const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET);

    // ตรวจสอบว่า token หมดอายุหรือไม่
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json({
        message: 'Access denied. Token expired.',
        error: 'TOKEN_EXPIRED'
      });
    }

    req.user = {
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email,
      requiredDuo: decoded.requiredDuo,
      duoVerified: decoded.duoVerified
    };

    req.tokenSource = 'cookie';
    logger.info(`User ${decoded.username} authenticated via HttpOnly cookie`);
    next();
  } catch (error) {
    logger.error('Cookie authentication failed:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Access denied. Invalid token.',
        error: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Access denied. Token expired.',
        error: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      message: 'Internal server error during authentication.',
      error: 'AUTH_ERROR'
    });
  }
};

module.exports = {
  verifyToken,
  requireDuoVerification,
  optionalAuth,
  requireCookieAuth, // เพิ่ม middleware ใหม่สำหรับบังคับใช้ cookies
  extractTokenFromRequest // export utility function
};
