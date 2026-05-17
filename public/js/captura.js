const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

function mostrarCarga(texto) { loadingText.textContent = texto || 'Procesando...'; loadingOverlay.classList.add('show'); }
function ocultarCarga() { loadingOverlay.classList.remove('show'); }

function verificarSesion() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'));
  if (!usuario) { window.location.href = 'index.html'; return null; }
  if (usuario.rol !== 'OPERADOR') { window.location.href = 'parcelas.html'; return null; }
  document.getElementById('userName').textContent = usuario.nombre;
  document.getElementById('userRol').textContent = usuario.rol;
  return usuario;
}

document.getElementById('btnCerrarSesion').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

const usuario = verificarSesion();

const form = document.getElementById('capturaForm');
const parcela = document.getElementById('parcela');
const humedad = document.getElementById('humedad');
const temperatura = document.getElementById('temperatura');
const hr = document.getElementById('hr');
const et0 = document.getElementById('et0');
const btnProcesar = document.getElementById('btnProcesar');
const btnLimpiar = document.getElementById('btnLimpiar');

const soloNumeros = /^\d*\.?\d*$/;
const soloNumerosNeg = /^-?\d*\.?\d*$/;

let configCache = {};
let parcelasCache = [];

async function cargarParcelas() {
  try {
    parcelasCache = await window.api.listarParcelas();
    parcela.innerHTML = '<option value="">Seleccione una parcela</option>' +
      parcelasCache.map(p => `<option value="${p.id}">${p.nombre} - ${p.cultivo}</option>`).join('');
  } catch (err) {
    console.error('Error cargando parcelas:', err);
  }
}

function validarCampoNumerico(input, errorEl, min, max) {
  const valor = input.value.trim();
  if (valor === '') {
    input.classList.remove('error');
    errorEl.classList.remove('show');
    return null;
  }
  const num = Number(valor);
  if (isNaN(num) || num < min || num > max) {
    input.classList.add('error');
    errorEl.classList.add('show');
    return null;
  }
  input.classList.remove('error');
  errorEl.classList.remove('show');
  return num;
}

function validarFormulario() {
  const parcelaValida = parcela.value !== '';
  const humedadVal = validarCampoNumerico(humedad, document.getElementById('humedadError'), 0, 100);
  const tempVal = validarCampoNumerico(temperatura, document.getElementById('temperaturaError'), -10, 50);
  const valido = parcelaValida && humedadVal !== null && tempVal !== null;
  btnProcesar.disabled = !valido;
  return valido;
}

humedad.addEventListener('input', function() {
  if (!soloNumeros.test(this.value)) this.value = this.value.replace(/[^0-9.]/g, '');
  validarFormulario();
});

temperatura.addEventListener('input', function() {
  if (!soloNumerosNeg.test(this.value)) this.value = this.value.replace(/[^0-9.-]/g, '');
  validarFormulario();
});

hr.addEventListener('input', function() {
  if (!soloNumeros.test(this.value)) this.value = this.value.replace(/[^0-9.]/g, '');
});

parcela.addEventListener('change', async function() {
  validarFormulario();
  if (!this.value) {
    et0.value = '';
    return;
  }
  try {
    const cfg = await window.api.obtenerConfig(Number(this.value));
    if (cfg) configCache[this.value] = cfg;
    const result = await window.api.consultarET0(Number(this.value));
    if (result.success) {
      const kc = configCache[this.value]?.kc_actual || 1.0;
      const etc = Number((kc * result.et0).toFixed(2));
      et0.value = `${etc.toFixed(2)} mm/día`;
    } else {
      et0.value = `${result.et0.toFixed(2)} mm/día (estimado)`;
    }
  } catch (err) {
    console.error('Error obteniendo datos climáticos:', err);
    et0.value = '4.50 mm/día (estimado)';
  }

  if (document.getElementById('origenCSV').checked) {
    await cargarDatosSensores();
  }
});

