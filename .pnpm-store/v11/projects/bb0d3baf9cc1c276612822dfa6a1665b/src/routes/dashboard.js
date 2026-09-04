const express = require('express');
const controller = require('../interfaces/http/controllers/crud-controller');

const router = express.Router();

router.get('/summary', controller.dashboardSummary);
router.get('/upcoming', controller.dashboardUpcoming);

module.exports = router;
