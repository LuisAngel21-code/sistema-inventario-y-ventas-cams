require('dotenv').config();
const { query } = require('../config/database');

async function initDatabase() {
  console.log('Inicializando base de datos...');

  await query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      descripcion TEXT,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS marcas (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS vendedores (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      apellido VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE,
      telefono VARCHAR(20),
      activo BOOLEAN DEFAULT TRUE,
      sueldo_fijo DECIMAL(10,2) DEFAULT 350.00,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      codigo VARCHAR(50) UNIQUE,
      nombre VARCHAR(200) NOT NULL,
      descripcion TEXT,
      costo DECIMAL(10,2) NOT NULL,
      precio_base DECIMAL(10,2) NOT NULL,
      precio_venta DECIMAL(10,2),
      stock INTEGER DEFAULT 0,
      stock_minimo INTEGER DEFAULT 0,
      categoria VARCHAR(100),
      categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
      marca_id INTEGER REFERENCES marcas(id) ON DELETE SET NULL,
      imagen_url TEXT,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS ventas (
      id SERIAL PRIMARY KEY,
      vendedor_id INTEGER NOT NULL REFERENCES vendedores(id) ON DELETE RESTRICT,
      fecha TIMESTAMP DEFAULT NOW(),
      total DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id SERIAL PRIMARY KEY,
      venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
      producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
      cantidad INTEGER DEFAULT 1,
      costo_unitario DECIMAL(10,2) NOT NULL,
      precio_base_unitario DECIMAL(10,2) NOT NULL,
      precio_final_unitario DECIMAL(10,2) NOT NULL,
      sobreprecio_unitario DECIMAL(10,2) DEFAULT 0.00,
      subtotal DECIMAL(10,2) NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS inventario_movimientos (
      id SERIAL PRIMARY KEY,
      producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
      cantidad INTEGER NOT NULL,
      referencia VARCHAR(200),
      venta_id INTEGER REFERENCES ventas(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      vendedor_id INTEGER REFERENCES vendedores(id) ON DELETE SET NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      rol VARCHAR(20) NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS compras (
      id SERIAL PRIMARY KEY,
      proveedor VARCHAR(200),
      fecha TIMESTAMP DEFAULT NOW(),
      total DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS detalle_compras (
      id SERIAL PRIMARY KEY,
      compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
      producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
      cantidad INTEGER NOT NULL,
      costo_unitario DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS pagos_vendedor (
      id SERIAL PRIMARY KEY,
      vendedor_id INTEGER NOT NULL REFERENCES vendedores(id) ON DELETE RESTRICT,
      semana_inicio DATE NOT NULL,
      semana_fin DATE NOT NULL,
      sueldo_base DECIMAL(10,2) DEFAULT 350.00,
      total_comision DECIMAL(10,2) DEFAULT 0.00,
      total_sobreprecio DECIMAL(10,2) DEFAULT 0.00,
      total_pago DECIMAL(10,2) DEFAULT 0.00,
      estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
      pagado_en TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS caja_sesiones (
      id SERIAL PRIMARY KEY,
      fecha_apertura TIMESTAMP DEFAULT NOW(),
      fecha_cierre TIMESTAMP,
      saldo_inicial DECIMAL(10,2) DEFAULT 0,
      saldo_final DECIMAL(10,2),
      total_ingresos DECIMAL(10,2) DEFAULT 0,
      total_egresos DECIMAL(10,2) DEFAULT 0,
      estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS caja_movimientos (
      id SERIAL PRIMARY KEY,
      sesion_id INTEGER NOT NULL REFERENCES caja_sesiones(id) ON DELETE CASCADE,
      fecha TIMESTAMP DEFAULT NOW(),
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
      tipo_pago VARCHAR(30) NOT NULL,
      nro_comprobante VARCHAR(50),
      descripcion TEXT,
      monto DECIMAL(10,2) NOT NULL,
      saldo_despues DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS entregas (
      id SERIAL PRIMARY KEY,
      venta_id INTEGER REFERENCES ventas(id) ON DELETE SET NULL,
      cliente VARCHAR(200),
      direccion TEXT NOT NULL,
      distrito VARCHAR(100),
      referencia TEXT,
      fecha_entrega DATE NOT NULL,
      hora_programada TIME,
      telefono VARCHAR(20),
      producto VARCHAR(200),
      observaciones TEXT,
      estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_ruta', 'entregado', 'cancelado')),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS agenda (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(200) NOT NULL,
      fecha DATE NOT NULL,
      hora TIME,
      descripcion TEXT,
      tipo VARCHAR(30) DEFAULT 'recordatorio' CHECK (tipo IN ('recordatorio', 'cita', 'pago', 'entrega')),
      completado BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS cuentas_pagar (
      id SERIAL PRIMARY KEY,
      proveedor VARCHAR(200) NOT NULL,
      concepto VARCHAR(200) NOT NULL,
      monto_total DECIMAL(10,2) NOT NULL,
      cuotas INTEGER DEFAULT 1,
      monto_cuota DECIMAL(10,2) NOT NULL,
      cuotas_pagadas INTEGER DEFAULT 0,
      fecha_inicio DATE NOT NULL,
      fecha_fin DATE,
      periodicidad VARCHAR(20) DEFAULT 'semanal' CHECK (periodicidad IN ('semanal', 'quincenal', 'mensual')),
      estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'pagada', 'cancelada')),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS pagos_cuenta (
      id SERIAL PRIMARY KEY,
      cuenta_id INTEGER NOT NULL REFERENCES cuentas_pagar(id) ON DELETE CASCADE,
      nro_cuota INTEGER NOT NULL,
      monto DECIMAL(10,2) NOT NULL,
      metodo_pago VARCHAR(30),
      observaciones TEXT,
      fecha_pago TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS trabajadores (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      apellido VARCHAR(100) NOT NULL,
      tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('vendedor', 'destajista', 'jornalero')),
      telefono VARCHAR(20),
      email VARCHAR(150),
      sueldo_semanal DECIMAL(10,2) DEFAULT 0,
      tarifa_por_unidad DECIMAL(10,2) DEFAULT 0,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS pagos_trabajadores (
      id SERIAL PRIMARY KEY,
      trabajador_id INTEGER NOT NULL REFERENCES trabajadores(id),
      semana_inicio DATE NOT NULL,
      semana_fin DATE NOT NULL,
      tipo_pago VARCHAR(30) NOT NULL,
      unidades INTEGER DEFAULT 0,
      total_pagar DECIMAL(10,2) NOT NULL,
      estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
      pagado_en TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='caja_movimientos' AND column_name='categoria') THEN
        ALTER TABLE caja_movimientos ADD COLUMN categoria VARCHAR(30) DEFAULT 'gasto';
      END IF;
    END $$;
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_caja_sesion ON caja_movimientos(sesion_id);`);
  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos_trabajadores' AND column_name='monto_pagado') THEN
        ALTER TABLE pagos_trabajadores ADD COLUMN monto_pagado DECIMAL(10,2);
        ALTER TABLE pagos_trabajadores ADD COLUMN saldo DECIMAL(10,2) DEFAULT 0;
      END IF;
    END $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS configuracion (
      id SERIAL PRIMARY KEY,
      clave VARCHAR(100) UNIQUE NOT NULL,
      valor VARCHAR(255),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_pagos_trabajador ON pagos_trabajadores(trabajador_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_entregas_fecha ON entregas(fecha_entrega);`);
  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos_vendedor' AND column_name='adelanto') THEN
        ALTER TABLE pagos_vendedor ADD COLUMN adelanto DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE pagos_vendedor ADD COLUMN fecha_adelanto TIMESTAMP;
      END IF;
    END $$;
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_agenda_fecha ON agenda(fecha);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(vendedor_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_detalle_venta ON detalle_ventas(venta_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON inventario_movimientos(producto_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON inventario_movimientos(tipo);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pagos_vendedor ON pagos_vendedor(vendedor_id);`);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ventas' AND column_name='estado') THEN
        ALTER TABLE ventas ADD COLUMN estado VARCHAR(20) DEFAULT 'completada';
      END IF;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
      ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin','administrador','vendedor','administradora','encargado_almacen','jefe_produccion','agente_ventas','jefe'));
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trabajadores' AND column_name='sueldo_mensual') THEN
        ALTER TABLE trabajadores ADD COLUMN sueldo_mensual DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE trabajadores DROP CONSTRAINT IF EXISTS trabajadores_tipo_check;
        ALTER TABLE trabajadores ADD CONSTRAINT trabajadores_tipo_check CHECK (tipo IN ('jornalero', 'destajista', 'encargado'));
      END IF;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagos_trabajadores' AND column_name='sueldo_base') THEN
        ALTER TABLE pagos_trabajadores ADD COLUMN sueldo_base DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE pagos_trabajadores ADD COLUMN total_comision DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE pagos_trabajadores ADD COLUMN total_sobreprecio DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE pagos_trabajadores ADD COLUMN adelanto DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE pagos_trabajadores ADD COLUMN fecha_adelanto TIMESTAMP;
      END IF;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ventas' AND column_name='trabajador_id') THEN
        ALTER TABLE ventas ADD COLUMN trabajador_id INTEGER REFERENCES trabajadores(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ventas' AND column_name='tipo_venta') THEN
        ALTER TABLE ventas ADD COLUMN tipo_venta VARCHAR(20) DEFAULT 'directa';
        ALTER TABLE ventas ADD COLUMN monto_acta DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_estado_check;
        ALTER TABLE ventas ADD CONSTRAINT ventas_estado_check CHECK (estado IN ('completada', 'pendiente'));
      END IF;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='proveedor') THEN
        ALTER TABLE productos ADD COLUMN proveedor VARCHAR(200);
        ALTER TABLE productos ADD COLUMN tipo VARCHAR(50);
      END IF;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ventas' AND column_name='tipo_comprobante') THEN
        ALTER TABLE ventas ADD COLUMN tipo_comprobante VARCHAR(20) NOT NULL DEFAULT 'boleta';
        ALTER TABLE ventas ADD COLUMN metodo_pago VARCHAR(30) NOT NULL DEFAULT 'efectivo';
        ALTER TABLE ventas ADD COLUMN nro_comprobante VARCHAR(50) NOT NULL DEFAULT '';
        ALTER TABLE ventas ADD COLUMN voucher_url TEXT;
        ALTER TABLE ventas ADD COLUMN comprobante_url TEXT;
      END IF;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='tipo_tela') THEN
        ALTER TABLE productos ADD COLUMN tipo_tela VARCHAR(100);
      END IF;
    END $$;
  `);

  console.log('Base de datos inicializada correctamente');
}

initDatabase().catch(err => {
  console.error('Error al inicializar BD:', err);
  process.exit(1);
});
