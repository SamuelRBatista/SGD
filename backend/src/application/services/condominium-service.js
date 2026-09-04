const { Condominium, Building, Document } = require('../../models');

const includeRelations = [{ model: Building, as: 'buildings' }, { model: Document, as: 'documents' }];

function list() { return Condominium.findAll({ include: includeRelations, order: [['createdAt', 'DESC']] }); }
function findById(id) { return Condominium.findByPk(id, { include: includeRelations }); }
function create(data) { return Condominium.create(data); }
async function update(id, data) { const item = await Condominium.findByPk(id); return item ? (await item.update(data), item) : null; }
async function remove(id) { const item = await Condominium.findByPk(id); if (!item) return false; await item.destroy(); return true; }

module.exports = { list, findById, create, update, remove };
