const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

function mostrarCarga(texto) { loadingText.textContent = texto || 'Cargando...'; loadingOverlay.classList.add('show'); }
function ocultarCarga() { loadingOverlay.classList.remove('show'); }

function verificarSesion() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  if (!usuario) { window.location.href = 'index.html'; return null; }
  if (usuario.rol !== 'OPERADOR') { window.location.href = 'parcelas.html'; return null; }
  document.getElementById('userName').textContent = usuario.nombre;
  document.getElementById('userRol').textContent = usuario.rol;
  return usuario;
}

const usuario = verificarSesion();

document.getElementById('btnCerrarSesion').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

function mostrarToast(mensaje, tipo) {
  const toast = document.createElement('div');
  toast.className = `toast show ${tipo}`;
  toast.textContent = mensaje;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function cargarRecomendaciones() {
  const grid = document.getElementById('recomendacionesGrid');
  mostrarCarga('Cargando recomendaciones...');
  try {
    const pendientes = await window.api.listarRecomendacionesPendientes();
    if (pendientes.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--gris-400);padding:40px;">No hay recomendaciones pendientes</div>';
    } else {
      grid.innerHTML = pendientes.map(r => {
        const urgClass = `urgencia-${r.urgencia}`;
        const badgeClass = r.urgencia === 'CRÍTICO' ? 'badge-rojo' : r.urgencia === 'ALTO' ? 'badge-naranja' : r.urgencia === 'MEDIO' ? 'badge-azul' : 'badge-verde';
        return `<div class="recomendacion-card ${urgClass}">
          <div class="card-header">
            <h3>Recomendación para: ${r.nombreParcela} - ${r.cultivo}</h3>
            <span class="badge ${badgeClass}">${r.urgencia}</span>
          </div>
          <div class="card-body">
            <p>Acción sugerida: <span class="accion badge badge-${r.accion === 'APLICAR_RIEGO' ? 'rojo' : r.accion === 'DETENER_RIEGO' ? 'naranja' : 'verde'}">${r.accion === 'APLICAR_RIEGO' ? '🚰 APLICAR RIEGO' : r.accion === 'DETENER_RIEGO' ? '⛔ DETENER RIEGO' : '💧 MANTENER'}</span></p>
            <p class="volumen">${r.volumenSugeridoL.toFixed(2)} L</p>
             <p>Estado: <span class="badge ${r.usuarioAprobador ? 'badge-naranja' : 'badge-azul'}">${r.usuarioAprobador ? 'Pendiente de validar' : 'Pendiente de envío'}</span></p>
          </div>
          <div class="btn-group">
            ${!r.usuarioAprobador ? `<button class="btn btn-success btn-sm" onclick="enviarValidacion(${r.id})">📤 Enviar a Validación</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="posponerRiego(${r.id})">⏸ Posponer</button>
            <button class="btn btn-primary btn-sm" onclick="recalcular(${r.id}, ${r.parcelaId})">🔄 Recalcular</button>
          </div>
        </div>`;
      }).join('');
    }

    const todas = await window.api.listarRecomendaciones();
    const tbody = document.getElementById('historialRecomendaciones');
    if (todas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gris-400);">Sin datos</td></tr>';
    } else {
      tbody.innerHTML = todas.map(r => {
        const accionBadge = r.accion === 'APLICAR_RIEGO' ? 'badge-rojo' : r.accion === 'DETENER_RIEGO' ? 'badge-naranja' : 'badge-verde';
        const estadoBadge = r.estado === 'EJECUTADA' ? 'badge-verde' : r.estado === 'RECHAZADA' ? 'badge-rojo' : 'badge-azul';
        return `<tr>
          <td>${r.timestamp_generacion || '---'}</td>
          <td>${r.nombre_parcela}</td>
          <td><span class="badge ${accionBadge}">${r.accion}</span></td>
          <td>${Number(r.volumen_sugerido_L).toFixed(2)}</td>
          <td><span class="badge ${estadoBadge}">${r.estado}</span></td>
        </tr>`;
      }).join('');
    }
  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--rojo);">Error: ${err.message}</div>`;
  } finally {
    ocultarCarga();
  }
}

async function enviarValidacion(id) {
  mostrarCarga('Enviando a validación...');
  try {
    await window.api.enviarValidacion(id, usuario.id);
    mostrarToast('Recomendación enviada a validación con supervisor', 'success');
    await cargarRecomendaciones();
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
}

async function posponerRiego(id) {
  mostrarCarga('Rechazando recomendación...');
  try {
    await window.api.rechazarRecomendacion(id, usuario.id);
    mostrarToast('Recomendación rechazada', 'success');
    await cargarRecomendaciones();
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
}

async function recalcular(id, parcelaId) {
  mostrarCarga('Recalculando recomendaciones...');
  try {
    await window.api.rechazarRecomendacion(id, usuario.id);

    const [config, parcelas] = await Promise.all([
      window.api.obtenerConfig(parcelaId),
      window.api.listarParcelas()
    ]);
    const parcela = parcelas.find(p => p.id === parcelaId);
    const ultimaLectura = await window.api.historialLecturas({ parcelaId });
    if (ultimaLectura.length > 0) {
      const lectura = ultimaLectura[0];
      await window.api.generarRecomendacion({
        parcelaId,
        humedad: lectura.humedadSuelo,
        config: {
          umbralMin: config?.umbral_min || 40,
          umbralMax: config?.umbral_max || 80,
          kcActual: config?.kc_actual || 1.0,
          areaM2: parcela ? parcela.areaM2 : 100
        },
        usuarioRegistro: usuario.id
      });
      mostrarToast('Recomendaciones recalculadas', 'success');
    }
    await cargarRecomendaciones();
  } catch (err) {
    mostrarToast('Error al recalcular: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
}

document.getElementById('btnExportarCSV').addEventListener('click', async function() {
  mostrarCarga('Exportando...');
  try {
    const datos = await window.api.listarRecomendaciones();
    const columnas = ['timestamp_generacion', 'nombre_parcela', 'accion', 'volumen_sugerido_L', 'estado'];
    const result = await window.api.exportarCSVDialog({
      datos,
      columnas,
      nombrePropuesto: 'recomendaciones_' + Date.now() + '.csv'
    });
    if (result.canceled) {
      mostrarToast('Exportación cancelada', 'success');
    } else if (result.success) {
      mostrarToast('CSV exportado exitosamente', 'success');
    } else {
      mostrarToast('Error al exportar: ' + result.error, 'error');
    }
  } catch (err) {
    mostrarToast('Error al exportar: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
});

async function autoGenerarRecomendaciones() {
  mostrarCarga('Generando recomendaciones...');
  try {
    const result = await window.api.generarRecomendacionesTodas(usuario.id);
    if (result.success && result.generadas && result.generadas.length > 0) {
      mostrarToast(`Se generaron ${result.generadas.length} recomendaciones`, 'success');
    } else {
      mostrarToast('No se requieren nuevas recomendaciones', 'success');
    }
  } catch (err) {
    console.warn('No se pudieron auto-generar recomendaciones:', err.message);
  } finally {
    ocultarCarga();
  }
}

autoGenerarRecomendaciones().then(() => {
  cargarRecomendaciones();
  let refreshInterval = setInterval(cargarRecomendaciones, 15000);
  window.addEventListener('beforeunload', () => clearInterval(refreshInterval));
}).catch(err => {
  console.error('Error cargando recomendaciones:', err);
  cargarRecomendaciones();
  let refreshInterval = setInterval(cargarRecomendaciones, 15000);
  window.addEventListener('beforeunload', () => clearInterval(refreshInterval));
});
