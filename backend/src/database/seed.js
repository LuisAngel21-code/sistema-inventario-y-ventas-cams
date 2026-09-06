require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function seed() {
  console.log('Sembrando datos iniciales...');

  const { rows: existing } = await query('SELECT COUNT(*) as count FROM vendedores');
  if (existing[0].count > 0) {
    console.log('La base de datos ya tiene datos, seed omitido');
    return;
  }

  await query(`INSERT INTO categorias (nombre, descripcion) VALUES
    ('Camas', 'Camas de madera, tapizadas y más'),
    ('Colchones', 'Colchones de todas las marcas'),
    ('Bases', 'Bases para camas'),
    ('Accesorios', 'Almohadas, protectores y accesorios');
  `);

  await query(`INSERT INTO marcas (nombre) VALUES
    ('Propia'), ('Forbis'), ('Rosen'), ('Dormitorio'), ('Belcor');
  `);

  await query(`INSERT INTO vendedores (nombre, apellido, email, telefono, sueldo_fijo) VALUES
    ('María', 'García', 'maria@tienda.com', '987654321', 350),
    ('Carlos', 'López', 'carlos@tienda.com', '987654322', 350),
    ('Ana', 'Martínez', 'ana@tienda.com', '987654323', 350);
  `);

  const hashAdmin = await bcrypt.hash('cams2026', 10);
  const hashJorge = await bcrypt.hash('jorge2026', 10);

  await query(
    "INSERT INTO usuarios (vendedor_id, username, password, rol) VALUES (NULL, 'admin@cams.com', $1, 'admin')",
    [hashAdmin]
  );
  await query(
    "INSERT INTO usuarios (vendedor_id, username, password, rol) VALUES (NULL, 'jorge@gmail.com', $1, 'admin')",
    [hashJorge]
  );

  const hashAdmin2 = await bcrypt.hash('cams2026', 10);
  await query(
    "INSERT INTO usuarios (vendedor_id, username, password, rol) VALUES (NULL, 'admincamas@2.com', $1, 'administradora')",
    [hashAdmin2]
  );

  // Usuarios por HU — todos contra cams2026
  for (const [user, rol] of [
    ['almacen@cams.com', 'encargado_almacen'],
    ['produccion@cams.com', 'jefe_produccion'],
    ['ventas@cams.com', 'agente_ventas'],
    ['jefe@cams.com', 'jefe'],
  ]) {
    const h = await bcrypt.hash('cams2026', 10);
    await query("INSERT INTO usuarios (username, password, rol) VALUES ($1, $2, $3)", [user, h, rol]);
  }

  await query(`INSERT INTO productos (codigo, nombre, descripcion, costo, precio_base, stock, stock_minimo, categoria) VALUES
    ('CAMA-001', 'Cama Queen Size Clásica', 'Cama queen size de madera sólida', 2500.00, 3500.00, 10, 2, 'Camas'),
    ('CAMA-002', 'Cama King Size Premium', 'Cama king size con cabecero tapizado', 4000.00, 5600.00, 5, 1, 'Camas'),
    ('CAMA-003', 'Cama Individual Juvenil', 'Cama individual ideal para jóvenes', 1500.00, 2100.00, 15, 3, 'Camas'),
    ('COLCHON-001', 'Colchón Queen Size Ortopédico', 'Colchón ortopédico de espuma viscoelástica', 1800.00, 2520.00, 20, 5, 'Colchones'),
    ('COLCHON-002', 'Colchón King Size Premium', 'Colchón premium con resortes pocket', 3200.00, 4480.00, 8, 2, 'Colchones'),
    ('COLCHON-003', 'Colchón Individual Estándar', 'Colchón individual de resortes', 900.00, 1260.00, 25, 5, 'Colchones'),
    ('BASE-001', 'Base Queen Size', 'Base de madera para cama queen', 800.00, 1120.00, 12, 3, 'Bases'),
    ('BASE-002', 'Base King Size', 'Base de madera reforzada king size', 1200.00, 1680.00, 7, 2, 'Bases'),
    ('ALM-001', 'Almohada Viscoelástica', 'Almohada viscoelástica con memoria', 200.00, 280.00, 50, 10, 'Accesorios'),
    ('PROT-001', 'Protector de Colchón Queen', 'Protector impermeable queen size', 150.00, 210.00, 30, 5, 'Accesorios');
  `);

  console.log('Datos iniciales insertados correctamente');
  console.log('Usuarios creados:');
  console.log('  admin@cams.com / cams2026 (admin)');
  console.log('  admincamas@2.com / cams2026 (administradora)');
  console.log('  almacen@cams.com / cams2026 (encargado_almacen) — HU-04..07');
  console.log('  produccion@cams.com / cams2026 (jefe_produccion) — HU-08');
  console.log('  ventas@cams.com / cams2026 (agente_ventas) — HU-09,10');
  console.log('  jefe@cams.com / cams2026 (jefe) — HU-06,11,12');
}

seed().catch(err => {
  console.error('Error al sembrar datos:', err);
  process.exit(1);
});
