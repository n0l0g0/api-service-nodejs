/**
 * เส้นทาง API สำหรับจัดการข้อมูลเครื่องยนต์
 * @module routes/engineRoutes
 */

const express = require('express');
const router = express.Router();
const engineController = require('../controllers/engine-controller');
const {
  validateUUID,
  validateEngineData
} = require('../middleware/validators');

router.get('/', engineController.findAll);
router.get('/:id', validateUUID('id'), engineController.findOne);
router.get(
  '/aircraft/:aircraft_id',
  validateUUID('aircraft_id'),
  engineController.findByAircraft
);
router.post('/', validateEngineData, engineController.create);
router.patch('/:id', validateUUID('id'), engineController.update);
router.delete('/:id', validateUUID('id'), engineController.remove);

module.exports = router;
