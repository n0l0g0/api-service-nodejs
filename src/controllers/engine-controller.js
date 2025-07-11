/**
 * Controller สำหรับจัดการข้อมูลเครื่องยนต์
 * ทำหน้าที่รับคำขอจาก client และส่งต่อไปยัง service เพื่อดำเนินการต่อ
 * @module controllers/engineController
 */

const { v4: uuidv4 } = require('uuid');
const { Engine, Aircraft, OilConsumption } = require('../models');
const { Op } = require('sequelize');

/**
 * ดึงข้อมูลเครื่องยนต์ทั้งหมด
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.findAll = async (req, res) => {
  try {
    // ดึงข้อมูล engines และ aircraft โดยใช้ Sequelize ORM
    const engines = await Engine.findAll({
      include: ['aircraft']
    });

    // ดึงข้อมูล oil_consumptions สำหรับทุกเครื่องยนต์
    if (engines && engines.length > 0) {
      // ดึง ID ของทุกเครื่องยนต์
      const engineIds = engines.map((engine) => engine.id);

      // ดึงข้อมูล oil_consumptions ทั้งหมดที่เกี่ยวข้องกับเครื่องยนต์ทั้งหมด
      const oilConsumptions = await OilConsumption.findAll({
        where: {
          engine_id: {
            [Op.in]: engineIds
          },
          deleted_at: null // ตรวจสอบว่าไม่ได้ถูกลบ
        },
        order: [['date', 'DESC']] // เรียงลำดับตามวันที่ล่าสุด
      });

      // จัดกลุ่ม oil_consumptions ตาม engine_id
      const consumptionsByEngineId = {};
      oilConsumptions.forEach((consumption) => {
        if (!consumptionsByEngineId[consumption.engine_id]) {
          consumptionsByEngineId[consumption.engine_id] = [];
        }
        consumptionsByEngineId[consumption.engine_id].push(consumption);
      });

      // เพิ่มข้อมูล oil_consumptions เข้าไปในแต่ละ engine
      engines.forEach((engine) => {
        engine.setDataValue(
          'oil_consumptions',
          consumptionsByEngineId[engine.id] || []
        );
      });
    }

    res.status(200).json(engines);
  } catch (error) {
    console.error('Error retrieving engines:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเครื่องยนต์',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ค้นหาเครื่องยนต์ตาม ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    // ดึงข้อมูล engine และ aircraft โดยใช้ Sequelize ORM
    const engine = await Engine.findByPk(id, {
      include: ['aircraft']
    });

    if (engine) {
      // ดึงข้อมูล oil_consumptions
      const oilConsumptions = await OilConsumption.findAll({
        where: {
          engine_id: id,
          deleted_at: null // ตรวจสอบว่าไม่ได้ถูกลบ
        },
        order: [['date', 'DESC']] // เรียงลำดับตามวันที่ล่าสุด
      });

      // เพิ่มข้อมูล oil_consumptions เข้าไปใน engine object
      engine.setDataValue('oil_consumptions', oilConsumptions);
    }

    if (!engine) {
      return res.status(404).json({
        message: `ไม่พบเครื่องยนต์ที่มี ID: ${id}`
      });
    }

    res.status(200).json(engine);
  } catch (error) {
    console.error('Error retrieving engine by id:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเครื่องยนต์',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ดึงข้อมูลเครื่องยนต์ตามเครื่องบิน
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.findByAircraft = async (req, res) => {
  const aircraft_id = req.params.aircraft_id;

  try {
    // ตรวจสอบว่าเครื่องบินมีอยู่จริงหรือไม่
    const aircraft = await Aircraft.findByPk(aircraft_id);

    if (!aircraft) {
      return res.status(404).json({
        message: `ไม่พบเครื่องบินที่มี ID: ${aircraft_id}`
      });
    }

    const engines = await Engine.findAll({
      where: { aircraft_id: aircraft_id },
      include: ['oil_consumptions']
    });

    res.status(200).json(engines);
  } catch (error) {
    console.error('Error retrieving engines by aircraft id:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเครื่องยนต์',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * สร้างเครื่องยนต์ใหม่
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.create = async (req, res) => {
  // ตรวจสอบความถูกต้องของข้อมูลที่ส่งมา
  if (
    !req.body.serial_number ||
    !req.body.position ||
    !req.body.model ||
    !req.body.aircraft_id
  ) {
    return res.status(400).json({
      message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }

  // เตรียมข้อมูลโดยแปลงจาก aircraft_id เป็น aircraft_id ให้ตรงกับชื่อในฐานข้อมูล
  const aircraft_id = req.body.aircraft_id;

  try {
    // ตรวจสอบว่าเครื่องบินมีอยู่จริงหรือไม่
    const aircraft = await Aircraft.findByPk(aircraft_id);

    if (!aircraft) {
      return res.status(404).json({
        message: `ไม่พบเครื่องบินที่มี ID: ${aircraft_id}`
      });
    }

    // ตรวจสอบว่าตำแหน่งเครื่องยนต์ซ้ำหรือไม่
    const existingEngine = await Engine.findOne({
      where: {
        aircraft_id: aircraft_id,
        position: req.body.position
      }
    });

    if (existingEngine) {
      return res.status(400).json({
        message: `เครื่องบินนี้มีเครื่องยนต์ในตำแหน่ง ${req.body.position} อยู่แล้ว`
      });
    }

    // สร้างเครื่องยนต์ใหม่
    const newEngine = {
      id: uuidv4(),
      serial_number: req.body.serial_number,
      position: req.body.position,
      model: req.body.model,
      active: req.body.active !== undefined ? req.body.active : true,
      average_consumption_rate_per_hour:
        req.body.average_consumption_rate_per_hour,
      estimated_hours_remaining: req.body.estimated_hours_remaining,
      low_oil_threshold_hours: req.body.low_oil_threshold_hours,
      last_calculation_date: req.body.last_calculation_date,
      aircraft_id: aircraft_id // ใช้ aircraft_id แทน aircraft_id ให้ตรงกับชื่อคอลัมน์ในฐานข้อมูล
    };

    const engine = await Engine.create(newEngine);
    res.status(201).json(engine);
  } catch (error) {
    console.error('Error creating engine:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการสร้างเครื่องยนต์',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * อัปเดตข้อมูลเครื่องยนต์
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    // ตรวจสอบว่าเครื่องยนต์มีอยู่จริงหรือไม่
    const engine = await Engine.findByPk(id);

    if (!engine) {
      return res.status(404).json({
        message: `ไม่พบเครื่องยนต์ที่มี ID: ${id}`
      });
    }

    // ตรวจสอบว่าตำแหน่งเครื่องยนต์ซ้ำหรือไม่ (ถ้ามีการเปลี่ยนตำแหน่ง)
    if (req.body.position && req.body.position !== engine.position) {
      const existingEngine = await Engine.findOne({
        where: {
          aircraft_id: engine.aircraft_id,
          position: req.body.position,
          id: { [Op.ne]: id }
        }
      });

      if (existingEngine) {
        return res.status(400).json({
          message: `เครื่องบินนี้มีเครื่องยนต์ในตำแหน่ง ${req.body.position} อยู่แล้ว`
        });
      }
    }

    // อัปเดตข้อมูลเครื่องยนต์
    await Engine.update(req.body, {
      where: { id }
    });

    // ดึงข้อมูลเครื่องยนต์ที่อัปเดตแล้วพร้อม aircraft โดยใช้ Sequelize ORM
    const updatedEngine = await Engine.findByPk(id, {
      include: ['aircraft']
    });

    if (updatedEngine) {
      // ดึงข้อมูล oil_consumptions
      const oilConsumptions = await OilConsumption.findAll({
        where: {
          engine_id: id,
          deleted_at: null // ตรวจสอบว่าไม่ได้ถูกลบ
        },
        order: [['date', 'DESC']] // เรียงลำดับตามวันที่ล่าสุด
      });

      // เพิ่มข้อมูล oil_consumptions เข้าไปใน engine object
      updatedEngine.setDataValue('oil_consumptions', oilConsumptions);
    }

    res.status(200).json(updatedEngine);
  } catch (error) {
    console.error('Error updating engine:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลเครื่องยนต์',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ลบเครื่องยนต์
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.remove = async (req, res) => {
  const id = req.params.id;

  try {
    // ตรวจสอบว่าเครื่องยนต์มีอยู่จริงหรือไม่
    const engine = await Engine.findByPk(id);

    if (!engine) {
      return res.status(404).json({
        message: `ไม่พบเครื่องยนต์ที่มี ID: ${id}`
      });
    }

    // ลบเครื่องยนต์ (soft delete)
    await Engine.destroy({
      where: { id }
    });

    res.status(200).json({
      message: 'ลบเครื่องยนต์เรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting engine:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการลบเครื่องยนต์',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
