const { query } = require('../config/database');
const { calcularPrecioBase } = require('../utils/calculations');

class Producto {
  static async findAll({ activo } = {}) {
    let sql = 'SELECT id, codigo, nombre, descripcion, costo, precio_base, precio_venta, stock, stock_minimo, categoria, categoria_id, marca_id, proveedor, tipo, medida, tipo_tela, imagen_url, activo FROM productos';
    const params = []; const conditions = [];
    if (activo !== undefined) { conditions.push(`activo = $${params.length + 1}`); params.push(activo === 'true' ? true : false); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY nombre';
    const { rows } = await query(sql, params);
    return rows;
  }
  static async findById(id) {
    const { rows } = await query('SELECT * FROM productos WHERE id = $1', [id]);
    return rows[0] || null;
  }
  static async create(data) {
    const precio_base = calcularPrecioBase(data.costo);
    const { rows } = await query(
      'INSERT INTO productos (codigo, nombre, descripcion, costo, precio_base, precio_venta, stock, stock_minimo, categoria, categoria_id, marca_id, proveedor, tipo, medida, tipo_tela) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id, precio_base',
      [data.codigo, data.nombre, data.descripcion, data.costo, precio_base, data.precio_venta || null, data.stock || 0, data.stock_minimo || 0, data.categoria, data.categoria_id || null, data.marca_id || null, data.proveedor || null, data.tipo || null, data.medida || null, data.tipo_tela || null]
    );
    if (data.stock > 0) await query('INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia) VALUES ($1,$2,$3,$4)', [rows[0].id, 'entrada', data.stock, 'Stock inicial']);
    return rows[0];
  }
  static async update(id, data) {
    const fields = []; const params = []; let idx = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      if (k === 'costo') { fields.push(`costo = $${idx++}`); params.push(v); fields.push(`precio_base = $${idx++}`); params.push(calcularPrecioBase(v)); }
      else { fields.push(`${k} = $${idx++}`); params.push(v); }
    }
    if (!fields.length) throw new Error('No hay campos para actualizar');
    params.push(id);
    await query(`UPDATE productos SET ${fields.join(', ')} WHERE id = $${idx}`, params);
  }
  static async softDelete(id) { await query('UPDATE productos SET activo = false WHERE id = $1', [id]); }
  static async activar(id) { await query('UPDATE productos SET activo = true WHERE id = $1', [id]); }
}
module.exports = Producto;
