const Producto = require('../models/Producto');
exports.getAll = async (req, res) => {
  try { res.json(await Producto.findAll(req.query)); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.getById = async (req, res) => {
  try {
    const p = await Producto.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.create = async (req, res) => {
  try { const r = await Producto.create(req.body); res.status(201).json({ ...r, message: 'Producto creado exitosamente' }); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.update = async (req, res) => {
  try { await Producto.update(req.params.id, req.body); res.json({ message: 'Producto actualizado exitosamente' }); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.remove = async (req, res) => {
  try { await Producto.softDelete(req.params.id); res.json({ message: 'Producto desactivado' }); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.activar = async (req, res) => {
  try { await Producto.activar(req.params.id); res.json({ message: 'Producto activado' }); } catch (e) { res.status(500).json({ error: e.message }); }
};
