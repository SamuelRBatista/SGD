const express = require('express');
const controller = require('../interfaces/http/controllers/crud-controller');

const router = express.Router();

router.get('/', controller.listBuildings);
router.post('/', controller.createBuilding);
router.put('/:id', controller.updateBuilding);

module.exports = router;
