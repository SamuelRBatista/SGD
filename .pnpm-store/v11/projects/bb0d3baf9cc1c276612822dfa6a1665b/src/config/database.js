const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não foi definida. Configure o arquivo .env antes de iniciar a API.');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  define: { schema: 'sgld' },
  dialectOptions: process.env.DB_SSL === 'true'
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS sgld');
    console.log('Conexão com o PostgreSQL estabelecida com sucesso.');
  } catch (error) {
    console.error('Não foi possível conectar ao PostgreSQL:', error);
    process.exit(1);
  }
}

async function syncDatabase() {
  await sequelize.sync();
  console.log('Banco de dados sincronizado.');
}

async function seedDatabase() {
  const { Condominium, Building, Document, User } = require('../models');
  const bcrypt = require('bcryptjs');

  const condominiumCount = await Condominium.count();
  if (condominiumCount > 0) {
    const userCount = await User.count();
    if (userCount === 0) {
      await User.create({
        name: 'Síndico Admin',
        email: 'admin@sgld.com.br',
        password: await bcrypt.hash('123456', 10),
        role: 'sindico',
        isActive: true,
      });
    }
    return;
  }

  const condominium = await Condominium.create({
    name: 'Residencial Jardins',
    cnpj: '12.345.678/0001-90',
    address: 'Rua das Flores, 120, Centro',
    city: 'São Paulo',
    state: 'SP',
    email: 'admin@residencialjardins.com.br',
    phone: '(11) 3333-4444',
  });

  const building = await Building.create({
    name: 'Bloco A',
    address: 'Rua das Flores, 120, Bloco A',
    totalUnits: 48,
    condominiumId: condominium.id,
  });

  await Document.bulkCreate([
    {
      title: 'Alvará de Funcionamento',
      documentType: 'alvara',
      category: 'legal',
      issuingBody: 'Prefeitura Municipal',
      status: 'em_dia',
      issueDate: '2025-01-10',
      expirationDate: '2026-12-31',
      responsible: 'Administradora ABC',
      fileUrl: 'https://example.com/alvara.pdf',
      notificationDays: 45,
      condominiumId: condominium.id,
      buildingId: building.id,
    },
    {
      title: 'Vistoria do Sistema Elétrico',
      documentType: 'vistoria',
      category: 'seguranca',
      issuingBody: 'Empresa de Segurança e Vistorias',
      status: 'proximo_vencimento',
      issueDate: '2024-06-12',
      expirationDate: '2026-09-15',
      responsible: 'Engenharia Delta',
      fileUrl: 'https://example.com/vistoria-eletrica.pdf',
      notificationDays: 30,
      condominiumId: condominium.id,
      buildingId: building.id,
    },
    {
      title: 'Laudo de Estrutura',
      documentType: 'laudo',
      category: 'manutencao',
      issuingBody: 'Engenharia e Consultoria',
      status: 'vencido',
      issueDate: '2023-09-18',
      expirationDate: '2026-08-01',
      responsible: 'Consultor Estrutural',
      fileUrl: 'https://example.com/laudo-estrutura.pdf',
      notificationDays: 15,
      condominiumId: condominium.id,
      buildingId: building.id,
    },
  ]);

  await User.create({
    name: 'Síndico Admin',
    email: 'admin@sgld.com.br',
    password: await bcrypt.hash('123456', 10),
    role: 'sindico',
    isActive: true,
  });

  console.log('Dados iniciais do condomínio carregados.');
}

module.exports = {
  sequelize,
  connectDB,
  syncDatabase,
  seedDatabase,
};
