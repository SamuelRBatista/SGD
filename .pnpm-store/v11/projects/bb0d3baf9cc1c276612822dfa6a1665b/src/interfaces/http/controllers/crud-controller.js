const condominiumService = require('../../../application/services/condominium-service');
const buildingService = require('../../../application/services/building-service');
const dashboardService = require('../../../application/services/dashboard-service');

const respond = (handler, success = 200) => async (req, res) => {
  try { res.status(success).json(await handler(req)); } catch (error) { res.status(400).json({ message: error.message }); }
};
const found = (handler, label) => async (req, res) => {
  try { const item = await handler(req); item ? res.json(item) : res.status(404).json({ message: `${label} não encontrado` }); } catch (error) { res.status(400).json({ message: error.message }); }
};

module.exports = {
  listCondominiums: respond(() => condominiumService.list()),
  getCondominium: found((req) => condominiumService.findById(req.params.id), 'Condomínio'),
  createCondominium: respond((req) => condominiumService.create(req.body), 201),
  updateCondominium: found((req) => condominiumService.update(req.params.id, req.body), 'Condomínio'),
  deleteCondominium: async (req, res) => { try { (await condominiumService.remove(req.params.id)) ? res.status(204).end() : res.status(404).json({ message: 'Condomínio não encontrado' }); } catch (error) { res.status(400).json({ message: error.message }); } },
  listBuildings: respond(() => buildingService.list()),
  createBuilding: respond((req) => buildingService.create(req.body), 201),
  updateBuilding: found((req) => buildingService.update(req.params.id, req.body), 'Bloco'),
  dashboardSummary: respond(() => dashboardService.summary()),
  dashboardUpcoming: respond(() => dashboardService.upcoming()),
};
