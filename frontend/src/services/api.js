const TOKEN_KEY = 'muebleria_cams_auth';

function getToken() {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    return JSON.parse(stored).token;
  } catch { return null; }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(endpoint, config);

    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      if (data.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
        throw new Error('Sesión expirada');
      }
      throw new Error(data.error || 'No autorizado');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Error de conexión con el servidor');
    }
    throw err;
  }
}

export const authAPI = {
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    }),
  me: () => request('/api/auth/me'),
};

export const vendedoresAPI = {
  getAll: () => request('/api/vendedores'),
  getById: (id) => request(`/api/vendedores/${id}`),
  create: (data) => request('/api/vendedores', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/vendedores/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/api/vendedores/${id}`, { method: 'DELETE' }),
  activar: (id) => request(`/api/vendedores/${id}/activar`, { method: 'PUT' }),
};

export const productosAPI = {
  getAll: (activo) => request(`/api/productos${activo ? '?activo=true' : ''}`),
  getById: (id) => request(`/api/productos/${id}`),
  create: (data) => request('/api/productos', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/productos/${id}`, { method: 'PUT', body: data }),
  activar: (id) => request(`/api/productos/${id}/activar`, { method: 'PUT' }),
  remove: (id) => request(`/api/productos/${id}`, { method: 'DELETE' }),
};

export const ventasAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/ventas${qs ? '?' + qs : ''}`);
  },
  getById: (id) => request(`/api/ventas/${id}`),
  create: (data) => request('/api/ventas', { method: 'POST', body: data }),
  createWithFiles: (formData) => {
    const token = getToken();
    return fetch('/api/ventas', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor');
      return data;
    });
  },
  remove: (id) => request(`/api/ventas/${id}`, { method: 'DELETE' }),
  abonar: (id, monto) => request(`/api/ventas/${id}/abonar`, { method: 'PUT', body: { monto } }),
};

export const inventarioAPI = {
  getStock: () => request('/api/inventario/stock'),
  getMovimientos: (tipo) =>
    request(`/api/inventario/movimientos${tipo ? '?tipo=' + tipo : ''}`),
  entradaStock: (data) => request('/api/inventario/entrada', { method: 'POST', body: data }),
};

export function getDownloadUrl(path) {
  const token = getToken();
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}token=${encodeURIComponent(token || '')}`;
}

export const reportesAPI = {
  vendedor: (id, desde, hasta) => {
    const qs = new URLSearchParams({ desde, hasta }).toString();
    return getDownloadUrl(`/api/reportes/vendedor/${id}?${qs}`);
  },
  trabajador: (id, fuente, desde, hasta) => {
    const qs = new URLSearchParams({ desde, hasta, fuente }).toString();
    return getDownloadUrl(`/api/reportes/trabajador/${id}?${qs}`);
  },
  general: (desde, hasta) => {
    const qs = new URLSearchParams({ desde, hasta }).toString();
    return getDownloadUrl(`/api/reportes/general?${qs}`);
  },
  inventario: () => getDownloadUrl('/api/reportes/inventario'),
};

export const balanceAPI = {
  get: (desde, hasta) => request(`/api/balance?desde=${desde}&hasta=${hasta}`),
};

export const configAPI = {
  get: (clave) => request(`/api/config/${clave}`),
  set: (clave, valor) => request(`/api/config/${clave}`, { method: 'PUT', body: { valor } }),
};

export const trabajadoresAPI = {
  getAll: () => request('/api/trabajadores'),
};

export const cajaAPI = {
  sesionActual: () => request('/api/caja/sesion'),
  abrir: (saldo_inicial = 0) => request('/api/caja/abrir', { method: 'POST', body: { saldo_inicial } }),
  cerrar: () => request('/api/caja/cerrar', { method: 'POST' }),
  movimientos: (sesion_id) => request(`/api/caja/movimientos${sesion_id ? '?sesion_id=' + sesion_id : ''}`),
  registrar: (data) => request('/api/caja/movimientos', { method: 'POST', body: data }),
  actualizar: (id, data) => request(`/api/caja/movimientos/${id}`, { method: 'PUT', body: data }),
  eliminar: (id) => request(`/api/caja/movimientos/${id}`, { method: 'DELETE' }),
  historial: (desde, hasta) => request(`/api/caja/historial?desde=${desde || ''}&hasta=${hasta || ''}`),
};

export const pagosAPI = {
  getAll: (params) => request(`/api/pagos?${new URLSearchParams(params || {}).toString()}`),
  personal: () => request('/api/pagos/personal'),
  calcular: (inicio, fin, params) => request(`/api/pagos/calcular?semana_inicio=${inicio}&semana_fin=${fin}${params ? '&' + params : ''}`, { method: 'POST' }),
  marcarPagado: (id, fuente) => request(`/api/pagos/${id}/pagar?fuente=${fuente}`, { method: 'PUT' }),
  remove: (id, fuente) => request(`/api/pagos/${id}?fuente=${fuente}`, { method: 'DELETE' }),
  adelanto: (id, monto, fuente) => request(`/api/pagos/${id}/adelanto`, { method: 'PUT', body: { monto, fuente } }),
  mensual: (persona_id, mes, anio) => request(`/api/pagos/mensual?persona_id=${persona_id}&mes=${mes}&anio=${anio}`),
  mesesDisponibles: (persona_id) => request(`/api/pagos/mensual/meses?persona_id=${persona_id}`),
};

export const categoriasAPI = {
  getAll: () => request('/api/categorias'),
  create: (data) => request('/api/categorias', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/categorias/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/api/categorias/${id}`, { method: 'DELETE' }),
};

export const marcasAPI = {
  getAll: () => request('/api/marcas'),
  create: (data) => request('/api/marcas', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/marcas/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/api/marcas/${id}`, { method: 'DELETE' }),
};
