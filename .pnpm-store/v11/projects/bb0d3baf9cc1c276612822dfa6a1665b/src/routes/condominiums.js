const express = require('express');
const controller = require('../interfaces/http/controllers/crud-controller');

const router = express.Router();

router.get('/', controller.listCondominiums);
router.get('/:id', controller.getCondominium);
router.post('/', controller.createCondominium);
router.put('/:id', controller.updateCondominium);
router.delete('/:id', controller.deleteCondominium);

module.exports = router;
