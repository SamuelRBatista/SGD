module.exports = (sequelize, DataTypes) => {
  const Building = sequelize.define(
    'Building',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      totalUnits: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      condominiumId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'buildings',
      timestamps: true,
    },
  );

  return Building;
};
