const { query, getConnection } = require('../config/database');
class Inventario {
  static async getStock() {
    const { rows } = await query(`
      SELECT id, codigo, nombre, categoria, medida, costo, precio_base, stock, stock_minimo,
        CASE WHEN stock <= 0 THEN 'sin_stock' WHEN stock <= stock_minimo THEN 'bajo' ELSE 'normal' END as estado_stock
      FROM productos WHERE activo = true ORDER BY nombre`);
    return rows;
  }
  static async getMovimientos({ producto_id, tipo }) {
    let sql = `SELECT im.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo, p.medida FROM inventario_movimientos im JOIN productos p ON im.producto_id = p.id WHERE 1=1`;
    const params = []; let idx = 1;
    if (tipo) { sql += ` AND im.tipo = $${idx++}`; params.push(tipo); }
    if (producto_id) { sql += ` AND im.producto_id = $${idx++}`; params.push(producto_id); }
    sql += ' ORDER BY im.created_at DESC LIMIT 200';
    const { rows } = await query(sql, params);
    return rows;
  }
  static async entradaStock({ producto_id, cantidad, referencia }) {
    const client = await getConnection();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT id, nombre FROM productos WHERE id = $1 AND activo = true', [producto_id]);
      if (!rows.length) throw new Error('Producto no encontrado');
      await client.query('UPDATE productos SET stock = stock + $1 WHERE id = $2', [cantidad, producto_id]);
      await client.query('INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia) VALUES ($1,$2,$3,$4)', [producto_id, 'entrada', cantidad, referencia || 'Entrada manual']);
      await client.query('COMMIT');
      return rows[0];
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
}
module.exports = Inventario;
