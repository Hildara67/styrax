const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();

const Validador = require('./core/validador');
const MotorFAO56 = require('./core/motor_fao56');
const GestorDecisiones = require('./core/gestor_decisiones');
const LecturaDAO = require('./data/dao/lectura.dao');
const RecomendacionDAO = require('./data/dao/recomendacion.dao');
const UsuarioDAO = require('./data/dao/usuario.dao');
const ParcelaDAO = require('./data/dao/parcela.dao');
const ConfigDAO = require('./data/dao/config.dao');
const AdaptadorAPI = require('./data/adaptador_api');
const AdaptadorCSV = require('./data/adaptador_csv');
const SistemaArchivos = require('./data/sistema_archivos');
const LecturaDTO = require('./dto/lectura.dto');
const RecomendacionDTO = require('./dto/recomendacion.dto');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, '..', 'public', 'js', 'renderer.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Sistema Riego - Control de Riego Agrícola',
    icon: path.join(__dirname, '..', 'public', 'icon.ico')
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();
  setInterval(importarCSVAutomatico, 30000);
  setInterval(() => procesarRecomendaciones().catch(() => {}), 60000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

async function importarCSVAutomatico() {
  try {
    const lecturas = await AdaptadorCSV.leer('datos/sensores.csv');
    const porParcela = {};
    for (const l of lecturas) {
      if (!porParcela[l.parcelaId]) porParcela[l.parcelaId] = [];
      porParcela[l.parcelaId].push(l);
    }
    let hayNuevas = false;
    for (const [parcelaIdStr, filas] of Object.entries(porParcela)) {
      const parcelaId = Number(parcelaIdStr);
      const yaImportados = await LecturaDAO.contarCSV(parcelaId);
      const nuevas = filas.slice(yaImportados);
      for (const lectura of nuevas) {
        await LecturaDAO.insertar(lectura);
        hayNuevas = true;
      }
    }
    if (hayNuevas) {
      await procesarRecomendaciones();
    }
  } catch (_) {}
}

// ==================== IPC Handlers ====================

// --- Autenticación ---
ipcMain.handle('auth:login', async (event, { nombre, password }) => {
  try {
    const usuario = await UsuarioDAO.autenticar(nombre, password);
    return usuario ? { success: true, usuario } : { success: false, error: 'Credenciales inválidas' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- Parcelas ---
ipcMain.handle('parcela:listar', async () => {
  return await ParcelaDAO.listarTodas();
});

ipcMain.handle('parcela:crear', async (event, parcelaData) => {
  try {
    Validador.esNombreUnico(parcelaData.nombre);
    Validador.esAreaValida(Number(parcelaData.areaM2));
    if (await ParcelaDAO.nombreExiste(parcelaData.nombre)) {
      return { success: false, error: 'El nombre de parcela ya existe' };
    }
    const id = await ParcelaDAO.crear(parcelaData);
    return { success: true, id };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('parcela:actualizar', async (event, { id, data }) => {
  try {
    Validador.esNombreUnico(data.nombre);
    Validador.esAreaValida(Number(data.areaM2));
    if (await ParcelaDAO.nombreExiste(data.nombre, id)) {
      return { success: false, error: 'El nombre de parcela ya existe' };
    }
    await ParcelaDAO.actualizar(id, data);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('parcela:eliminar', async (event, id) => {
  try {
    await ParcelaDAO.eliminar(id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('parcela:contar', async () => {
  return await ParcelaDAO.contarTotal();
});

ipcMain.handle('parcela:resumen', async () => {
  return await ParcelaDAO.obtenerResumen();
});

// --- Lecturas ---
ipcMain.handle('lectura:insertar', async (event, lecturaData) => {
  try {
    Validador.esRangoHumedad(Number(lecturaData.humedadSuelo));
    Validador.esRangoTemperatura(Number(lecturaData.temperaturaAmbiente));
    const dto = new LecturaDTO({
      parcelaId: lecturaData.parcelaId,
      humedadSuelo: Number(lecturaData.humedadSuelo),
      temperaturaAmbiente: Number(lecturaData.temperaturaAmbiente),
      origen: lecturaData.origen || 'MANUAL',
      esValida: true,
      usuarioRegistro: lecturaData.usuarioRegistro
    });
    const id = await LecturaDAO.insertar(dto);
    return { success: true, id };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('lectura:ultimas', async () => {
  return await LecturaDAO.obtenerUltimasPorParcela();
});

ipcMain.handle('lectura:historial', async (event, { parcelaId, desde, hasta }) => {
  return await LecturaDAO.obtenerHistorial(parcelaId, desde, hasta);
});

ipcMain.handle('lectura:indicadores', async () => {
  return await LecturaDAO.contarLecturasHoy();
});

ipcMain.handle('lectura:estadisticas', async () => {
  return await LecturaDAO.obtenerEstadisticas();
});

// --- Recomendaciones ---
ipcMain.handle('recomendacion:listarPendientes', async () => {
  return await RecomendacionDAO.obtenerPendientes();
});

ipcMain.handle('recomendacion:listarTodas', async () => {
  return await RecomendacionDAO.obtenerTodas();
});

ipcMain.handle('recomendacion:generar', async (event, { parcelaId, humedad, config, usuarioRegistro }) => {
  try {
    const parcelas = await ParcelaDAO.listarTodas();
    const parcelaInfo = parcelas.find(p => p.id === parcelaId);
    const lat = 25.0;
    const lon = -100.0;
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const fechaFin = hoy.toISOString().slice(0, 10).replace(/-/g, '');
    const fechaInicio = ayer.toISOString().slice(0, 10).replace(/-/g, '');
    const clima = await AdaptadorAPI.consultarDatosCompletos(lat, lon, fechaInicio, fechaFin);

    const kc = config.kcActual || 1.0;
    const areaM2 = config.areaM2 || 100;
    const etc = MotorFAO56.calcularETc(kc, clima.et0);
    const balance = MotorFAO56.calcularBalanceHidrico(humedad, clima.precipitacion, 0, etc, 0);
    const accion = GestorDecisiones.evaluarUmbral(balance, config.umbralMin, config.umbralMax);
    const deficit = config.umbralMin - balance;
    const volumen = GestorDecisiones.calcularVolumen(Math.max(0, deficit), areaM2);
    const urgencia = GestorDecisiones.determinarUrgencia(balance, config.umbralMin);

    if (accion === 'MANTENER') {
      return { success: true, mantenimiento: true, recomendacion: { accion, mensaje: 'La parcela está en estado óptimo' } };
    }

    const dto = new RecomendacionDTO({
      parcelaId,
      volumenSugeridoL: volumen,
      accion,
      urgencia,
      usuarioAprobador: usuarioRegistro
    });

    const id = await RecomendacionDAO.insertar(dto);

    const recomendacion = {
      id,
      parcelaId,
      nombreParcela: parcelaInfo ? parcelaInfo.nombre : '',
      cultivo: parcelaInfo ? parcelaInfo.cultivo : '',
      volumenSugeridoL: volumen,
      accion,
      estado: 'PENDIENTE',
      urgencia,
      usuarioAprobador: usuarioRegistro,
      timestampGeneracion: new Date().toISOString()
    };

    return { success: true, id, recomendacion };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('recomendacion:enviarValidacion', async (event, { id, usuarioOperador }) => {
  try {
    await RecomendacionDAO.enviarAValidacion(id, usuarioOperador);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('recomendacion:aprobar', async (event, { id, usuarioAprobador }) => {
  try {
    const recomendacion = await RecomendacionDAO.obtenerPorId(id);
    if (!recomendacion) return { success: false, error: 'Recomendación no encontrada' };
    const parcelaIdRecom = recomendacion.parcela_id;
    const accion = recomendacion.accion;
    await RecomendacionDAO.confirmarRiego(id, usuarioAprobador);
    const ultimaLectura = await LecturaDAO.obtenerUltimaPorParcela(parcelaIdRecom);
    if (ultimaLectura) {
      const config = await ConfigDAO.obtenerConfig(parcelaIdRecom);
      const umbralMin = config?.umbral_min || 40;
      const umbralMax = config?.umbral_max || 80;
      const humedadPost = accion === 'APLICAR_RIEGO'
        ? Math.min(Math.max(ultimaLectura.humedadSuelo + 30, umbralMax + 10), 95)
        : accion === 'DETENER_RIEGO'
            ? Math.max(ultimaLectura.humedadSuelo - 25, umbralMin)
            : ultimaLectura.humedadSuelo;
      const dto = new LecturaDTO({
        parcelaId: parcelaIdRecom,
        humedadSuelo: humedadPost,
        temperaturaAmbiente: ultimaLectura.temperaturaAmbiente,
        humedadRelativa: ultimaLectura.humedadRelativa,
        origen: 'MANUAL',
        esValida: true,
        usuarioRegistro: usuarioAprobador,
        nombreParcela: null
      });
      await LecturaDAO.insertar(dto);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('recomendacion:rechazar', async (event, { id, usuarioAprobador }) => {
  try {
    await RecomendacionDAO.rechazarRiego(id, usuarioAprobador);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

async function procesarRecomendaciones(usuarioRegistro = null) {
  const [parcelas, pendientes, ultimas] = await Promise.all([
    ParcelaDAO.listarTodas(),
    RecomendacionDAO.obtenerPendientes(),
    LecturaDAO.obtenerUltimasPorParcela()
  ]);
  const pendientesPorParcela = {};
  for (const p of pendientes) {
    if (!pendientesPorParcela[p.parcelaId]) pendientesPorParcela[p.parcelaId] = [];
    pendientesPorParcela[p.parcelaId].push(p);
  }
  const generadas = [];
  const ahora = new Date();
  const lat = 25.0, lon = -100.0;
  const hoy = new Date();
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  const fechaFin = hoy.toISOString().slice(0, 10).replace(/-/g, '');
  const fechaInicio = ayer.toISOString().slice(0, 10).replace(/-/g, '');
  const clima = await AdaptadorAPI.consultarDatosCompletos(lat, lon, fechaInicio, fechaFin);
  for (const parcela of parcelas) {
    try {
      const lectura = ultimas.find(l => l.parcelaId === parcela.id);
      if (!lectura) continue;

      const config = await ConfigDAO.obtenerConfig(parcela.id);
      const umbralMin = config?.umbral_min || 40;
      const umbralMax = config?.umbral_max || 80;
      const kc = config?.kc_actual || 1.0;
      const etc = MotorFAO56.calcularETc(kc, clima.et0);
      const balance = MotorFAO56.calcularBalanceHidrico(lectura.humedadSuelo, clima.precipitacion, 0, etc, 0);
      const accionRequerida = GestorDecisiones.evaluarUmbral(balance, umbralMin, umbralMax);

      const pendParcela = pendientesPorParcela[parcela.id] || [];

      if (accionRequerida === 'MANTENER') {
        for (const p of pendParcela) {
          await RecomendacionDAO.rechazarRiego(p.id, null);
        }
        continue;
      }

      if (pendParcela.some(p => p.accion === accionRequerida)) continue;

      if (accionRequerida === 'APLICAR_RIEGO') {
        const ultimaEjecutada = await RecomendacionDAO.obtenerUltimaEjecutada(parcela.id);
        if (ultimaEjecutada) {
          const diffMs = ahora - new Date(ultimaEjecutada.timestamp_generacion);
          if (diffMs < 3600000) continue;
        }
      }

      const deficit = umbralMin - balance;
      const volumen = GestorDecisiones.calcularVolumen(Math.max(0, deficit), parcela.areaM2);
      const urgencia = GestorDecisiones.determinarUrgencia(balance, umbralMin);
      const dto = new RecomendacionDTO({
        parcelaId: parcela.id, volumenSugeridoL: volumen, accion: accionRequerida, urgencia, usuarioAprobador: usuarioRegistro
      });
      const id = await RecomendacionDAO.insertar(dto);
      generadas.push({ id, parcelaId: parcela.id, parcela: parcela.nombre, accion: accionRequerida, urgencia, volumen });
    } catch (perr) {
      console.warn(`Error generando recomendación para parcela ${parcela.id}:`, perr.message);
    }
  }
  return generadas;
}

ipcMain.handle('recomendacion:generarTodas', async (event, { usuarioRegistro }) => {
  try {
    const generadas = await procesarRecomendaciones(usuarioRegistro);
    return { success: true, generadas };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('recomendacion:estadisticas', async () => {
  return await RecomendacionDAO.obtenerEstadisticas();
});

// --- API Externa ---
ipcMain.handle('api:consultarET0', async (event, { parcelaId }) => {
  try {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const fechaFin = hoy.toISOString().slice(0, 10).replace(/-/g, '');
    const fechaInicio = ayer.toISOString().slice(0, 10).replace(/-/g, '');

    const lat = 25.0;
    const lon = -100.0;
    const clima = await AdaptadorAPI.consultarDatosCompletos(lat, lon, fechaInicio, fechaFin);
    return { success: true, et0: clima.et0, precipitacion: clima.precipitacion };
  } catch (err) {
    return { success: false, error: err.message, et0: AdaptadorAPI.calcularET0PorDefecto(), precipitacion: 0 };
  }
});

// --- Configuración ---
ipcMain.handle('config:obtener', async (event, parcelaId) => {
  return await ConfigDAO.obtenerConfig(parcelaId);
});

ipcMain.handle('config:guardar', async (event, { parcelaId, umbralMin, umbralMax, kcActual, usuarioResponsable }) => {
  try {
    Validador.validarUmbrales(Number(umbralMin), Number(umbralMax));
    Validador.validarKc(Number(kcActual));
    await ConfigDAO.guardarConfig(parcelaId, Number(umbralMin), Number(umbralMax), Number(kcActual), usuarioResponsable);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('config:probarAPI', async () => {
  const conectado = await AdaptadorAPI.probarConexion();
  return { conectado };
});

ipcMain.handle('config:probarBD', async () => {
  const conectado = await ConfigDAO.probarConexion();
  return { conectado };
});

// --- Usuarios ---
ipcMain.handle('usuario:listar', async () => {
  return await UsuarioDAO.listarTodos();
});

ipcMain.handle('usuario:crear', async (event, { nombre, rol, password }) => {
  try {
    Validador.esNombreUnico(nombre);
    if (!password || password.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    }
    const existe = await UsuarioDAO.buscarPorNombre(nombre);
    if (existe) {
      return { success: false, error: 'El nombre de usuario ya existe' };
    }
    const id = await UsuarioDAO.crear(nombre, rol, password);
    return { success: true, id };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('usuario:desactivar', async (event, id) => {
  await UsuarioDAO.desactivar(id);
  return { success: true };
});

ipcMain.handle('usuario:listarOperadores', async () => {
  return await UsuarioDAO.listarOperadores();
});

// --- CSV ---
ipcMain.handle('csv:leer', async (event, ruta) => {
  try {
    const lecturas = await AdaptadorCSV.leer(ruta);
    return { success: true, lecturas };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('csv:importarAuto', async () => {
  try {
    const antes = { 1: 0, 2: 0, 3: 0 };
    for (const pid of [1, 2, 3]) antes[pid] = await LecturaDAO.contarCSV(pid);
    await importarCSVAutomatico();
    const despues = { 1: 0, 2: 0, 3: 0 };
    for (const pid of [1, 2, 3]) despues[pid] = await LecturaDAO.contarCSV(pid);
    const insertados = {};
    for (const pid of [1, 2, 3]) insertados[pid] = despues[pid] - antes[pid];
    return { success: true, insertados };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- Exportación ---
ipcMain.handle('exportar:csv', async (event, { datos, columnas, nombreArchivo }) => {
  try {
    const ruta = await SistemaArchivos.exportarCSV(datos, columnas, nombreArchivo);
    return { success: true, ruta };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('exportar:csvDialog', async (event, { datos, columnas, nombrePropuesto }) => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar CSV',
      defaultPath: nombrePropuesto || 'export.csv',
      filters: [{ name: 'Archivos CSV', extensions: ['csv'] }]
    });
    if (result.canceled) return { success: false, canceled: true };
    const ruta = await SistemaArchivos.exportarCSV(datos, columnas, result.filePath);
    return { success: true, ruta };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('exportar:respaldo', async (event, rutaSalida) => {
  try {
    const ruta = await SistemaArchivos.generarRespaldo(rutaSalida);
    return { success: true, ruta };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
