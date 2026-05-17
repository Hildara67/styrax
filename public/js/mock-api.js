(function() {
  // ====== Mock Data ======
  const parcelas = [
    { id: 1, nombre: 'Parcela Norte', areaM2: 1500, cultivo: 'Maíz' },
    { id: 2, nombre: 'Parcela Sur', areaM2: 2000, cultivo: 'Trigo' },
    { id: 3, nombre: 'Parcela Este', areaM2: 1200, cultivo: 'Soya' },
  ];
  const usuarios = [
    { id: 1, nombre: 'admin', rol: 'SUPERVISOR', password: 'admin123' },
    { id: 2, nombre: 'operador1', rol: 'OPERADOR', password: 'operador123' },
  ];
  const configs = {
    1: { id: 1, parcelaId: 1, umbral_min: 40, umbral_max: 80, kc_actual: 1.15 },
    2: { id: 2, parcelaId: 2, umbral_min: 35, umbral_max: 75, kc_actual: 1.00 },
    3: { id: 3, parcelaId: 3, umbral_min: 45, umbral_max: 85, kc_actual: 1.20 },
  };

  const ETO_BASE = [5.2, 5.8, 6.3, 5.5, 6.0, 4.9, 6.5, 5.1];
  let etoIdx = 0;
  let lecturas = [];
  let recomendaciones = [];
  let nextRecId = 100;

  function rand(min, max) { return Math.round((min + Math.random() * (max - min)) * 10) / 10; }
  function ahora() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }

  // Seed lecturas iniciales
  for (const p of parcelas) {
    const hum = p.id === 1 ? 68 : p.id === 2 ? 82 : 33;
    lecturas.push({
      id: p.id, parcelaId: p.id, humedadSuelo: hum, temperaturaAmbiente: p.id === 1 ? 28 : p.id === 2 ? 27 : 29,
      humedadRelativa: p.id === 1 ? 45 : p.id === 2 ? 52 : 38, origen: 'MANUAL', esValida: true,
      usuarioRegistro: 2, timestampRegistro: ahora(), nombreParcela: p.nombre
    });
  }

  // ====== Build mock API ======
  const api = {
    // ====== Autenticación ======
    login: async (creds) => {
      const username = creds.usuario || creds.nombre;
      const password = creds.password || creds.contrasena;
      const u = usuarios.find(x => x.nombre === username && x.password === password);
      if (!u) return { success: false, error: 'Credenciales incorrectas' };
      const user = { id: u.id, nombre: u.nombre, rol: u.rol };
      sessionStorage.setItem('usuario', JSON.stringify(user));
      return { success: true, usuario: user };
    },

    // ====== Parcelas ======
    listarParcelas: async () => [...parcelas],
    crearParcela: async (data) => {
      const id = parcelas.length + 1;
      parcelas.push({ id, nombre: data.nombre, areaM2: Number(data.areaM2), cultivo: data.cultivo });
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
    resumenParcelas: async () => {
      return { total: parcelas.length, conRiego: recomendaciones.filter(r => r.accion === 'APLICAR_RIEGO').length };
    },

    // ====== Lecturas ======
    insertarLectura: async (data) => {
      const id = lecturas.length + 1;
      const p = parcelas.find(x => x.id === data.parcelaId);
      lecturas.push({
        id, parcelaId: data.parcelaId, humedadSuelo: data.humedadSuelo,
        temperaturaAmbiente: data.temperaturaAmbiente, humedadRelativa: data.humedadRelativa || null,
        origen: 'MANUAL', esValida: true, usuarioRegistro: data.usuarioRegistro,
        timestampRegistro: ahora(), nombreParcela: p ? p.nombre : ''
      });
      return { success: true, id };
    },
    ultimasLecturas: async () => lecturas,
    historialLecturas: async (filtros) => {
      let r = [...lecturas];
      if (filtros?.parcelaId) r = r.filter(l => l.parcelaId === filtros.parcelaId);
      return r;
    },
    indicadoresLecturas: async () => {
      return { optimas: 1, alertas: 1, deficit: 1 };
    },
    estadisticasLecturas: async () => {
      return { total: lecturas.length, optimas: 1, alertas: 1, deficit: 1 };
    },

    // ====== Recomendaciones ======
    listarRecomendacionesPendientes: async () => recomendaciones.filter(r => r.estado === 'PENDIENTE'),
    listarRecomendaciones: async () => recomendaciones,
    generarRecomendacion: async (data) => {
      const eto = ETO_BASE[etoIdx % ETO_BASE.length];
      const cfg = configs[data.parcelaId];
      const umbralMin = cfg ? cfg.umbral_min : 40;
      const umbralMax = cfg ? cfg.umbral_max : 80;
      const kc = cfg ? cfg.kc_actual : 1.0;
      const area = data.config?.areaM2 || 100;
      const etc = kc * eto;
      const balance = data.humedad - etc;
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
      return { success: true, id, recomendacion: rec };
    },
    generarRecomendacionesTodas: async (usuarioRegistro) => {
      const generadas = [];
      for (const p of parcelas) {
        const lect = lecturas.find(l => l.parcelaId === p.id);
        if (!lect) continue;
        const eto = ETO_BASE[etoIdx % ETO_BASE.length];
        const cfg = configs[p.id];
        const umbralMin = cfg ? cfg.umbral_min : 40;
        const etc = (cfg ? cfg.kc_actual : 1.0) * eto;
        const balance = lect.humedadSuelo - etc;
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
      return { success: true, generadas };
    },
    enviarValidacion: async (id, usuario) => {
      const r = recomendaciones.find(x => x.id === id);
      if (r) r.usuarioAprobador = usuario;
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
      }
      return { success: true };
    },
    rechazarRecomendacion: async (id) => {
      const r = recomendaciones.find(x => x.id === id);
      if (r) r.estado = 'RECHAZADA';
      return { success: true };
    },
    estadisticasRecomendaciones: async () => {
      return { pendientes: recomendaciones.filter(r => r.estado === 'PENDIENTE').length, ejecutadas: recomendaciones.filter(r => r.estado === 'EJECUTADA').length, rechazadas: recomendaciones.filter(r => r.estado === 'RECHAZADA').length };
    },

    // ====== Configuración ======
    obtenerConfig: async (parcelaId) => configs[parcelaId] || null,
    guardarConfig: async (data) => {
      configs[data.parcelaId] = { ...configs[data.parcelaId], ...data };
      return { success: true };
    },
    probarAPI: async () => { return { exito: false, mensaje: 'API no disponible en demo web' }; },
    probarBD: async () => { return { exito: true, mensaje: 'Mock DB conectada' }; },

    // ====== Usuarios ======
    listarUsuarios: async () => usuarios.map(u => ({ id: u.id, nombre: u.nombre, rol: u.rol, activo: true })),
    crearUsuario: async (data) => {
      const id = usuarios.length + 1;
      usuarios.push({ id, nombre: data.nombre, rol: data.rol, password: data.password });
      return { success: true, id };
    },
    desactivarUsuario: async (id) => { return { success: true }; },
    listarOperadores: async () => usuarios.filter(u => u.rol === 'OPERADOR'),

    // ====== CSV ======
    leerCSV: async () => ({ success: false, lecturas: [] }),
    importarAutoCSV: async () => ({ insertados: {} }),

    // ====== API Clima ======
    consultarET0: async (parcelaId) => {
      const eto = ETO_BASE[etoIdx % ETO_BASE.length];
      return { success: true, et0: eto, precipitacion: 0.0, temperatura: 28.0, condicion: 'normal' };
    },

    // ====== Exportación ======
    exportarCSV: async () => ({ success: true }),
    exportarCSVDialog: async () => ({ success: true, canceled: false }),
    exportarRespaldo: async () => ({ success: true }),
  };

  // ====== Override window.api ======
  // Some pages try to access api before mock loads; use a Proxy to queue calls
  if (!window.api) {
    window.api = {};
  }
  // Shallow-merge: copy all mock functions onto existing window.api
  for (const key of Object.keys(api)) {
    window.api[key] = api[key];
  }
  console.log('[Mock-API] Mock functions installed for ' + Object.keys(api).length + ' IPC calls');
})();
