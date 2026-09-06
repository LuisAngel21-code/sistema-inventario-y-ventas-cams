const Inventario = require('../models/Inventario');
exports.getStock = async (req, res) => {
  try { res.json(await Inventario.getStock()); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.getMovimientos = async (req, res) => {
  try { res.json(await Inventario.getMovimientos(req.query)); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.entradaStock = async (req, res) => {
  try {
    const { producto_id, cantidad, referencia } = req.body;
    if (!producto_id || !cantidad || cantidad <= 0) return res.status(400).json({ error: 'Producto y cantidad válida requeridos' });
    const p = await Inventario.entradaStock({ producto_id, cantidad, referencia });
    res.json({ message: `Stock actualizado para ${p.nombre}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
