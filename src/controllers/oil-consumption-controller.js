/**
 * Controller สำหรับจัดการข้อมูลการใช้น้ำมันเครื่อง
 * ทำหน้าที่รับคำขอจาก client และส่งต่อไปยัง service เพื่อดำเนินการต่อ
 * @module controllers/oilConsumptionController
 */

const { v4: uuidv4 } = require('uuid');
const { Engine, OilConsumption, Aircraft } = require('../models');

/**
 * ดึงข้อมูลการใช้น้ำมันเครื่องทั้งหมด
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.findAll = async (req, res) => {
  try {
    const consumptions = await OilConsumption.findAll({
      include: [
        {
          model: Engine,
          as: 'engine',
          include: [
            {
              model: Aircraft,
              as: 'aircraft'
            }
          ]
        }
      ]
    });
    res.status(200).json(consumptions);
  } catch (error) {
    console.error('Error retrieving oil consumptions:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการใช้น้ำมันเครื่อง',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ค้นหาข้อมูลการใช้น้ำมันเครื่องตาม ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const consumption = await OilConsumption.findByPk(id, {
      include: [
        {
          model: Engine,
          as: 'engine',
          include: [
            {
              model: Aircraft,
              as: 'aircraft'
            }
          ]
        }
      ]
    });

    if (!consumption) {
      return res.status(404).json({
        message: `ไม่พบข้อมูลการใช้น้ำมันเครื่องที่มี ID: ${id}`
      });
    }

    res.status(200).json(consumption);
  } catch (error) {
    console.error('Error retrieving oil consumption by id:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการใช้น้ำมันเครื่อง',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ดึงข้อมูลการใช้น้ำมันเครื่องตามเครื่องยนต์
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.findByEngine = async (req, res) => {
  const engine_id = req.params.engine_id;

  try {
    // ตรวจสอบว่าเครื่องยนต์มีอยู่จริงหรือไม่
    const engine = await Engine.findByPk(engine_id);

    if (!engine) {
      return res.status(404).json({
        message: `ไม่พบเครื่องยนต์ที่มี ID: ${engine_id}`
      });
    }

    // ใช้ raw query แทนเพื่อหลีกเลี่ยงปัญหาการแปลงชื่อคอลัมน์
    const consumptions = await OilConsumption.findAll({
      where: { engine_id: engine_id, deleted_at: null },
      order: [['date', 'DESC']],
      include: [
        {
          model: Engine,
          as: 'engine',
          include: [
            {
              model: Aircraft,
              as: 'aircraft'
            }
          ]
        }
      ]
    });

    res.status(200).json(consumptions);
  } catch (error) {
    console.error('Error retrieving oil consumptions by engine_id:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการใช้น้ำมันเครื่อง',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * สร้างข้อมูลการใช้น้ำมันเครื่องใหม่
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.create = async (req, res) => {
  // ตรวจสอบความถูกต้องของข้อมูลที่ส่งมา
  if (
    !req.body.date ||
    req.body.flight_hours === undefined ||
    req.body.oil_added === undefined ||
    !req.body.engine_id
  ) {
    return res.status(400).json({
      message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }

  try {
    // ตรวจสอบว่าเครื่องยนต์มีอยู่จริงหรือไม่
    const engine = await Engine.findByPk(req.body.engine_id);

    if (!engine) {
      return res.status(404).json({
        message: `ไม่พบเครื่องยนต์ที่มี ID: ${req.body.engine_id}`
      });
    }

    // สร้างข้อมูลการใช้น้ำมันเครื่องใหม่
    const newConsumption = {
      id: uuidv4(),
      date: req.body.date,
      flight_hours: req.body.flight_hours,
      oil_added: req.body.oil_added,
      remarks: req.body.remarks || null,
      engine_id: req.body.engine_id
    };

    const consumption = await OilConsumption.create(newConsumption);

    // คำนวณอัตราการใช้น้ำมันเฉลี่ยของเครื่องยนต์ (ถ้ามีข้อมูลมากกว่า 1 รายการ)
    await calculateEngineOilConsumptionRate(req.body.engine_id);

    res.status(201).json(consumption);
  } catch (error) {
    console.error('Error creating oil consumption:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการสร้างข้อมูลการใช้น้ำมันเครื่อง',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * อัปเดตข้อมูลการใช้น้ำมันเครื่อง
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    // ตรวจสอบว่าข้อมูลการใช้น้ำมันเครื่องมีอยู่จริงหรือไม่
    const consumption = await OilConsumption.findByPk(id);

    if (!consumption) {
      return res.status(404).json({
        message: `ไม่พบข้อมูลการใช้น้ำมันเครื่องที่มี ID: ${id}`
      });
    }

    // อัปเดตข้อมูลการใช้น้ำมันเครื่อง
    await OilConsumption.update(req.body, {
      where: { id }
    });

    const updatedConsumption = await OilConsumption.findByPk(id, {
      include: [
        {
          model: Engine,
          as: 'engine',
          include: [
            {
              model: Aircraft,
              as: 'aircraft'
            }
          ]
        }
      ]
    });

    // คำนวณอัตราการใช้น้ำมันเฉลี่ยของเครื่องยนต์ใหม่
    await calculateEngineOilConsumptionRate(consumption.engine_id);

    res.status(200).json(updatedConsumption);
  } catch (error) {
    console.error('Error updating oil consumption:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการใช้น้ำมันเครื่อง',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ลบข้อมูลการใช้น้ำมันเครื่อง
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.remove = async (req, res) => {
  const id = req.params.id;

  try {
    // ตรวจสอบว่าข้อมูลการใช้น้ำมันเครื่องมีอยู่จริงหรือไม่
    const consumption = await OilConsumption.findByPk(id);

    if (!consumption) {
      return res.status(404).json({
        message: `ไม่พบข้อมูลการใช้น้ำมันเครื่องที่มี ID: ${id}`
      });
    }

    const engine_id = consumption.engine_id;

    // ลบข้อมูลการใช้น้ำมันเครื่อง (soft delete)
    await OilConsumption.destroy({
      where: { id }
    });

    // คำนวณอัตราการใช้น้ำมันเฉลี่ยของเครื่องยนต์ใหม่
    await calculateEngineOilConsumptionRate(engine_id);

    res.status(200).json({
      message: 'ลบข้อมูลการใช้น้ำมันเครื่องเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting oil consumption:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการลบข้อมูลการใช้น้ำมันเครื่อง',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * คำนวณอัตราการใช้น้ำมันเฉลี่ยของเครื่องยนต์และอัปเดตข้อมูลในฐานข้อมูล
 * @param {string} engine_id - ID ของเครื่องยนต์
 * @returns {Promise<void>}
 */
