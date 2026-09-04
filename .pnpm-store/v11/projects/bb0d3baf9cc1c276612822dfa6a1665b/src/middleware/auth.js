const jwt = require('jsonwebtoken');
const { User } = require('../models');

function authMiddleware() {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de acesso ausente ou inválido.' });
      }

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não configurada.');
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Usuário não autorizado.' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Sessão inválida.' });
    }
  };
}

module.exports = authMiddleware;
