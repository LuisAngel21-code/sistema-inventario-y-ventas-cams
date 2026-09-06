const Venta = require('../models/Venta');
exports.getAll = async (req, res) => {
  try { res.json(await Venta.findAll(req.query)); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.getById = async (req, res) => {
  try { const v = await Venta.findById(req.params.id); if (!v) return res.status(404).json({ error: 'Venta no encontrada' }); res.json(v); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.create = async (req, res) => {
  try { const r = await Venta.create(req.body, req.files); res.status(201).json(r); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.abonar = async (req, res) => {
  try { const r = await Venta.abonar(req.params.id, req.body.monto); res.json(r); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.remove = async (req, res) => {
  try { await Venta.remove(req.params.id); res.json({ message: 'Venta eliminada. Stock restaurado.' }); } catch (e) { res.status(500).json({ error: e.message }); }
};
