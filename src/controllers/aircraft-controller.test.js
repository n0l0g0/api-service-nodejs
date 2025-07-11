/**
 * Unit tests สำหรับ Aircraft Controller
 * ทดสอบ business logic ของการจัดการข้อมูลเครื่องบิน
 */

const aircraftController = require('../../src/controllers/aircraft-controller');
const db = require('../../src/models');

// Mock database models
jest.mock('../../src/models', () => ({
  Aircraft: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}));

describe('Aircraft Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // สร้าง mock objects สำหรับแต่ละ test
    req = testHelpers.createMockRequest();
    res = testHelpers.createMockResponse();
    next = testHelpers.createMockNext();
    
    // ล้างค่า mocks
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('ควรส่งคืนรายการเครื่องบินทั้งหมดเมื่อสำเร็จ', async () => {
      // จัดเตรียมข้อมูล
      const mockAircraft = [
        {
          id: 'test-uuid-1',
          registration: 'HS-ABC',
          aircraft_type: 'Boeing 737',
          engine_type: 'CFM56',
          engine_qty: 2,
          active: true
        },
        {
          id: 'test-uuid-2',
          registration: 'HS-DEF',
          aircraft_type: 'Airbus A320',
          engine_type: 'V2500',
          engine_qty: 2,
          active: true
        }
      ];

      db.Aircraft.findAll.mockResolvedValue(mockAircraft);

      // ดำเนินการทดสอบ
      await aircraftController.findAll(req, res);

      // ตรวจสอบผลลัพธ์
      expect(db.Aircraft.findAll).toHaveBeenCalledWith({
        include: ['engines']
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAircraft);
    });

    it('ควรส่งคืน error 500 เมื่อเกิดข้อผิดพลาดจากฐานข้อมูล', async () => {
      // จัดเตรียมข้อมูล
      const errorMessage = 'Database connection error';
      db.Aircraft.findAll.mockRejectedValue(new Error(errorMessage));

      // ดำเนินการทดสอบ
      await aircraftController.findAll(req, res);

      // ตรวจสอบผลลัพธ์
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเครื่องบิน',
        error: undefined // ใน test NODE_ENV จะไม่เป็น development
      });
    });
  });

  describe('findOne', () => {
    it('ควรส่งคืนข้อมูลเครื่องบินเมื่อพบ ID ที่ระบุ', async () => {
      // จัดเตรียมข้อมูล
      const aircraftId = 'test-uuid-1';
      const mockAircraft = {
        id: aircraftId,
        registration: 'HS-ABC',
        aircraft_type: 'Boeing 737',
        engine_type: 'CFM56',
        engine_qty: 2,
        active: true
      };

      req.params.id = aircraftId;
      db.Aircraft.findByPk.mockResolvedValue(mockAircraft);

      // ดำเนินการทดสอบ
      await aircraftController.findOne(req, res);

      // ตรวจสอบผลลัพธ์
      expect(db.Aircraft.findByPk).toHaveBeenCalledWith(aircraftId, {
        include: ['engines']
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAircraft);
    });

    it('ควรส่งคืน error 404 เมื่อไม่พบเครื่องบินตาม ID ที่ระบุ', async () => {
      // จัดเตรียมข้อมูล
      const aircraftId = 'non-existent-id';
      req.params.id = aircraftId;
      db.Aircraft.findByPk.mockResolvedValue(null);

      // ดำเนินการทดสอบ
      await aircraftController.findOne(req, res);

      // ตรวจสอบผลลัพธ์
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: `ไม่พบเครื่องบินที่มี ID: ${aircraftId}`
      });
    });
  });

  describe('create', () => {
    it('ควรสร้างเครื่องบินใหม่เมื่อข้อมูลถูกต้อง', async () => {
      // จัดเตรียมข้อมูล
      const newAircraftData = {
        registration: 'HS-XYZ',
        aircraft_type: 'Boeing 777',
        engine_type: 'GE90',
        engine_qty: 2,
        active: true
      };

      const createdAircraft = {
        id: 'test-uuid-1234-5678-9012',
        ...newAircraftData
      };

      req.body = newAircraftData;
      db.Aircraft.findOne.mockResolvedValue(null); // ไม่มีเครื่องบินซ้ำ
      db.Aircraft.create.mockResolvedValue(createdAircraft);

      // ดำเนินการทดสอบ
      await aircraftController.create(req, res);

      // ตรวจสอบผลลัพธ์
      expect(db.Aircraft.create).toHaveBeenCalledWith({
        id: 'test-uuid-1234-5678-9012',
        ...newAircraftData
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdAircraft);
    });

    it('ควรส่งคืน error 400 เมื่อข้อมูลไม่ครบถ้วน', async () => {
      // จัดเตรียมข้อมูล
      req.body = {
        registration: 'HS-XYZ',
        // ขาดข้อมูลอื่นๆ
      };

      // ดำเนินการทดสอบ
      await aircraftController.create(req, res);

      // ตรวจสอบผลลัพธ์
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    });

    it('ควรส่งคืน error 400 เมื่อทะเบียนเครื่องบินซ้ำ', async () => {
      // จัดเตรียมข้อมูล
      const duplicateRegistration = 'HS-ABC';
      req.body = {
        registration: duplicateRegistration,
        aircraft_type: 'Boeing 777',
        engine_type: 'GE90',
        engine_qty: 2
      };

      const existingAircraft = {
        id: 'existing-id',
        registration: duplicateRegistration
      };

      db.Aircraft.findOne.mockResolvedValue(existingAircraft);

      // ดำเนินการทดสอบ
      await aircraftController.create(req, res);

      // ตรวจสอบผลลัพธ์
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: `ทะเบียนเครื่องบิน ${duplicateRegistration} มีอยู่ในระบบแล้ว`
      });
    });
  });

  describe('update', () => {
    it('ควรอัปเดตข้อมูลเครื่องบินเมื่อสำเร็จ', async () => {
      // จัดเตรียมข้อมูล
      const aircraftId = 'test-uuid-1';
      const updateData = {
        aircraft_type: 'Boeing 787',
        engine_type: 'GEnx'
      };

      const existingAircraft = {
        id: aircraftId,
        registration: 'HS-ABC',
        aircraft_type: 'Boeing 737',
        engine_type: 'CFM56'
      };

      const updatedAircraft = {
        ...existingAircraft,
        ...updateData
      };

      req.params.id = aircraftId;
      req.body = updateData;
      db.Aircraft.findByPk.mockResolvedValueOnce(existingAircraft)
                           .mockResolvedValueOnce(updatedAircraft);
      db.Aircraft.update.mockResolvedValue([1]); // 1 row affected

      // ดำเนินการทดสอบ
      await aircraftController.update(req, res);

      // ตรวจสอบผลลัพธ์
      expect(db.Aircraft.update).toHaveBeenCalledWith(updateData, {
        where: { id: aircraftId }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedAircraft);
    });

    it('ควรส่งคืน error 404 เมื่อไม่พบเครื่องบินที่จะอัปเดต', async () => {
      // จัดเตรียมข้อมูล
      const aircraftId = 'non-existent-id';
      req.params.id = aircraftId;
      req.body = { aircraft_type: 'Boeing 787' };
      db.Aircraft.findByPk.mockResolvedValue(null);

      // ดำเนินการทดสอบ
      await aircraftController.update(req, res);

      // ตรวจสอบผลลัพธ์
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: `ไม่พบเครื่องบินที่มี ID: ${aircraftId}`
      });
    });
  });

  describe('remove', () => {
    it('ควรลบเครื่องบินเมื่อสำเร็จ', async () => {
      // จัดเตรียมข้อมูล
      const aircraftId = 'test-uuid-1';
      const existingAircraft = {
        id: aircraftId,
        registration: 'HS-ABC'
      };

      req.params.id = aircraftId;
      db.Aircraft.findByPk.mockResolvedValue(existingAircraft);
      db.Aircraft.destroy.mockResolvedValue(1); // 1 row deleted

      // ดำเนินการทดสอบ
      await aircraftController.remove(req, res);

      // ตรวจสอบผลลัพธ์
      expect(db.Aircraft.destroy).toHaveBeenCalledWith({
        where: { id: aircraftId }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'ลบเครื่องบินเรียบร้อยแล้ว'
      });
    });

    it('ควรส่งคืน error 404 เมื่อไม่พบเครื่องบินที่จะลบ', async () => {
      // จัดเตรียมข้อมูล
      const aircraftId = 'non-existent-id';
      req.params.id = aircraftId;
      db.Aircraft.findByPk.mockResolvedValue(null);

      // ดำเนินการทดสอบ
      await aircraftController.remove(req, res);

      // ตรวจสอบผลลัพธ์
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: `ไม่พบเครื่องบินที่มี ID: ${aircraftId}`
      });
    });
  });
});