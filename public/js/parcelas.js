const loadingOverlay = document.getElementById('loadingOverlay');

function mostrarCarga() { loadingOverlay.classList.add('show'); }
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

const modalParcela = document.getElementById('modalParcela');
const parcelaForm = document.getElementById('parcelaForm');
const modalTitle = document.getElementById('modalTitle');
const editId = document.getElementById('editId');
const nombreInput = document.getElementById('nombreParcela');
const areaInput = document.getElementById('areaParcela');
const cultivoInput = document.getElementById('cultivoParcela');
const btnGuardar = document.getElementById('btnGuardarParcela');

document.getElementById('btnNuevaParcela').addEventListener('click', () => abrirModal());
document.getElementById('btnCancelarModal').addEventListener('click', cerrarModal);
modalParcela.addEventListener('click', (e) => { if (e.target === modalParcela) cerrarModal(); });

function abrirModal(parcela) {
  modalTitle.textContent = parcela ? 'Editar Parcela' : 'Nueva Parcela';
  editId.value = parcela ? parcela.id : '';
  nombreInput.value = parcela ? parcela.nombre : '';
  areaInput.value = parcela ? parcela.areaM2 : '';
  cultivoInput.value = parcela ? parcela.cultivo : '';
  nombreInput.classList.remove('error');
  areaInput.classList.remove('error');
  modalParcela.classList.add('show');
}

function cerrarModal() {
  modalParcela.classList.remove('show');
  parcelaForm.reset();
  editId.value = '';
}

const soloNumeros = /^\d*\.?\d*$/;
areaInput.addEventListener('input', function() {
  if (!soloNumeros.test(this.value)) this.value = this.value.replace(/[^0-9.]/g, '');
});

async function cargarParcelas() {
  const tbody = document.getElementById('tablaParcelas');
  mostrarCarga();
  try {
    const parcelas = await window.api.listarParcelas();
    if (parcelas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gris-400);">No hay parcelas registradas</td></tr>';
    } else {
      tbody.innerHTML = parcelas.map(p => `<tr>
        <td>${p.id}</td>
        <td><strong>${p.nombre}</strong></td>
        <td>${Number(p.areaM2).toFixed(2)}</td>
        <td><span class="badge badge-verde">${p.cultivo}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editarParcela(${p.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarParcela(${p.id}, '${p.nombre}')">Eliminar</button>
        </td>
      </tr>`).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--rojo);">Error: ${err.message}</td></tr>`;
  } finally {
    ocultarCarga();
  }
}

async function editarParcela(id) {
  try {
    const parcelas = await window.api.listarParcelas();
    const p = parcelas.find(x => x.id === id);
    if (p) abrirModal(p);
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  }
}

async function eliminarParcela(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre}"?`)) return;
  mostrarCarga();
  try {
    const result = await window.api.eliminarParcela(id);
    if (result.success) {
      mostrarToast('Parcela eliminada', 'success');
      await cargarParcelas();
    } else {
      mostrarToast('Error: ' + result.error, 'error');
    }
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
}

parcelaForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const nombre = nombreInput.value.trim();
  const area = Number(areaInput.value);
  const cultivo = cultivoInput.value;
  const id = editId.value;

  if (!nombre || !area || area <= 0 || !cultivo) {
    mostrarToast('Complete todos los campos obligatorios', 'error');
    return;
  }

  btnGuardar.disabled = true;
  mostrarCarga();

  try {
    const data = { nombre, areaM2: area, cultivo };
    let result;
    if (id) {
      result = await window.api.actualizarParcela(Number(id), data);
    } else {
      result = await window.api.crearParcela(data);
    }
    if (result.success) {
      mostrarToast(id ? 'Parcela actualizada' : 'Parcela creada', 'success');
      cerrarModal();
      await cargarParcelas();
    } else {
      mostrarToast('Error: ' + result.error, 'error');
    }
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    btnGuardar.disabled = false;
    ocultarCarga();
  }
});

cargarParcelas();
