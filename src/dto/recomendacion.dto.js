class RecomendacionDTO {
  constructor({ id, parcelaId, nombreParcela, cultivo, volumenSugeridoL, accion, estado, urgencia, usuarioAprobador, timestampGeneracion }) {
    this.id = id || null;
    this.parcelaId = parcelaId;
    this.nombreParcela = nombreParcela || '';
    this.cultivo = cultivo || '';
    this.volumenSugeridoL = Number(Number(volumenSugeridoL).toFixed(2));
    this.accion = accion;
    this.estado = estado || 'PENDIENTE';
    this.urgencia = urgencia || 'BAJO';
    this.usuarioAprobador = usuarioAprobador || null;
    this.timestampGeneracion = timestampGeneracion || null;
    Object.freeze(this);
  }
}

module.exports = RecomendacionDTO;
