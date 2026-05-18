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

async function cargarParcelas() {
  try {
    const parcelas = await window.api.listarParcelas();
    const select = document.getElementById('filtroParcela');
    select.innerHTML = '<option value="">Todas</option>' +
      parcelas.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
  } catch (err) {
    console.error('Error cargando parcelas:', err);
  }
}

async function cargarHistorial() {
  const parcelaId = document.getElementById('filtroParcela').value;
  const desde = document.getElementById('filtroDesde').value;
  const hasta = document.getElementById('filtroHasta').value;

  mostrarCarga('Cargando historial...');
  try {
    const datos = await window.api.historialLecturas({
      parcelaId: parcelaId || null,
      desde: desde || null,
      hasta: hasta || null
    });

    const tbody = document.getElementById('tablaHistorial');
    if (datos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gris-400);">No se encontraron registros</td></tr>';
    } else {
      tbody.innerHTML = datos.map(d => `<tr>
        <td>${d.timestampRegistro || '---'}</td>
        <td>${d.nombreParcela || '---'}</td>
        <td>${Number(d.humedadSuelo).toFixed(2)}</td>
        <td>${Number(d.temperaturaAmbiente).toFixed(2)}</td>
        <td>${d.humedadRelativa !== null ? Number(d.humedadRelativa).toFixed(2) : '---'}</td>
        <td><span class="badge ${d.origen === 'CSV' ? 'badge-azul' : 'badge-cafe'}">${d.origen}</span></td>
        <td>${d.esValida ? '<span class="badge badge-verde">Sí</span>' : '<span class="badge badge-rojo">No</span>'}</td>
      </tr>`).join('');
    }
  } catch (err) {
    document.getElementById('tablaHistorial').innerHTML =
      `<tr><td colspan="7" style="text-align:center;color:var(--rojo);">Error: ${err.message}</td></tr>`;
  } finally {
    ocultarCarga();
  }
}

document.getElementById('btnFiltrar').addEventListener('click', cargarHistorial);

document.getElementById('btnExportarCSV').addEventListener('click', async function() {
  mostrarCarga('Exportando...');
  try {
    const parcelaId = document.getElementById('filtroParcela').value;
    const desde = document.getElementById('filtroDesde').value;
    const hasta = document.getElementById('filtroHasta').value;
    const datos = await window.api.historialLecturas({
      parcelaId: parcelaId || null,
      desde: desde || null,
      hasta: hasta || null
    });
    const columnas = ['timestampRegistro', 'nombreParcela', 'humedadSuelo', 'temperaturaAmbiente', 'humedadRelativa', 'origen', 'esValida'];
    const result = await window.api.exportarCSVDialog({
      datos,
      columnas,
      nombrePropuesto: 'historial_' + Date.now() + '.csv'
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

cargarParcelas();
cargarHistorial();
