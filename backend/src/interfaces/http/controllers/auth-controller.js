const authService = require('../../../application/services/auth-service');

async function login(req, res) {
  try {
    res.json(await authService.login(req.body));
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

async function register(req, res) {
  try {
    res.status(201).json(await authService.register(req.body));
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
}

module.exports = { login, register };
