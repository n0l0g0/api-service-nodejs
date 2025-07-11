/**
 * เส้นทาง API สำหรับจัดการข้อมูลการใช้น้ำมันเครื่อง
 * @module routes/oilConsumptionRoutes
 */

const express = require('express');
const router = express.Router();
const oilConsumptionController = require('../controllers/oil-consumption-controller');
const {
  validateUUID,
  validateOilConsumptionData
} = require('../middleware/validators');

router.get('/', oilConsumptionController.findAll);
router.get('/:id', validateUUID('id'), oilConsumptionController.findOne);
router.get(
  '/engine/:engine_id',
  validateUUID('engine_id'),
  oilConsumptionController.findByEngine
);
router.post('/', validateOilConsumptionData, oilConsumptionController.create);
router.patch('/:id', validateUUID('id'), oilConsumptionController.update);
router.delete('/:id', validateUUID('id'), oilConsumptionController.remove);

module.exports = router;
