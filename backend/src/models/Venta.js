const { query, getConnection } = require('../config/database');
const { calcularSobreprecio } = require('../utils/calculations');

class Venta {
  static async findAll({ desde, hasta, vendedor_id }) {
    let sql = `SELECT v.id, v.fecha, v.total, v.tipo_venta, v.tipo_comprobante, v.metodo_pago, v.nro_comprobante,
               COALESCE(ve.nombre, t.nombre) AS vendedor_nombre,
               COALESCE(ve.apellido, t.apellido) AS vendedor_apellido
        FROM ventas v LEFT JOIN vendedores ve ON v.vendedor_id = ve.id
        LEFT JOIN trabajadores t ON v.trabajador_id = t.id WHERE 1=1`;
    const params = []; let idx = 1;
    if (desde) { sql += ` AND v.fecha >= $${idx++}`; params.push(desde); }
    if (hasta) { sql += ` AND v.fecha <= $${idx++}`; params.push(hasta); }
    if (vendedor_id) { sql += ` AND v.vendedor_id = $${idx++}`; params.push(vendedor_id); }
    sql += ' ORDER BY v.fecha DESC';
    const { rows } = await query(sql, params);
    return rows;
  }
  static async findById(id) {
    const { rows } = await query(`SELECT v.*, COALESCE(ve.nombre, t.nombre) AS vendedor_nombre,
      COALESCE(ve.apellido, t.apellido) AS vendedor_apellido,
      COALESCE(v.tipo_comprobante, 'boleta') as tipo_comprobante,
      COALESCE(v.metodo_pago, 'efectivo') as metodo_pago,
      COALESCE(v.nro_comprobante, '') as nro_comprobante
      FROM ventas v LEFT JOIN vendedores ve ON v.vendedor_id = ve.id LEFT JOIN trabajadores t ON v.trabajador_id = t.id WHERE v.id = $1`, [id]);
    if (!rows.length) return null;
    const venta = rows[0];
    const { rows: detalle } = await query(`SELECT dv.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo FROM detalle_ventas dv JOIN productos p ON dv.producto_id = p.id WHERE dv.venta_id = $1`, [id]);
    return { ...venta, detalle };
  }
  static async create(payload, files) {
    const { vendedor_id, trabajador_id, productos, tipo_comprobante, metodo_pago, nro_comprobante, tipo_venta, monto_acta } = payload;
    let prodList = productos; if (typeof prodList === 'string') prodList = JSON.parse(prodList);
    if ((!vendedor_id && !trabajador_id) || !prodList || !prodList.length) throw new Error('Debe especificar vendedor/encargado y al menos un producto');
    const comprobanteUrl = files?.comprobante ? `/uploads/comprobantes/${files.comprobante[0].filename}` : null;
    const voucherUrl = files?.voucher ? `/uploads/comprobantes/${files.voucher[0].filename}` : null;
    const esActa = tipo_venta && tipo_venta !== 'directa';
    const client = await getConnection();
    try {
      await client.query('BEGIN');
      if (vendedor_id) { const { rows } = await client.query('SELECT id FROM vendedores WHERE id = $1 AND activo = true', [vendedor_id]); if (!rows.length) throw new Error('Vendedor no encontrado'); }
      else { const { rows } = await client.query("SELECT id FROM trabajadores WHERE id = $1 AND tipo IN ('vendedor','encargado') AND activo = true", [trabajador_id]); if (!rows.length) throw new Error('Encargado no encontrado'); }
      let totalVenta = 0; const detalles = [];
      for (const item of prodList) {
        const { rows } = await client.query('SELECT id, nombre, costo, precio_base, stock FROM productos WHERE id = $1 AND activo = true', [item.producto_id]);
        if (!rows.length) throw new Error(`Producto ID ${item.producto_id} no encontrado`);
        if (rows[0].stock < (item.cantidad || 1)) throw new Error(`Stock insuficiente para ${rows[0].nombre}`);
        const cantidad = item.cantidad || 1; const precioFinal = item.precio_final || rows[0].precio_base;
        const sobreprecio = calcularSobreprecio(precioFinal, Number(rows[0].precio_base));
        const subtotal = Math.round(precioFinal * cantidad * 100) / 100;
        totalVenta += subtotal;
        detalles.push({ producto_id: item.producto_id, cantidad, costo_unitario: Number(rows[0].costo), precio_base_unitario: Number(rows[0].precio_base), precio_final_unitario: precioFinal, sobreprecio_unitario: sobreprecio, subtotal });
      }
      totalVenta = Math.round(totalVenta * 100) / 100;
      const montoTotal = esActa ? (Number(monto_acta) || 0) : totalVenta;
      const estadoVenta = esActa ? 'pendiente' : 'completada';
      if (esActa && !Number(monto_acta)) throw new Error('Monto del acta requerido');
      const { rows: ventaResult } = await client.query("INSERT INTO ventas (vendedor_id, trabajador_id, total, tipo_comprobante, metodo_pago, nro_comprobante, voucher_url, comprobante_url, estado, tipo_venta, monto_acta) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id", [vendedor_id || null, trabajador_id || null, montoTotal, tipo_comprobante, metodo_pago, nro_comprobante, voucherUrl, comprobanteUrl, estadoVenta, tipo_venta || 'directa', Number(monto_acta) || 0]);
      const ventaId = ventaResult[0].id;
      for (const det of detalles) {
        await client.query('INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, costo_unitario, precio_base_unitario, precio_final_unitario, sobreprecio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [ventaId, det.producto_id, det.cantidad, det.costo_unitario, det.precio_base_unitario, det.precio_final_unitario, det.sobreprecio_unitario, det.subtotal]);
        await client.query('UPDATE productos SET stock = stock - $1 WHERE id = $2', [det.cantidad, det.producto_id]);
        await client.query('INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia, venta_id) VALUES ($1,$2,$3,$4,$5)', [det.producto_id, 'salida', det.cantidad, `Venta #${ventaId}`, ventaId]);
      }
      await client.query('COMMIT');
      return { id: ventaId, total: montoTotal, message: 'Venta registrada exitosamente' };
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
  static async abonar(id, monto) {
    if (!monto || monto <= 0) throw new Error('Monto válido requerido');
    const client = await getConnection();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query("SELECT * FROM ventas WHERE id = $1 AND estado = 'pendiente' AND tipo_venta IN ('contrato', 'separacion') FOR UPDATE", [id]);
      if (!rows.length) throw new Error('Venta pendiente no encontrada');
      const nuevoActa = Number(rows[0].monto_acta) + Number(monto);
      const nuevoTotal = Number(rows[0].total) + Number(monto);
      const { rows: det } = await client.query('SELECT SUM(dv.precio_base_unitario * dv.cantidad) as total_base FROM detalle_ventas dv WHERE dv.venta_id = $1', [id]);
      const totalBase = Number(det[0]?.total_base) || 0;
      const completada = nuevoTotal >= totalBase;
      await client.query('UPDATE ventas SET monto_acta = $1, total = $2, estado = $3 WHERE id = $4', [nuevoActa, nuevoTotal, completada ? 'completada' : 'pendiente', id]);
      await client.query('COMMIT');
      return { message: completada ? 'Venta completada' : 'Abono registrado', total: nuevoTotal, estado: completada ? 'completada' : 'pendiente' };
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
  static async remove(id) {
    const client = await getConnection();
    try {
      await client.query('BEGIN');
      const { rows: detalles } = await client.query('SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = $1', [id]);
      for (const det of detalles) { await client.query('UPDATE productos SET stock = stock + $1 WHERE id = $2', [det.cantidad, det.producto_id]); }
      await client.query('DELETE FROM ventas WHERE id = $1', [id]);
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
}
module.exports = Venta;