const sensorSection = document.getElementById('sensorSection');
const sensorStatus = document.getElementById('sensorStatus');
const sensorTableWrapper = document.getElementById('sensorTableWrapper');
const tablaSensores = document.getElementById('tablaSensores');
const btnCargarCSV = document.getElementById('btnCargarCSV');
const campoCard = document.querySelector('.card:nth-of-type(2)');

let csvLecturasParcela = [];

function mostrarSensorStatus(mensaje, tipo) {
  sensorStatus.style.display = 'block';
  sensorStatus.textContent = mensaje;
  sensorStatus.style.background = tipo === 'success' ? '#e4ede3' : tipo === 'info' ? '#e6eef2' : '#fdf0ef';
  sensorStatus.style.color = tipo === 'success' ? '#0F251E' : tipo === 'info' ? '#1E3B47' : '#b52e2a';
  sensorStatus.style.borderLeft = `3px solid ${tipo === 'success' ? '#687648' : tipo === 'info' ? '#AEC5D1' : '#d9534f'}`;
}

async function cargarDatosSensores() {
  campoCard.style.display = 'none';
  sensorSection.style.display = 'block';
  sensorStatus.style.display = 'none';
  sensorTableWrapper.style.display = 'none';
  btnCargarCSV.style.display = 'none';
  btnProcesar.disabled = true;

  if (!parcela.value) {
    mostrarSensorStatus('Seleccione una parcela primero.', 'info');
    return;
  }

  mostrarCarga('Leyendo datos de sensores...');
  try {
    const csvResult = await window.api.leerCSV('datos/sensores.csv');
    if (!csvResult.success || !csvResult.lecturas.length) {
      mostrarSensorStatus('No se encontraron datos en el archivo de sensores.', 'error');
      return;
    }

    csvLecturasParcela = csvResult.lecturas.filter(l => l.parcelaId === Number(parcela.value));
    if (!csvLecturasParcela.length) {
      mostrarSensorStatus('No hay datos de sensores para la parcela seleccionada.', 'info');
      return;
    }

    const historial = await window.api.historialLecturas({ parcelaId: Number(parcela.value) });
    const csvYaCargados = historial.some(r => r.origen === 'CSV');

    tablaSensores.innerHTML = csvLecturasParcela.map(l => `
      <tr>
        <td>${l.parcelaId}</td>
        <td>${l.humedadSuelo.toFixed(2)}</td>
        <td>${l.temperaturaAmbiente.toFixed(2)}</td>
        <td>${l.humedadRelativa ? l.humedadRelativa.toFixed(2) : '-'}</td>
      </tr>
    `).join('');

    sensorTableWrapper.style.display = 'block';

    if (csvYaCargados) {
      mostrarSensorStatus('✅ Datos actuales de los sensores ya han sido cargados al sistema.', 'success');
    } else {
      mostrarSensorStatus('📋 Datos de sensores disponibles. Presione "Cargar" para importarlos al sistema.', 'info');
      btnCargarCSV.style.display = 'inline-flex';
    }
  } catch (err) {
    console.error('Error en modo sensores:', err);
    mostrarSensorStatus('Error al leer datos de sensores: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
}

btnCargarCSV.addEventListener('click', async function() {
  mostrarCarga('Cargando datos CSV al sistema...');
  btnCargarCSV.disabled = true;
  try {
    const result = await window.api.importarAutoCSV();
    const total = Object.values(result.insertados).reduce((a, b) => a + b, 0);
    if (total > 0) {
      mostrarSensorStatus(`✅ ${total} nueva(s) lectura(s) de sensores cargadas al sistema.`, 'success');
      await cargarDatosSensores();
    } else {
      const pid = Number(parcela.value);
      const ya = Object.entries(result.insertados).find(([k]) => Number(k) === pid);
      const totalParcela = ya ? await window.api.historialLecturas({ parcelaId: pid }).then(h => h.filter(r => r.origen === 'CSV').length) : 0;
      const pendientes = csvLecturasParcela.length - totalParcela;
      if (pendientes <= 0) {
        mostrarSensorStatus('✅ Todos los datos de sensores ya están cargados en el sistema.', 'success');
      } else {
        mostrarSensorStatus(`⏳ ${pendientes} lectura(s) pendiente(s) por importar automáticamente.`, 'info');
      }
    }
    btnCargarCSV.style.display = 'none';
  } catch (err) {
    mostrarSensorStatus('Error al cargar datos CSV: ' + err.message, 'error');
  } finally {
    ocultarCarga();
    btnCargarCSV.disabled = false;
  }
});

let autoRefreshInterval;

function iniciarAutoRefreshCSV() {
  detenerAutoRefreshCSV();
  autoRefreshInterval = setInterval(() => {
    if (document.getElementById('origenCSV').checked && parcela.value) {
      cargarDatosSensores();
    }
  }, 30000);
}

function detenerAutoRefreshCSV() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

document.querySelectorAll('input[name="origen"]').forEach(r => {
  r.addEventListener('change', async function() {
    if (this.value === 'CSV') {
      await cargarDatosSensores();
      iniciarAutoRefreshCSV();
    } else {
      detenerAutoRefreshCSV();
      campoCard.style.display = 'block';
      sensorSection.style.display = 'none';
      validarFormulario();
    }
  });
});

btnLimpiar.addEventListener('click', function() {
  form.reset();
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.field-error.show').forEach(el => el.classList.remove('show'));
  et0.value = '';
  btnProcesar.disabled = true;
  campoCard.style.display = 'block';
  sensorSection.style.display = 'none';
  csvLecturasParcela = [];
});

form.addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!validarFormulario()) return;

  mostrarCarga('Guardando lectura y generando recomendación...');
  btnProcesar.disabled = true;

  try {
    const result = await window.api.insertarLectura({
      parcelaId: Number(parcela.value),
      humedadSuelo: Number(humedad.value),
      temperaturaAmbiente: Number(temperatura.value),
      origen: document.querySelector('input[name="origen"]:checked').value,
      usuarioRegistro: usuario.id
    });

    if (result.success) {
      const pendientes = await window.api.listarRecomendacionesPendientes();
      for (const p of pendientes) {
        if (p.parcelaId === Number(parcela.value)) {
          await window.api.rechazarRecomendacion(p.id, usuario.id);
        }
      }

      const cfg = configCache[parcela.value];
      const p = parcelasCache.find(x => x.id === Number(parcela.value));
      const recResult = await window.api.generarRecomendacion({
        parcelaId: Number(parcela.value),
        humedad: Number(humedad.value),
        config: {
          umbralMin: cfg?.umbral_min || 40,
          umbralMax: cfg?.umbral_max || 80,
          kcActual: cfg?.kc_actual || 1.0,
          areaM2: p ? p.areaM2 : 100
        },
        usuarioRegistro: usuario.id
      });

      if (recResult.success) {
        if (recResult.mantenimiento) {
          mostrarToast('✅ Parcela en estado óptimo, no requiere riego.', 'success');
        } else {
          const accion = recResult.recomendacion.accion;
          if (accion === 'APLICAR_RIEGO') {
            mostrarToast('🚰 Lectura guardada. Recomendación: APLICAR RIEGO', 'success');
          } else if (accion === 'DETENER_RIEGO') {
            mostrarToast('⛔ ¡ALERTA! Lectura guardada. Recomendación: DETENER RIEGO — el suelo tiene exceso de humedad.', 'error');
          }
        }
      } else {
        mostrarToast('Lectura guardada, pero no se pudo generar recomendación', 'success');
      }

      form.reset();
      document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
      document.querySelectorAll('.field-error.show').forEach(el => el.classList.remove('show'));
      et0.value = '';
      btnProcesar.disabled = true;
    } else {
      mostrarToast('Error: ' + result.error, 'error');
    }
  } catch (err) {
    mostrarToast('Error de conexión: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
});

function mostrarToast(mensaje, tipo) {
  const toast = document.createElement('div');
  toast.className = `toast show ${tipo}`;
  toast.textContent = mensaje;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

cargarParcelas();
