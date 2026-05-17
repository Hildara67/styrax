class LecturaDTO {
  constructor({ id, parcelaId, humedadSuelo, temperaturaAmbiente, humedadRelativa, origen, esValida, usuarioRegistro, timestampRegistro, nombreParcela, nombreUsuario }) {
    this.id = id || null;
    this.parcelaId = parcelaId;
    this.nombreParcela = nombreParcela || null;
    this.humedadSuelo = Number(Number(humedadSuelo).toFixed(2));
    this.temperaturaAmbiente = Number(Number(temperaturaAmbiente).toFixed(2));
    this.humedadRelativa = humedadRelativa != null ? Number(Number(humedadRelativa).toFixed(2)) : null;
    this.origen = origen;
    this.esValida = esValida !== undefined ? esValida : true;
    this.usuarioRegistro = usuarioRegistro;
    this.timestampRegistro = timestampRegistro || null;
    this.nombreUsuario = nombreUsuario || null;
    Object.freeze(this);
  }
}

module.exports = LecturaDTO;
