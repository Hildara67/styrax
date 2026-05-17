class UsuarioDTO {
  constructor({ id, nombre, rol, ultimaSesion, activo }) {
    this.id = id || null;
    this.nombre = nombre;
    this.rol = rol;
    this.ultimaSesion = ultimaSesion || null;
    this.activo = activo !== undefined ? activo : true;
    Object.freeze(this);
  }
}

module.exports = UsuarioDTO;
