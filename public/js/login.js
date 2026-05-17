const intro = document.getElementById('loginIntro');
const loginMain = document.getElementById('loginMain');
const form = document.getElementById('loginForm');
const usuarioInput = document.getElementById('usuario');
const passwordInput = document.getElementById('password');
const btnIngresar = document.getElementById('btnIngresar');
const errorMessage = document.getElementById('errorMessage');
const togglePassword = document.getElementById('togglePassword');

setTimeout(() => {
  intro.classList.add('fade-out');
  setTimeout(() => {
    intro.style.display = 'none';
    loginMain.style.display = 'flex';
    requestAnimationFrame(() => {
      loginMain.classList.add('show');
      if (window.innerWidth > 768 && !window.api) {
        usuarioInput.focus();
      }
    });
  }, 700);
}, 2200);

function validarFormulario() {
  const valido = usuarioInput.value.trim().length > 0 && passwordInput.value.length >= 8;
  btnIngresar.disabled = !valido;
}

usuarioInput.addEventListener('input', validarFormulario);
passwordInput.addEventListener('input', validarFormulario);

usuarioInput.addEventListener('input', function() {
  this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
});

togglePassword.addEventListener('click', function() {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
});

if (!window.api) {
  errorMessage.textContent = 'Error cargando la aplicación. Intenta recargar la página.';
  errorMessage.classList.add('show');
  btnIngresar.disabled = true;
}

form.addEventListener('submit', async function(e) {
  e.preventDefault();
  if (btnIngresar.disabled) return;

  errorMessage.classList.remove('show');
  btnIngresar.disabled = true;
  btnIngresar.textContent = 'Ingresando...';

  try {
    if (!window.api || !window.api.login) {
      throw new Error('API no disponible. Ejecuta la aplicación con "npm start" desde la terminal.');
    }

    const result = await window.api.login({
      nombre: usuarioInput.value.trim(),
      password: passwordInput.value
    });

    if (result.success) {
      sessionStorage.setItem('usuario', JSON.stringify(result.usuario));
      const rol = result.usuario.rol;
      if (rol === 'OPERADOR') {
        window.location.href = 'dashboard.html';
      } else {
        window.location.href = 'parcelas.html';
      }
    } else {
      errorMessage.textContent = result.error || 'Credenciales inválidas';
      errorMessage.classList.add('show');
      usuarioInput.focus();
    }
  } catch (err) {
    errorMessage.textContent = 'Error: ' + err.message;
    errorMessage.classList.add('show');
  } finally {
    btnIngresar.disabled = false;
    btnIngresar.textContent = 'Ingresar';
  }
});
