/**
 * Controller สำหรับจัดการข้อมูลเครื่องบิน
 * ทำหน้าที่รับคำขอจาก client และส่งต่อไปยัง service เพื่อดำเนินการต่อ
 * @module controllers/aircraftController
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const Aircraft = db.Aircraft;
const { Op } = require('sequelize');
const logger = require('../config/logger');

/**
 * ดึงข้อมูลเครื่องบินทั้งหมด
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.findAll = async (req, res) => {
  try {
    const aircraft = await Aircraft.findAll({
      include: ['engines']
    });
    res.status(200).json(aircraft);
  } catch (error) {
    logger.error('Error retrieving aircraft:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเครื่องบิน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ค้นหาเครื่องบินตาม ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.findOne = async (req, res) => {
  const id = req.params.id;
  console.log('id', id);
// ขอ comment ตรงนี้หน่อยครับ
  try {
    const aircraft = await Aircraft.findByPk(id, {
      include: ['engines']
    });

    if (!aircraft) {
      return res.status(404).json({
        message: `ไม่พบเครื่องบินที่มี ID: ${id}`
      });
    }

    res.status(200).json(aircraft);
  } catch (error) {
    console.error('Error retrieving aircraft by id:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเครื่องบิน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * สร้างเครื่องบินใหม่
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.create = async (req, res) => {
  // ตรวจสอบความถูกต้องของข้อมูลที่ส่งมา
  if (
    !req.body.registration ||
    !req.body.aircraft_type ||
    !req.body.engine_type ||
    !req.body.engine_qty
  ) {
    return res.status(400).json({
      message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }

  try {
    // ตรวจสอบว่าทะเบียนเครื่องบินซ้ำหรือไม่
    const existingAircraft = await Aircraft.findOne({
      where: {
        registration: req.body.registration
      }
    });

    if (existingAircraft) {
      return res.status(400).json({
        message: `ทะเบียนเครื่องบิน ${req.body.registration} มีอยู่ในระบบแล้ว`
      });
    }

    // สร้างเครื่องบินใหม่
    const newAircraft = {
      id: uuidv4(),
      registration: req.body.registration,
      aircraft_type: req.body.aircraft_type,
      engine_type: req.body.engine_type,
      engine_qty: req.body.engine_qty,
      active: req.body.active !== undefined ? req.body.active : true
    };

    const aircraft = await Aircraft.create(newAircraft);
    res.status(201).json(aircraft);
  } catch (error) {
    console.error('Error creating aircraft:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการสร้างเครื่องบิน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * อัปเดตข้อมูลเครื่องบิน
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    // ตรวจสอบว่าเครื่องบินมีอยู่จริงหรือไม่
    const aircraft = await Aircraft.findByPk(id);

    if (!aircraft) {
      return res.status(404).json({
        message: `ไม่พบเครื่องบินที่มี ID: ${id}`
      });
    }

    // ตรวจสอบว่าทะเบียนเครื่องบินซ้ำหรือไม่ (ถ้ามีการเปลี่ยนทะเบียน)
    if (
      req.body.registration &&
      req.body.registration !== aircraft.registration
    ) {
      const existingAircraft = await Aircraft.findOne({
        where: {
          registration: req.body.registration,
          id: { [Op.ne]: id }
        }
      });

      if (existingAircraft) {
        return res.status(400).json({
          message: `ทะเบียนเครื่องบิน ${req.body.registration} มีอยู่ในระบบแล้ว`
        });
      }
    }

    // อัปเดตข้อมูลเครื่องบิน
    await Aircraft.update(req.body, {
      where: { id }
    });

    const updatedAircraft = await Aircraft.findByPk(id, {
      include: ['engines']
    });

    res.status(200).json(updatedAircraft);
  } catch (error) {
    console.error('Error updating aircraft:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลเครื่องบิน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ลบเครื่องบิน
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.remove = async (req, res) => {
  const id = req.params.id;

  try {
    // ตรวจสอบว่าเครื่องบินมีอยู่จริงหรือไม่
    const aircraft = await Aircraft.findByPk(id);

    if (!aircraft) {
      return res.status(404).json({
        message: `ไม่พบเครื่องบินที่มี ID: ${id}`
      });
    }

    // ลบเครื่องบิน
    await Aircraft.destroy({
      where: { id }
    });

    res.status(200).json({
      message: 'ลบเครื่องบินเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting aircraft:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการลบเครื่องบิน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
