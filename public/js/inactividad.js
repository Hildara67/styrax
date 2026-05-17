let timeoutInactividad;

function reiniciarTimer() {
  clearTimeout(timeoutInactividad);
  timeoutInactividad = setTimeout(() => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  }, 1800000);
}

reiniciarTimer();
document.addEventListener('click', reiniciarTimer);
document.addEventListener('keydown', reiniciarTimer);
document.addEventListener('mousemove', reiniciarTimer);
document.addEventListener('scroll', reiniciarTimer);
document.addEventListener('touchstart', reiniciarTimer);
