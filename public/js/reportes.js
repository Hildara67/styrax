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

verificarSesion();

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

async function cargarKPIs() {
  try {
    const [estadisticasLect, estadisticasRecom, resumen] = await Promise.all([
      window.api.estadisticasLecturas(),
      window.api.estadisticasRecomendaciones(),
      window.api.resumenParcelas()
    ]);

    document.getElementById('kpiTotalLecturas').textContent = estadisticasLect.total_lecturas || 0;
    document.getElementById('kpiHumedadProm').textContent = estadisticasLect.humedad_promedio
      ? Number(estadisticasLect.humedad_promedio).toFixed(2) + '%' : '0%';
    document.getElementById('kpiTempProm').textContent = estadisticasLect.temp_promedio
      ? Number(estadisticasLect.temp_promedio).toFixed(2) + '°C' : '0°C';
    document.getElementById('kpiTotalRecom').textContent = estadisticasRecom.total || 0;
    document.getElementById('kpiVolumenRiego').textContent = estadisticasRecom.volumen_ejecutado
      ? Number(estadisticasRecom.volumen_ejecutado).toFixed(2) + ' L' : '0 L';

    document.getElementById('kpiEjecutadas').textContent = estadisticasRecom.ejecutadas || 0;
    document.getElementById('kpiRechazadas').textContent = estadisticasRecom.rechazadas || 0;
    document.getElementById('kpiPendientes').textContent = estadisticasRecom.pendientes || 0;

    const tbody = document.getElementById('tablaResumen');
    if (resumen.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gris-400);">No hay parcelas registradas</td></tr>';
    } else {
      tbody.innerHTML = resumen.map(r => `<tr>
        <td><strong>${r.nombre}</strong></td>
        <td>${Number(r.area_m2).toFixed(2)}</td>
        <td><span class="badge badge-verde">${r.cultivo}</span></td>
        <td>${r.total_lecturas}</td>
        <td>${r.total_recomendaciones}</td>
      </tr>`).join('');
    }
  } catch (err) {
    console.error('Error cargando KPIs:', err);
  }
}

document.getElementById('btnExportarCSV').addEventListener('click', async function() {
  mostrarCarga('Exportando...');
  try {
    const resumen = await window.api.resumenParcelas();
    const columnas = ['nombre', 'area_m2', 'cultivo', 'total_lecturas', 'total_recomendaciones'];
    const result = await window.api.exportarCSVDialog({
      datos: resumen,
      columnas,
      nombrePropuesto: 'reporte_' + Date.now() + '.csv'
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

cargarKPIs();
