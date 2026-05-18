(function() {
  const STORAGE_KEY = 'sistema_riego_data';
  const SEMILLA_PARCELAS = [
    { id: 1, nombre: 'Parcela Norte', areaM2: 1500, cultivo: 'Maíz' },
    { id: 2, nombre: 'Parcela Sur', areaM2: 2000, cultivo: 'Trigo' },
    { id: 3, nombre: 'Parcela Este', areaM2: 1200, cultivo: 'Soya' },
  ];
  const SEMILLA_CONFIGS = {
    1: { id: 1, parcelaId: 1, umbral_min: 40, umbral_max: 80, kc_actual: 1.15 },
    2: { id: 2, parcelaId: 2, umbral_min: 35, umbral_max: 75, kc_actual: 1.00 },
    3: { id: 3, parcelaId: 3, umbral_min: 45, umbral_max: 85, kc_actual: 1.20 },
  };
  const usuarios = [
    { id: 1, nombre: 'admin', rol: 'SUPERVISOR', password: 'admin123' },
    { id: 2, nombre: 'operador1', rol: 'OPERADOR', password: 'operador123' },
  ];

  function cargarData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }

  function guardarData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  const ETO_BASE = [5.2, 5.8, 6.3, 5.5, 6.0, 4.9, 6.5, 5.1];
  let etoIdx = 0;

  const saved = cargarData();
  const parcelas = (saved && saved.parcelas) ? saved.parcelas : JSON.parse(JSON.stringify(SEMILLA_PARCELAS));
  const configs = (saved && saved.configs) ? saved.configs : JSON.parse(JSON.stringify(SEMILLA_CONFIGS));
  let lecturas = (saved && saved.lecturas) ? saved.lecturas : [];
  let recomendaciones = (saved && saved.recomendaciones) ? saved.recomendaciones : [];
  let nextRecId = (saved && saved.nextRecId) ? saved.nextRecId : 100;

  function persistir() {
    guardarData({ parcelas, configs, lecturas, recomendaciones, nextRecId });
  }

  function rand(min, max) { return Math.round((min + Math.random() * (max - min)) * 10) / 10; }
  function ahora() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }

  function seedLecturas() {
    if (lecturas.length > 0) return;
    for (const p of parcelas) {
      const hum = p.id === 1 ? 68 : p.id === 2 ? 82 : 33;
      lecturas.push({
        id: p.id, parcelaId: p.id, humedadSuelo: hum,
        temperaturaAmbiente: p.id === 1 ? 28 : p.id === 2 ? 27 : 29,
        humedadRelativa: p.id === 1 ? 45 : p.id === 2 ? 52 : 38,
        origen: 'MANUAL', esValida: true,
        usuarioRegistro: 2, timestampRegistro: ahora(), nombreParcela: p.nombre
      });
    }
    persistir();
  }
  seedLecturas();

  const api = {
    login: async (creds) => {
      const username = creds.usuario || creds.nombre;
      const password = creds.password || creds.contrasena;
      const u = usuarios.find(x => x.nombre === username && x.password === password);
      if (!u) return { success: false, error: 'Credenciales incorrectas' };
      sessionStorage.setItem('usuario', JSON.stringify({ id: u.id, nombre: u.nombre, rol: u.rol }));
      return { success: true, usuario: { id: u.id, nombre: u.nombre, rol: u.rol } };
    },

    listarParcelas: async () => [...parcelas],
    crearParcela: async (data) => {
      const ids = parcelas.map(p => p.id);
      const id = ids.length > 0 ? Math.max(...ids) + 1 : 1;
      parcelas.push({ id, nombre: data.nombre, areaM2: Number(data.areaM2), cultivo: data.cultivo });
      configs[id] = { id, parcelaId: id, umbral_min: 40, umbral_max: 80, kc_actual: 1.0 };
      const humBase = 50 + Math.round(Math.random() * 30);
      const lecturaId = lecturas.length + 1;
      lecturas.push({
        id: lecturaId, parcelaId: id, humedadSuelo: humBase,
        temperaturaAmbiente: 25 + Math.round(Math.random() * 8),
        humedadRelativa: 40 + Math.round(Math.random() * 30),
        origen: 'MANUAL', esValida: true, usuarioRegistro: 2,
        timestampRegistro: ahora(), nombreParcela: data.nombre
      });
      persistir();
      await api.generarRecomendacion({ parcelaId: id, humedad: humBase, config: { areaM2: Number(data.areaM2) }, usuarioRegistro: 2 });
      return { success: true, id };
    },
    actualizarParcela: async (id, data) => {
      const p = parcelas.find(x => x.id === id);
      if (p) { p.nombre = data.nombre; p.areaM2 = Number(data.areaM2); p.cultivo = data.cultivo; }
      return { success: true };
    },
    eliminarParcela: async (id) => {
      const idx = parcelas.findIndex(x => x.id === id);
      if (idx >= 0) parcelas.splice(idx, 1);
      return { success: true };
    },
    contarParcelas: async () => parcelas.length,
    resumenParcelas: async () => ({ total: parcelas.length, conRiego: recomendaciones.filter(r => r.accion === 'APLICAR_RIEGO').length }),

    insertarLectura: async (data) => {
      const id = lecturas.length + 1;
      const p = parcelas.find(x => x.id === data.parcelaId);
      lecturas.push({
        id, parcelaId: data.parcelaId, humedadSuelo: data.humedadSuelo,
        temperaturaAmbiente: data.temperaturaAmbiente, humedadRelativa: data.humedadRelativa || null,
        origen: 'MANUAL', esValida: true, usuarioRegistro: data.usuarioRegistro,
        timestampRegistro: ahora(), nombreParcela: p ? p.nombre : ''
      });
      persistir();
      for (const r of recomendaciones) {
        if (r.parcelaId === data.parcelaId && r.estado === 'PENDIENTE') r.estado = 'RECHAZADA';
      }
      await api.generarRecomendacion({ parcelaId: data.parcelaId, humedad: data.humedadSuelo, config: { areaM2: p ? p.areaM2 : 100 }, usuarioRegistro: data.usuarioRegistro });
      return { success: true, id };
    },
    ultimasLecturas: async () => lecturas,
    historialLecturas: async (filtros) => {
      let r = [...lecturas];
      if (filtros?.parcelaId) r = r.filter(l => l.parcelaId === filtros.parcelaId);
      return r.sort((a, b) => (b.id || 0) - (a.id || 0));
    },
    indicadoresLecturas: async () => {
      if (lecturas.length === 0) return { optimas: 0, alertas: 0, deficit: 0 };
      const eto = ETO_BASE[etoIdx % ETO_BASE.length];
      let optimas = 0, alertas = 0, deficit = 0;
      for (const l of lecturas) {
        const cfg = configs[l.parcelaId];
        const umbralMin = cfg ? cfg.umbral_min : 40;
        const umbralMax = cfg ? cfg.umbral_max : 80;
        const kc = cfg ? cfg.kc_actual : 1.0;
        const balance = l.humedadSuelo - (kc * eto);
        if (balance >= umbralMin && balance <= umbralMax) optimas++;
        else if (balance < umbralMin) deficit++;
        else alertas++;
      }
      return { optimas, alertas, deficit };
    },
    estadisticasLecturas: async () => {
      const ind = await api.indicadoresLecturas();
      const hum = lecturas.reduce((s, l) => s + l.humedadSuelo, 0);
      const temp = lecturas.reduce((s, l) => s + (l.temperaturaAmbiente || 0), 0);
      const n = lecturas.length || 1;
      return { total_lecturas: lecturas.length, humedad_promedio: +(hum / n).toFixed(2), temp_promedio: +(temp / n).toFixed(2), optimas: ind.optimas, alertas: ind.alertas, deficit: ind.deficit };
    },

    listarRecomendacionesPendientes: async () => recomendaciones.filter(r => r.estado === 'PENDIENTE'),
    listarRecomendaciones: async () => recomendaciones,
    generarRecomendacion: async (data) => {
      const yaPendiente = recomendaciones.some(r => r.parcelaId === data.parcelaId && r.estado === 'PENDIENTE');
      if (yaPendiente) return { success: true, mantenimiento: true, recomendacion: { accion: 'MANTENER', mensaje: 'Ya existe una recomendación pendiente para esta parcela' } };
      const eto = ETO_BASE[etoIdx % ETO_BASE.length];
      const cfg = configs[data.parcelaId];
      const umbralMin = cfg ? cfg.umbral_min : 40;
      const umbralMax = cfg ? cfg.umbral_max : 80;
      const kc = cfg ? cfg.kc_actual : 1.0;
      const area = data.config?.areaM2 || 100;
      const balance = data.humedad - (kc * eto);
      let accion = 'MANTENER';
      if (balance < umbralMin) accion = 'APLICAR_RIEGO';
      else if (balance > umbralMax) accion = 'DETENER_RIEGO';
      if (accion === 'MANTENER') return { success: true, mantenimiento: true, recomendacion: { accion, mensaje: 'Estado óptimo' } };
      const deficit = Math.max(0, umbralMin - balance);
      const vol = Math.round(deficit * area * 0.07);
      const urg = deficit > 20 ? 'CRÍTICO' : deficit > 10 ? 'ALTO' : deficit > 5 ? 'MEDIO' : 'BAJO';
      const p = parcelas.find(x => x.id === data.parcelaId);
      const id = nextRecId++;
      const rec = {
        id, parcelaId: data.parcelaId, nombreParcela: p ? p.nombre : '', cultivo: p ? p.cultivo : '',
        volumenSugeridoL: vol, accion, estado: 'PENDIENTE', urgencia: urg,
        usuarioAprobador: null, timestamp_generacion: ahora(),
        nombre_parcela: p ? p.nombre : '', volumen_sugerido_L: vol
      };
      recomendaciones.push(rec);
      persistir();
      return { success: true, id, recomendacion: rec };
    },
    generarRecomendacionesTodas: async () => {
      for (const r of recomendaciones) {
        if (r.estado === 'PENDIENTE') r.estado = 'RECHAZADA';
      }
      const generadas = [];
      for (const p of parcelas) {
        const lect = lecturas.find(l => l.parcelaId === p.id);
        if (!lect) continue;
        const eto = ETO_BASE[etoIdx % ETO_BASE.length];
        const cfg = configs[p.id];
        const umbralMin = cfg ? cfg.umbral_min : 40;
        const balance = lect.humedadSuelo - ((cfg ? cfg.kc_actual : 1.0) * eto);
        let accion = 'MANTENER';
        if (balance < umbralMin) accion = 'APLICAR_RIEGO';
        else if (balance > (cfg ? cfg.umbral_max : 80)) accion = 'DETENER_RIEGO';
        if (accion === 'MANTENER') continue;
        const deficit = Math.max(0, umbralMin - balance);
        const vol = Math.round(deficit * p.areaM2 * 0.07);
        const urg = deficit > 20 ? 'CRÍTICO' : deficit > 10 ? 'ALTO' : deficit > 5 ? 'MEDIO' : 'BAJO';
        const id = nextRecId++;
        recomendaciones.push({
          id, parcelaId: p.id, nombreParcela: p.nombre, cultivo: p.cultivo,
          volumenSugeridoL: vol, accion, estado: 'PENDIENTE', urgencia: urg,
          usuarioAprobador: null, timestamp_generacion: ahora(),
          nombre_parcela: p.nombre, volumen_sugerido_L: vol
        });
        generadas.push({ id, parcelaId: p.id, nombre: p.nombre, accion, urgencia: urg, volumen: vol });
      }
      persistir();
      return { success: true, generadas };
    },
    enviarValidacion: async (id, usuario) => {
      const r = recomendaciones.find(x => x.id === id);
      if (r) { r.usuarioAprobador = usuario; persistir(); }
      return { success: true };
    },
    aprobarRecomendacion: async (id, usuario) => {
      const r = recomendaciones.find(x => x.id === id);
      if (r) {
        r.estado = 'EJECUTADA';
        const lect = lecturas.find(l => l.parcelaId === r.parcelaId);
        if (lect) {
          if (r.accion === 'APLICAR_RIEGO') lect.humedadSuelo = Math.min(lect.humedadSuelo + 30 + rand(0, 10), 95);
          else if (r.accion === 'DETENER_RIEGO') lect.humedadSuelo = Math.max(lect.humedadSuelo - 25, configs[r.parcelaId]?.umbral_min || 40);
        }
        persistir();
      }
      return { success: true };
    },
    rechazarRecomendacion: async (id) => {
      const r = recomendaciones.find(x => x.id === id);
      if (r) { r.estado = 'RECHAZADA'; persistir(); }
      return { success: true };
    },
    estadisticasRecomendaciones: async () => {
      const ejecutadas = recomendaciones.filter(r => r.estado === 'EJECUTADA');
      return {
        total: recomendaciones.length,
        pendientes: recomendaciones.filter(r => r.estado === 'PENDIENTE').length,
        ejecutadas: ejecutadas.length,
        rechazadas: recomendaciones.filter(r => r.estado === 'RECHAZADA').length,
        volumen_ejecutado: ejecutadas.reduce((s, r) => s + (r.volumenSugeridoL || 0), 0)
      };
    },

    obtenerConfig: async (parcelaId) => configs[parcelaId] || null,
    guardarConfig: async (data) => {
      configs[data.parcelaId] = { ...configs[data.parcelaId], ...data };
      return { success: true };
    },
    probarAPI: async () => ({ conectado: true }),
    probarBD: async () => ({ conectado: true }),

    listarUsuarios: async () => usuarios.map(u => ({ id: u.id, nombre: u.nombre, rol: u.rol, activo: true })),
    crearUsuario: async (data) => {
      const id = usuarios.length + 1;
      usuarios.push({ id, nombre: data.nombre, rol: data.rol, password: data.password });
      return { success: true, id };
    },
    desactivarUsuario: async () => ({ success: true }),
    listarOperadores: async () => usuarios.filter(u => u.rol === 'OPERADOR'),

    leerCSV: async () => {
      const datos = parcelas.map(p => {
        const humBase = p.id === 1 ? 68 : p.id === 2 ? 82 : 33;
        return {
          parcelaId: p.id, humedadSuelo: humBase + rand(-5, 5),
          temperaturaAmbiente: p.id === 1 ? 28 : p.id === 2 ? 27 : 29,
          humedadRelativa: p.id === 1 ? 45 : p.id === 2 ? 52 : 38,
          timestamp: ahora()
        };
      });
      return { success: true, lecturas: datos };
    },
    importarAutoCSV: async () => {
      const res = await api.leerCSV();
      const insertados = {};
      if (res.success) {
        for (const l of res.lecturas) {
          const id = lecturas.length + 1;
          const p = parcelas.find(x => x.id === l.parcelaId);
          lecturas.push({
            id, parcelaId: l.parcelaId, humedadSuelo: l.humedadSuelo,
            temperaturaAmbiente: l.temperaturaAmbiente, humedadRelativa: l.humedadRelativa || null,
            origen: 'CSV', esValida: true, usuarioRegistro: 2,
            timestampRegistro: l.timestamp || ahora(), nombreParcela: p ? p.nombre : ''
          });
          insertados[l.parcelaId] = (insertados[l.parcelaId] || 0) + 1;
        }
        persistir();
      }
      return { success: true, insertados };
    },

    consultarET0: async () => {
      const eto = ETO_BASE[etoIdx % ETO_BASE.length];
      return { success: true, et0: eto, precipitacion: 0.0, temperatura: 28.0, condicion: 'normal' };
    },

    exportarCSV: async () => ({ success: true }),
    exportarCSVDialog: async () => ({ success: true, canceled: false }),
    exportarRespaldo: async (path) => ({ success: true, ruta: path || 'respaldo.json' }),
  };

  if (!window.api) {
    window.api = {};
  }
  let installed = 0;
  for (const key of Object.keys(api)) {
    if (typeof window.api[key] !== 'function') {
      window.api[key] = api[key];
      installed++;
    }
  }
  if (installed > 0) {
    console.log('[Mock-API] Mock functions installed for ' + installed + ' IPC calls');
  } else {
    console.log('[Mock-API] Real Electron API detected, mock functions skipped');
  }
})();
