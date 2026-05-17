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

document.getElementById('toggleNewPassword').addEventListener('click', function() {
  const input = document.getElementById('nuevoPassword');
  input.type = input.type === 'password' ? 'text' : 'password';
});

document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
  const input = document.getElementById('confirmarPassword');
  input.type = input.type === 'password' ? 'text' : 'password';
});

document.getElementById('usuarioForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const nombre = document.getElementById('nuevoNombre').value.trim();
  const rol = document.getElementById('nuevoRol').value;
  const password = document.getElementById('nuevoPassword').value;
  const confirmar = document.getElementById('confirmarPassword').value;
  const passwordError = document.getElementById('passwordError');

  if (password !== confirmar) {
    passwordError.classList.add('show');
    return;
  }
  passwordError.classList.remove('show');

  mostrarCarga('Creando usuario...');
  try {
    const result = await window.api.crearUsuario({ nombre, rol, password });
    if (result.success) {
      mostrarToast('Usuario creado exitosamente', 'success');
      document.getElementById('usuarioForm').reset();
      await cargarUsuarios();
    } else {
      mostrarToast('Error: ' + result.error, 'error');
    }
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
});

async function cargarUsuarios() {
  const tbody = document.getElementById('tablaUsuarios');
  mostrarCarga('Cargando usuarios...');
  try {
    const usuarios = await window.api.listarUsuarios();
    if (usuarios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gris-400);">No hay usuarios registrados</td></tr>';
    } else {
      tbody.innerHTML = usuarios.map(u => {
        const rolColor = u.rol === 'SUPERVISOR' ? 'badge-verde' : 'badge-cafe';
        return `<tr>
          <td>${u.id}</td>
          <td><strong>${u.nombre}</strong></td>
          <td><span class="badge ${rolColor}">${u.rol}</span></td>
          <td>${u.ultima_sesion || 'Nunca'}</td>
          <td>
            ${u.activo ? `<button class="btn btn-sm btn-danger" onclick="desactivarUsuario(${u.id})">Desactivar</button>` : '<span class="badge badge-rojo">Inactivo</span>'}
          </td>
        </tr>`;
      }).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--rojo);">Error: ${err.message}</td></tr>`;
  } finally {
    ocultarCarga();
  }
}

async function desactivarUsuario(id) {
  if (!confirm('¿Desactivar este usuario? Esta acción es reversible.')) return;
  mostrarCarga('Desactivando usuario...');
  try {
    await window.api.desactivarUsuario(id);
    mostrarToast('Usuario desactivado', 'success');
    await cargarUsuarios();
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  } finally {
    ocultarCarga();
  }
}

cargarUsuarios();
