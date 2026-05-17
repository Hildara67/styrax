class ParcelaDTO {
  constructor({ id, nombre, areaM2, cultivo, fechaRegistro }) {
    this.id = id || null;
    this.nombre = nombre;
    this.areaM2 = Number(areaM2);
    this.cultivo = cultivo;
    this.fechaRegistro = fechaRegistro || null;
    Object.freeze(this);
  }
}

module.exports = ParcelaDTO;
