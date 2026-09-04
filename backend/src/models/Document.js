module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    'Document',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      documentType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      issuingBody: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'em_dia',
      },
      issueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      expirationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      responsible: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notificationDays: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
      },
      condominiumId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      buildingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'documents',
      timestamps: true,
    },
  );

  return Document;
};
