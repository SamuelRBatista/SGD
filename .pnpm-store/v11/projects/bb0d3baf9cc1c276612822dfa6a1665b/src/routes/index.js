const express = require('express');
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const condominiumRoutes = require('./condominiums');
const buildingRoutes = require('./buildings');
const documentRoutes = require('./documents');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', authMiddleware(), dashboardRoutes);
router.use('/condominiums', authMiddleware(), condominiumRoutes);
router.use('/buildings', authMiddleware(), buildingRoutes);
router.use('/documents', authMiddleware(), documentRoutes);

module.exports = router;
