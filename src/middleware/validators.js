/**
 * มิดเดิลแวร์สำหรับตรวจสอบความถูกต้องของข้อมูล
 * @module middleware/validators
 */

const { validationResult } = require('express-validator');

/**
 * Middleware สำหรับตรวจสอบผลของ express-validator
 * และส่งคืน error response ถ้ามี validation errors
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'ข้อมูลไม่ถูกต้อง',
      errors: errorMessages,
      error: 'VALIDATION_ERROR'
    });
  }

  next();
};

/**
 * ตรวจสอบว่าพารามิเตอร์ที่ส่งมาเป็น UUID ที่ถูกต้องหรือไม่
 * @param {string} paramName - ชื่อของพารามิเตอร์ที่ต้องการตรวจสอบ
 * @returns {function} - Express middleware function
 */
exports.validateUUID = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        message: `รูปแบบของ ${paramName} ไม่ถูกต้อง กรุณาระบุเป็น UUID`
      });
    }

    next();
  };
};

/**
 * ตรวจสอบข้อมูลการสร้างและอัปเดตข้อมูลเครื่องบิน
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
exports.validateAircraftData = (req, res, next) => {
  const { registration, aircraft_type, engine_type, engine_qty } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็นเมื่อมีการสร้างเครื่องบินใหม่
  if (req.method === 'POST') {
    if (!registration || !aircraft_type || !engine_type || !engine_qty) {
      return res.status(400).json({
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        details: {
          registration: !registration
            ? 'กรุณาระบุทะเบียนเครื่องบิน'
            : undefined,
          aircraft_type: !aircraft_type
            ? 'กรุณาระบุประเภทเครื่องบิน'
            : undefined,
          engine_type: !engine_type ? 'กรุณาระบุประเภทเครื่องยนต์' : undefined,
          engine_qty: !engine_qty ? 'กรุณาระบุจำนวนเครื่องยนต์' : undefined
        }
      });
    }
  }

  // ตรวจสอบประเภทข้อมูล
  if (
    engine_qty !== undefined &&
    (!Number.isInteger(Number(engine_qty)) || Number(engine_qty) <= 0)
  ) {
    return res.status(400).json({
      message: 'จำนวนเครื่องยนต์ต้องเป็นตัวเลขจำนวนเต็มบวก'
    });
  }

  next();
};

/**
 * ตรวจสอบข้อมูลการสร้างและอัปเดตข้อมูลเครื่องยนต์
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
exports.validateEngineData = (req, res, next) => {
  const { serial_number, position, model, aircraft_id } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็นเมื่อมีการสร้างเครื่องยนต์ใหม่
  if (req.method === 'POST') {
    if (!serial_number || position === undefined || !model || !aircraft_id) {
      return res.status(400).json({
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        details: {
          serial_number: !serial_number ? 'กรุณาระบุหมายเลขซีเรียล' : undefined,
          position: position === undefined ? 'กรุณาระบุตำแหน่ง' : undefined,
          model: !model ? 'กรุณาระบุรุ่นของเครื่องยนต์' : undefined,
          aircraft_id: !aircraft_id ? 'กรุณาระบุ ID ของเครื่องบิน' : undefined
        }
      });
    }
  }

  // ตรวจสอบประเภทข้อมูล
  if (
    position !== undefined &&
    (!Number.isInteger(Number(position)) || Number(position) < 1)
  ) {
    return res.status(400).json({
      message: 'ตำแหน่งต้องเป็นตัวเลขจำนวนเต็มบวกและมากกว่า 0'
    });
  }

  next();
};

/**
 * ตรวจสอบข้อมูลการสร้างและอัปเดตข้อมูลการใช้น้ำมัน
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
exports.validateOilConsumptionData = (req, res, next) => {
  const { date, flight_hours, oil_added, engine_id } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็นเมื่อมีการสร้างข้อมูลการใช้น้ำมันใหม่
  if (req.method === 'POST') {
    if (
      !date ||
      flight_hours === undefined ||
      oil_added === undefined ||
      !engine_id
    ) {
      return res.status(400).json({
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        details: {
          date: !date ? 'กรุณาระบุวันที่' : undefined,
          flight_hours:
            flight_hours === undefined ? 'กรุณาระบุชั่วโมงบิน' : undefined,
          oil_added:
            oil_added === undefined
              ? 'กรุณาระบุปริมาณน้ำมันที่เติม'
              : undefined,
          engine_id: !engine_id ? 'กรุณาระบุ ID ของเครื่องยนต์' : undefined
        }
      });
    }
  }

  // ตรวจสอบประเภทข้อมูล
  if (
    flight_hours !== undefined &&
    (isNaN(Number(flight_hours)) || Number(flight_hours) < 0)
  ) {
    return res.status(400).json({
      message: 'ชั่วโมงบินต้องเป็นตัวเลขและไม่น้อยกว่า 0'
    });
  }

  if (
    oil_added !== undefined &&
    (isNaN(Number(oil_added)) || Number(oil_added) < 0)
  ) {
    return res.status(400).json({
      message: 'ปริมาณน้ำมันที่เติมต้องเป็นตัวเลขและไม่น้อยกว่า 0'
    });
  }

  next();
};
