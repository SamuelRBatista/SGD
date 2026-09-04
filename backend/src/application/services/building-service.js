const { Building, Condominium } = require('../../models');

function list() { return Building.findAll({ include: [{ model: Condominium, as: 'condominium' }], order: [['createdAt', 'DESC']] }); }
function create(data) { return Building.create(data); }
async function update(id, data) { const item = await Building.findByPk(id); return item ? (await item.update(data), item) : null; }

module.exports = { list, create, update };
