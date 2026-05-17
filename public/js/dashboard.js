const loadingOverlay = document.getElementById('loadingOverlay');

function mostrarCarga() { loadingOverlay.classList.add('show'); }
function ocultarCarga() { loadingOverlay.classList.remove('show'); }

function verificarSesion() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  if (!usuario) {
    window.location.href = 'index.html';
    return null;
  }
  if (usuario.rol !== 'OPERADOR') {
    window.location.href = 'parcelas.html';
    return null;
  }
  document.getElementById('userName').textContent = usuario.nombre;
  document.getElementById('userRol').textContent = usuario.rol;
  return usuario;
}

document.getElementById('btnCerrarSesion').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

async function cargarIndicadores() {
  try {
    const totalParcelas = await window.api.contarParcelas();
    document.getElementById('totalParcelas').textContent = totalParcelas;

    const indicadores = await window.api.indicadoresLecturas();
    document.getElementById('lecturasOptimas').textContent = indicadores.optimas || 0;
    document.getElementById('alertasActivas').textContent = indicadores.alertas || 0;
    document.getElementById('deficitDetectado').textContent = indicadores.deficit || 0;
  } catch (err) {
    console.error('Error cargando indicadores:', err);
  }
}

async function cargarTablaEstado() {
  const tbody = document.getElementById('tablaEstado');
  const detenerAlert = document.getElementById('detenerRiegoAlert');
  const detenerMsg = document.getElementById('detenerRiegoMsg');
  try {
    const [parcelas, ultimas, climaResult] = await Promise.all([
      window.api.listarParcelas(),
      window.api.ultimasLecturas(),
      window.api.consultarET0(null).catch(() => ({ et0: 4.50, precipitacion: 0, condicion: 'normal' }))
    ]);
    const clima = climaResult || { et0: 4.50, precipitacion: 0, condicion: 'normal' };

    if (parcelas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gris-400);">No hay parcelas registradas</td></tr>';
      return;
    }

    const iconoClima = clima.condicion === 'soleado' ? '☀️' :
      clima.condicion === 'nublado' ? '☁️' :
      clima.condicion === 'lluvia' ? '🌧️' :
      clima.condicion === 'frio' ? '❄️' : '🌤️';

    const lecturasMap = {};
    ultimas.forEach(l => { lecturasMap[l.parcelaId] = l; });
    const configsCache = {};

    const detenerList = [];

    let html = '';
    for (const p of parcelas) {
      const lectura = lecturasMap[p.id];
      const humedad = lectura ? lectura.humedadSuelo : null;
      const temperatura = lectura ? lectura.temperaturaAmbiente : null;
      const hrVal = lectura ? lectura.humedadRelativa : null;

      if (!configsCache[p.id]) {
        try { configsCache[p.id] = await window.api.obtenerConfig(p.id); } catch (_) {}
      }
      const cfg = configsCache[p.id];
      const umbralMin = cfg ? Number(cfg.umbral_min) : 40;
      const umbralMax = cfg ? Number(cfg.umbral_max) : 80;

      let estadoClass = 'estado-optimo';
      let estadoText = 'Óptimo';
      let accion = '💧 MANTENER';

      if (humedad !== null) {
        const kc = cfg ? Number(cfg.kc_actual) : 1.0;
        const balance = humedad + (clima.precipitacion || 0) - (kc * clima.et0);
        if (balance > umbralMax) {
          estadoClass = 'estado-exceso';
          estadoText = '⚠ Exceso';
          accion = '⛔ DETENER RIEGO';
          detenerList.push(p.nombre);
        } else if (balance < umbralMin) {
          estadoClass = 'estado-deficit';
          estadoText = '⚠ Déficit';
          accion = '🚰 APLICAR RIEGO';
        } else if (balance < umbralMin + 5 || balance > umbralMax - 5) {
          estadoClass = 'estado-alerta';
          estadoText = '⚠ Alerta';
          accion = '🔍 MONITOREAR';
        }
      }

      html += `<tr>
        <td><strong>${p.nombre}</strong></td>
        <td>${humedad !== null ? Number(humedad).toFixed(2) : '---'}</td>
        <td>${temperatura !== null ? Number(temperatura).toFixed(2) : '---'}</td>
        <td>${hrVal !== null ? Number(hrVal).toFixed(2) : '---'}</td>
        <td>${iconoClima} ${clima.et0.toFixed(2)} mm/día</td>
        <td><span class="${estadoClass}">${estadoText}</span></td>
        <td>${accion}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="window.location.href='recomendaciones.html'">Ver</button></td>
      </tr>`;
    }
    tbody.innerHTML = html;

    if (detenerList.length > 0) {
      detenerAlert.style.display = 'block';
      detenerMsg.textContent = `Se recomienda DETENER RIEGO en: ${detenerList.join(', ')} — humedad del suelo por encima del umbral máximo.`;
    } else {
      detenerAlert.style.display = 'none';
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--rojo);">Error: ${err.message}</td></tr>`;
  }
}

(async function init() {
  const usuario = verificarSesion();
  if (!usuario) return;
  mostrarCarga();
  await Promise.all([cargarIndicadores(), cargarTablaEstado()]);
  ocultarCarga();

  let refreshInterval = setInterval(async () => {
    await Promise.all([cargarIndicadores(), cargarTablaEstado()]);
  }, 12000);

  window.addEventListener('beforeunload', () => clearInterval(refreshInterval));
})();
