const { Document, Condominium, Building } = require('../../models');
const { Op } = require('sequelize');

async function summary() {
  const documents = await Document.findAll();
  return {
    totalDocuments: documents.length,
    documentsEmDia: documents.filter((document) => document.status === 'em_dia').length,
    proximosVencimentos: documents.filter((document) => document.status === 'proximo_vencimento').length,
    vencidos: documents.filter((document) => document.status === 'vencido').length,
    totalCondominiums: await Condominium.count(),
    totalBuildings: await Building.count(),
  };
}

function upcoming() {
  const today = new Date();
  const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  return Document.findAll({
    where: { expirationDate: { [Op.between]: [today, endDate] }, status: { [Op.ne]: 'vencido' } },
    include: [{ model: Condominium, as: 'condominium' }], order: [['expirationDate', 'ASC']], limit: 10,
  });
}

module.exports = { summary, upcoming };
