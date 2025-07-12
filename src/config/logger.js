const winston = require('winston');

// กำหนดรูปแบบการแสดงผลเวลา
const timeFormat = () => {
  return new Date().toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok'
  });
};

// สร้าง logger ด้วย Winston
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: timeFormat }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-service' },
  transports: [
    // ใช้ console transport ใน production เพื่อหลีกเลี่ยงปัญหา permission
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) =>
            `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
        )
      )
    })
  ]
});

// ถ้าไม่ได้อยู่ในโหมด production ให้เพิ่ม file transports
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

module.exports = logger;
