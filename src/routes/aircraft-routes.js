/**
 * เส้นทาง API สำหรับจัดการข้อมูลเครื่องบิน
 * @module routes/aircraftRoutes
 */

const express = require('express');
const router = express.Router();
const aircraftController = require('../controllers/aircraft-controller');
const { validateUUID } = require('../middleware/validators');

router.get('/', aircraftController.findAll);
router.get('/:id', validateUUID('id'), aircraftController.findOne);
router.post('/', aircraftController.create);
router.patch('/:id', validateUUID('id'), aircraftController.update);
router.delete('/:id', validateUUID('id'), aircraftController.remove);

module.exports = router;
