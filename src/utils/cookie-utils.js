/**
 * Utility functions สำหรับจัดการ HttpOnly cookies
 * ใช้สำหรับการจัดการ authentication tokens ผ่าน cookies แทน localStorage
 * @module utils/cookie-utils
 */

const logger = require('../config/logger');

/**
 * ชื่อของ cookies ที่ใช้ในระบบ
 */
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CSRF_TOKEN: 'csrf_token'
};

/**
 * ตั้งค่าเริ่มต้นสำหรับ cookies
 */
const DEFAULT_COOKIE_OPTIONS = {
  httpOnly: true, // ป้องกันการเข้าถึงผ่าน JavaScript ใน browser
  secure: process.env.NODE_ENV === 'production', // ใช้ HTTPS เฉพาะใน production
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // ป้องกัน CSRF attacks
  maxAge: 24 * 60 * 60 * 1000, // อายุ cookie 24 ชั่วโมง (ใน milliseconds)
  path: '/' // cookie ใช้ได้กับทุก path
};

/**
 * ตั้งค่า access token cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT access token
 * @param {Object} options - เพิ่มเติมตัวเลือกสำหรับ cookie
 */
const setAccessTokenCookie = (res, token, options = {}) => {
  try {
    const cookieOptions = {
      ...DEFAULT_COOKIE_OPTIONS,
      ...options
    };

    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, token, cookieOptions);
    logger.info('Access token cookie set successfully');
  } catch (error) {
    logger.error('Failed to set access token cookie:', error);
    throw error;
  }
};

/**
 * ตั้งค่า refresh token cookie (อายุยาวกว่า access token)
 * @param {Object} res - Express response object
 * @param {string} token - JWT refresh token
 * @param {Object} options - เพิ่มเติมตัวเลือกสำหรับ cookie
 */
const setRefreshTokenCookie = (res, token, options = {}) => {
  try {
    const cookieOptions = {
      ...DEFAULT_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // อายุ 7 วัน สำหรับ refresh token
      ...options
    };

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, cookieOptions);
    logger.info('Refresh token cookie set successfully');
  } catch (error) {
    logger.error('Failed to set refresh token cookie:', error);
    throw error;
  }
};

/**
 * ดึง access token จาก cookies
 * รองรับหลายชื่อ cookie เพื่อความยืดหยุ่นใน microservice architecture
 * @param {Object} req - Express request object
 * @returns {string|null} JWT access token หรือ null ถ้าไม่พบ
 */
const getAccessTokenFromCookie = (req) => {
  try {
    logger.debug('Looking for access token in cookies...');
    logger.debug('Available cookies:', Object.keys(req.cookies || {}));
    logger.debug('Cookie names constant:', JSON.stringify(COOKIE_NAMES));
    
    // รายการชื่อ cookies ที่ต้องลองหา (ตามลำดับความสำคัญ)
    const cookieNames = [
      'auth_token',              // Auth Service standard (passport.js)
      COOKIE_NAMES.ACCESS_TOKEN, // API Service standard ('access_token')
      'token'                    // Generic fallback
    ];
    
    for (const cookieName of cookieNames) {
      const token = req.cookies?.[cookieName];
      if (token) {
        logger.debug(`Access token retrieved from "${cookieName}" cookie, length:`, token.length);
        return token;
      }
    }
    
    logger.debug('No access token found in cookies');
    logger.debug('Expected cookie names:', cookieNames.join(', '));
    return null;
  } catch (error) {
    logger.error('Failed to get access token from cookie:', error);
    return null;
  }
};

/**
 * ดึง refresh token จาก cookies
 * @param {Object} req - Express request object
 * @returns {string|null} JWT refresh token หรือ null ถ้าไม่พบ
 */
const getRefreshTokenFromCookie = (req) => {
  try {
    const token = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
    if (token) {
      logger.debug('Refresh token retrieved from cookie');
      return token;
    }
    logger.debug('No refresh token found in cookies');
    return null;
  } catch (error) {
    logger.error('Failed to get refresh token from cookie:', error);
    return null;
  }
};

/**
 * ลบ authentication cookies ทั้งหมด (สำหรับ logout)
 * @param {Object} res - Express response object
 */
const clearAuthCookies = (res) => {
  try {
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    });

    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    });

    logger.info('Authentication cookies cleared successfully');
  } catch (error) {
    logger.error('Failed to clear authentication cookies:', error);
    throw error;
  }
};

/**
 * ตรวจสอบว่า request มี authentication cookies หรือไม่
 * @param {Object} req - Express request object
 * @returns {boolean} true ถ้ามี access token cookie
 */
const hasAuthCookies = (req) => {
  return !!(req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN]);
};

/**
 * สร้าง middleware สำหรับจัดการ cookie errors
 * @returns {Function} Express middleware function
 */
const cookieErrorHandler = () => {
  return (error, req, res, next) => {
    if (error.type === 'entity.parse.failed') {
      logger.error('Cookie parsing failed:', error);
      return res.status(400).json({
        message: 'Invalid cookie format',
        error: 'COOKIE_PARSE_ERROR'
      });
    }
    next(error);
  };
};

module.exports = {
  COOKIE_NAMES,
  DEFAULT_COOKIE_OPTIONS,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  clearAuthCookies,
  hasAuthCookies,
  cookieErrorHandler
}; 