const documentService = require('../../../application/services/document-service');

async function list(_req, res) {
  try { res.json(await documentService.list()); } catch (error) { res.status(500).json({ message: error.message }); }
}

async function create(req, res) {
  try { res.status(201).json(await documentService.create(req.body, req.file)); } catch (error) { res.status(400).json({ message: error.message }); }
}

async function update(req, res) {
  try {
    const document = await documentService.update(req.params.id, req.body, req.file);
    if (!document) return res.status(404).json({ message: 'Documento não encontrado' });
    res.json(document);
  } catch (error) { res.status(400).json({ message: error.message }); }
}

async function remove(req, res) {
  try {
    if (!(await documentService.remove(req.params.id))) return res.status(404).json({ message: 'Documento não encontrado' });
    res.status(204).end();
  } catch (error) { res.status(400).json({ message: error.message }); }
}

module.exports = { list, create, update, remove };
