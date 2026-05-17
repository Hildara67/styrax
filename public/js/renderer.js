try {
  const { contextBridge, ipcRenderer } = require('electron');

  contextBridge.exposeInMainWorld('api', {
  // Autenticación
  login: (credenciales) => ipcRenderer.invoke('auth:login', credenciales),

  // Parcelas
  listarParcelas: () => ipcRenderer.invoke('parcela:listar'),
  crearParcela: (data) => ipcRenderer.invoke('parcela:crear', data),
  actualizarParcela: (id, data) => ipcRenderer.invoke('parcela:actualizar', { id, data }),
  eliminarParcela: (id) => ipcRenderer.invoke('parcela:eliminar', id),
  contarParcelas: () => ipcRenderer.invoke('parcela:contar'),
  resumenParcelas: () => ipcRenderer.invoke('parcela:resumen'),

  // Lecturas
  insertarLectura: (data) => ipcRenderer.invoke('lectura:insertar', data),
  ultimasLecturas: () => ipcRenderer.invoke('lectura:ultimas'),
  historialLecturas: (filtros) => ipcRenderer.invoke('lectura:historial', filtros),
  indicadoresLecturas: () => ipcRenderer.invoke('lectura:indicadores'),
  estadisticasLecturas: () => ipcRenderer.invoke('lectura:estadisticas'),

  // Recomendaciones
  listarRecomendacionesPendientes: () => ipcRenderer.invoke('recomendacion:listarPendientes'),
  listarRecomendaciones: () => ipcRenderer.invoke('recomendacion:listarTodas'),
  generarRecomendacion: (data) => ipcRenderer.invoke('recomendacion:generar', data),
  generarRecomendacionesTodas: (usuarioRegistro) => ipcRenderer.invoke('recomendacion:generarTodas', { usuarioRegistro }),
  confirmarRecomendacion: (id, usuarioAprobador) => ipcRenderer.invoke('recomendacion:confirmar', { id, usuarioAprobador }),
  enviarValidacion: (id, usuarioOperador) => ipcRenderer.invoke('recomendacion:enviarValidacion', { id, usuarioOperador }),
  aprobarRecomendacion: (id, usuarioAprobador) => ipcRenderer.invoke('recomendacion:aprobar', { id, usuarioAprobador }),
  rechazarRecomendacion: (id, usuarioAprobador) => ipcRenderer.invoke('recomendacion:rechazar', { id, usuarioAprobador }),
  estadisticasRecomendaciones: () => ipcRenderer.invoke('recomendacion:estadisticas'),

  // Configuración
  obtenerConfig: (parcelaId) => ipcRenderer.invoke('config:obtener', parcelaId),
  guardarConfig: (data) => ipcRenderer.invoke('config:guardar', data),
  probarAPI: () => ipcRenderer.invoke('config:probarAPI'),
  probarBD: () => ipcRenderer.invoke('config:probarBD'),

  // Usuarios
  listarUsuarios: () => ipcRenderer.invoke('usuario:listar'),
  crearUsuario: (data) => ipcRenderer.invoke('usuario:crear', data),
  desactivarUsuario: (id) => ipcRenderer.invoke('usuario:desactivar', id),
  listarOperadores: () => ipcRenderer.invoke('usuario:listarOperadores'),

  // CSV
  leerCSV: (ruta) => ipcRenderer.invoke('csv:leer', ruta),
  importarAutoCSV: () => ipcRenderer.invoke('csv:importarAuto'),

  // API
  consultarET0: (parcelaId) => ipcRenderer.invoke('api:consultarET0', { parcelaId }),

  // Exportación
  exportarCSV: (data) => ipcRenderer.invoke('exportar:csv', data),
  exportarCSVDialog: (data) => ipcRenderer.invoke('exportar:csvDialog', data),
  exportarRespaldo: (ruta) => ipcRenderer.invoke('exportar:respaldo', ruta)
});

  console.log('[Renderer] API expuesta correctamente via contextBridge');
} catch (err) {
  console.error('[Renderer] Error al exponer API:', err);
  try {
    const { contextBridge } = require('electron');
    contextBridge.exposeInMainWorld('api', {
      _error: err.message,
      _ready: false
    });
  } catch (_) {}
}