async function calculateEngineOilConsumptionRate(engine_id) {
  try {
    // ดึงข้อมูลการใช้น้ำมันเครื่องย้อนหลังเรียงตามวันที่
    const consumptions = await OilConsumption.findAll({
      where: { engine_id: engine_id },
      order: [['date', 'ASC']]
    });

    // ถ้ามีข้อมูลน้อยกว่า 2 รายการ ไม่สามารถคำนวณอัตราการใช้น้ำมันเฉลี่ยได้
    if (consumptions.length < 2) {
      return;
    }

    // คำนวณอัตราการใช้น้ำมันเฉลี่ย
    let totalRate = 0;
    let rateCount = 0;

    for (let i = 1; i < consumptions.length; i++) {
      const current = consumptions[i];

      // คำนวณอัตราการใช้น้ำมันต่อชั่วโมงบิน
      if (current.flight_hours > 0) {
        const rate = current.oil_added / current.flight_hours;
        totalRate += rate;
        rateCount++;
      }
    }

    // คำนวณค่าเฉลี่ย
    const averageRate = rateCount > 0 ? totalRate / rateCount : null;

    // อัปเดตข้อมูลเครื่องยนต์
    const engine = await Engine.findByPk(engine_id);

    if (engine && averageRate !== null) {
      // อัปเดตอัตราการใช้น้ำมันเฉลี่ย
      const updateData = {
        average_consumption_rate_per_hour: averageRate,
        last_calculation_date: new Date()
      };

      // คำนวณชั่วโมงบินที่เหลือโดยประมาณ ถ้ามีการตั้งค่าเกณฑ์แจ้งเตือน
      if (engine.low_oil_threshold_hours !== null && averageRate > 0) {
        // สมมติว่าถังน้ำมันมีความจุ 10 ลิตร และมีน้ำมันเหลือ 5 ลิตร (ต้องปรับค่าตามความเป็นจริง)
        const remainingOil = 5; // ลิตร
        updateData.estimated_hours_remaining = remainingOil / averageRate;
      }

      // อัปเดตข้อมูลเครื่องยนต์
      await Engine.update(updateData, {
        where: { id: engine_id }
      });
    }
  } catch (error) {
    console.error('Error calculating oil consumption rate:', error);
    throw error;
  }
}
