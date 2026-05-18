const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

function mostrarCarga(texto) { loadingText.textContent = texto || 'Cargando...'; loadingOverlay.classList.add('show'); }
function ocultarCarga() { loadingOverlay.classList.remove('show'); }

function verificarSesion() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  if (!usuario) { window.location.href = 'index.html'; return null; }
  if (usuario.rol !== 'SUPERVISOR') { window.location.href = 'dashboard.html'; return null; }
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

async function cargarPendientes() {
  const tbody = document.getElementById('tablaValidacion');
  mostrarCarga('Cargando recomendaciones...');
  try {
    const todas = await window.api.listarRecomendacionesPendientes();
    const pendientes = todas.filter(r => r.usuarioAprobador);
    if (pendientes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gris-400);">No hay recomendaciones pendientes de validar</td></tr>';
    } else {
      tbody.innerHTML = pendientes.map(r => {
        const accionBadge = r.accion === 'APLICAR_RIEGO' ? 'badge-rojo' : r.accion === 'DETENER_RIEGO' ? 'badge-naranja' : 'badge-verde';
        return `<tr>
          <td>${r.id}</td>
          <td>${r.timestamp_generacion || '---'}</td>
          <td>${r.nombreParcela}</td>
          <td><span class="badge ${accionBadge}">${r.accion}</span></td>
          <td>${r.volumenSugeridoL.toFixed(2)}</td>
          <td>${r.usuarioAprobador || '---'}</td>
          <td>
            <button class="btn btn-sm btn-success" onclick="aprobarRecomendacion(${r.id})">✅</button>
            <button class="btn btn-sm btn-danger" onclick="rechazarRecomendacion(${r.id})">❌</button>
          </td>
        </tr>`;
      }).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--rojo);">Error: ${err.message}</td></tr>`;
  } finally {
    ocultarCarga();
  }
}

async function aprobarRecomendacion(id) {
  mostrarCarga('Aprobando...');
  try {
    await window.api.aprobarRecomendacion(id, usuario.id);
    mostrarToast('Recomendación aprobada y ejecutada', 'success');
    await cargarPendientes();
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
}

async function rechazarRecomendacion(id) {
  mostrarCarga('Rechazando...');
  try {
    await window.api.rechazarRecomendacion(id, usuario.id);
    mostrarToast('Recomendación rechazada', 'success');
    await cargarPendientes();
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
}

async function cargarBitacora() {
  try {
    const todas = await window.api.listarRecomendaciones();
    const tbody = document.getElementById('tablaBitacora');
    if (todas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gris-400);">Sin registros de auditoría</td></tr>';
    } else {
      tbody.innerHTML = todas.map(r => `<tr>
        <td>${r.timestamp_generacion || '---'}</td>
        <td>${r.operador || '---'}</td>
        <td><span class="rol-badge">${r.operador_rol || '---'}</span></td>
        <td>${r.accion}</td>
        <td>Recomendación #${r.id} - ${r.estado} - ${r.nombre_parcela}</td>
      </tr>`).join('');
    }
  } catch (err) {
    console.error('Error cargando bitácora:', err);
  }
}

async function verificarConexiones() {
  try {
    const [api, db] = await Promise.all([
      window.api.probarAPI().catch(() => false),
      window.api.probarBD().catch(() => false)
    ]);
    document.getElementById('estadoAPI').textContent = api ? '🟢 Conectado' : '🔴 Desconectado';
    document.getElementById('estadoBD').textContent = db ? '🟢 Conectado' : '🔴 Desconectado';
  } catch (_) {}
}

cargarPendientes();
cargarBitacora();
verificarConexiones();
