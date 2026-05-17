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

const soloNumeros = /^\d*\.?\d*$/;
['umbralMin', 'umbralMax', 'kcActual'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', function() {
    if (!soloNumeros.test(this.value)) this.value = this.value.replace(/[^0-9.]/g, '');
  });
});

async function cargarParcelas() {
  try {
    const parcelas = await window.api.listarParcelas();
    const select = document.getElementById('cfgParcela');
    select.innerHTML = '<option value="">Seleccione una parcela</option>' +
      parcelas.map(p => `<option value="${p.id}">${p.nombre} - ${p.cultivo}</option>`).join('');
  } catch (err) {
    console.error('Error cargando parcelas:', err);
  }
}

document.getElementById('cfgParcela').addEventListener('change', async function() {
  if (!this.value) return;
  try {
    const cfg = await window.api.obtenerConfig(Number(this.value));
    if (cfg) {
      document.getElementById('umbralMin').value = cfg.umbral_min;
      document.getElementById('umbralMax').value = cfg.umbral_max;
      document.getElementById('kcActual').value = cfg.kc_actual;
    } else {
      document.getElementById('umbralMin').value = '';
      document.getElementById('umbralMax').value = '';
      document.getElementById('kcActual').value = '';
    }
  } catch (err) {
    console.error('Error cargando config:', err);
  }
});

document.getElementById('umbralesForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const parcelaId = document.getElementById('cfgParcela').value;
  const umbralMin = document.getElementById('umbralMin').value;
  const umbralMax = document.getElementById('umbralMax').value;
  const kcActual = document.getElementById('kcActual').value;

  if (!parcelaId) {
    mostrarToast('Seleccione una parcela', 'error');
    return;
  }

  mostrarCarga('Guardando configuración...');
  try {
    const result = await window.api.guardarConfig({
      parcelaId: Number(parcelaId),
      umbralMin: Number(umbralMin),
      umbralMax: Number(umbralMax),
      kcActual: Number(kcActual),
      usuarioResponsable: usuario.id
    });
    if (result.success) {
      mostrarToast('Configuración guardada exitosamente', 'success');
    } else {
      mostrarToast('Error: ' + result.error, 'error');
    }
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
});

document.getElementById('btnProbarAPI').addEventListener('click', async function() {
  mostrarCarga('Probando conexión...');
  try {
    const result = await window.api.probarAPI();
    document.getElementById('estadoAPI').textContent = result.conectado ? '🟢 Conectado' : '🔴 Desconectado';
    mostrarToast(result.conectado ? 'API conectada con éxito' : 'No se pudo conectar a la API. Verifique su conexión.', result.conectado ? 'success' : 'error');
  } catch (err) {
    document.getElementById('estadoAPI').textContent = '🔴 Desconectado';
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
});

document.getElementById('btnGenerarRespaldo').addEventListener('click', async function() {
  mostrarCarga('Generando respaldo...');
  try {
    const result = await window.api.exportarRespaldo('export/respaldo_' + Date.now() + '.json');
    if (result.success) {
      mostrarToast('Respaldo generado exitosamente en: ' + result.ruta, 'success');
    } else {
      mostrarToast('Error al generar respaldo', 'error');
    }
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
});

async function verificarConexionBD() {
  try {
    const result = await window.api.probarBD();
    document.getElementById('estadoBD').textContent = result.conectado ? '🟢 Conectado' : '🔴 Desconectado';
  } catch {
    document.getElementById('estadoBD').textContent = '🔴 Desconectado';
  }
}

cargarParcelas();
verificarConexionBD();
