const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Condominium = require('./Condominium')(sequelize, DataTypes);
const Building = require('./Building')(sequelize, DataTypes);
const Document = require('./Document')(sequelize, DataTypes);
const User = require('./User')(sequelize, DataTypes);

Condominium.hasMany(Building, { foreignKey: 'condominiumId', as: 'buildings' });
Building.belongsTo(Condominium, { foreignKey: 'condominiumId', as: 'condominium' });

Condominium.hasMany(Document, { foreignKey: 'condominiumId', as: 'documents' });
Building.hasMany(Document, { foreignKey: 'buildingId', as: 'documents' });
Document.belongsTo(Condominium, { foreignKey: 'condominiumId', as: 'condominium' });
Document.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

module.exports = {
  sequelize,
  Sequelize,
  Condominium,
  Building,
  Document,
  User,
};
