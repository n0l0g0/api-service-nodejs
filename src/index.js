require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const YAML = require('yamljs');

// นำเข้ารูปแบบการกำหนดเส้นทาง
const routes = require('./routes');

// นำเข้าการตั้งค่าและ service ต่างๆ
const { sequelize } = require('./config/database');
const logger = require('./config/logger');
const { cookieErrorHandler } = require('./utils/cookie-utils');

// แอพพลิเคชั่นหลัก
const app = express();
const port = process.env.PORT || 8081;

// กำหนดค่า CORS สำหรับรองรับ HttpOnly cookies
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ], // อนุญาตหลาย frontend URLs
  credentials: true, // เปิดใช้งานการส่ง cookies ข้าม origin
  optionsSuccessStatus: 200, // สำหรับ legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // HTTP methods ที่อนุญาต  
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'], // headers ที่อนุญาต
  exposedHeaders: ['Set-Cookie'] // เปิดให้ browser เข้าถึง Set-Cookie header
};

// กำหนดค่า Middleware
app.use(helmet()); // ช่วยเพิ่มความปลอดภัยด้วย HTTP headers
app.use(cors(corsOptions)); // เปิดใช้ CORS พร้อม credentials สำหรับ cookies
app.use(cookieParser()); // เพิ่ม cookie parser middleware สำหรับ HttpOnly cookies
app.use(express.json()); // แปลงข้อมูล JSON
app.use(express.urlencoded({ extended: true })); // แปลงข้อมูลจากฟอร์ม
app.use(morgan('dev')); // บันทึกการเรียก API

// ให้ swagger อ่านจากไฟล์ YAML
const swaggerDocument = YAML.load(path.join(__dirname, 'docs/openapi.yaml'));

// กำหนดเส้นทางสำหรับ Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// กำหนด API Prefix
app.use('/api', routes);

// จัดการกับเส้นทางที่ไม่มีอยู่จริง
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// จัดการกับข้อผิดพลาดเกี่ยวกับ cookies
app.use(cookieErrorHandler());

// จัดการกับข้อผิดพลาดต่างๆ
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// เริ่มต้นเซิร์ฟเวอร์
const startServer = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    await sequelize.authenticate();
    logger.info('Connected to the database successfully');

    // ซิงค์โมเดลกับฐานข้อมูล (ใช้ในโหมด development เท่านั้น)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      logger.info('Sync models with database successfully');
    }

    // เริ่มต้นเซิร์ฟเวอร์
    app.listen(port, () => {
      logger.info(`Application is running on: http://localhost:${port}`);
      logger.info(`Swagger UI available at: http://localhost:${port}/docs`);
    });
  } catch (error) {
    logger.error(`Can't start the server:`, error);
    process.exit(1);
  }
};

startServer();
