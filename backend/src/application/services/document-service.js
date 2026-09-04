const { Document, Condominium, Building } = require('../../models');

const includeRelations = [
  { model: Condominium, as: 'condominium' },
  { model: Building, as: 'building' },
];

function list() {
  return Document.findAll({ include: includeRelations, order: [['expirationDate', 'ASC']] });
}

function create(data, file) {
  return Document.create({ ...data, fileUrl: file ? `/uploads/${file.filename}` : data.fileUrl });
}

async function update(id, data, file) {
  const document = await Document.findByPk(id);
  if (!document) return null;
  await document.update({ ...data, ...(file ? { fileUrl: `/uploads/${file.filename}` } : {}) });
  return document;
}

async function remove(id) {
  const document = await Document.findByPk(id);
  if (!document) return false;
  await document.destroy();
  return true;
}

module.exports = { list, create, update, remove };
