const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não foi definida.');
  }
  return process.env.JWT_SECRET;
};

async function login({ email, password }) {
  if (!email || !password) {
    const error = new Error('E-mail e senha são obrigatórios.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const error = new Error('Credenciais inválidas.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '8h' },
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

async function register({ name, email, password }) {
  if (!name || !email || !password) {
    const error = new Error('Nome, e-mail e senha são obrigatórios.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase();
  if (await User.findOne({ where: { email: normalizedEmail } })) {
    const error = new Error('Este e-mail já está cadastrado.');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    role: 'sindico',
  });

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

module.exports = { login, register };
