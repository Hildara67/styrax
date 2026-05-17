class GestorDecisiones {

  static evaluarUmbral(hFinal, umbralMin, umbralMax) {
    if (hFinal < umbralMin) return 'APLICAR_RIEGO';
    if (hFinal > umbralMax) return 'DETENER_RIEGO';
    return 'MANTENER';
  }

  static calcularVolumen(deficit, area) {
    if (deficit <= 0) return 0.00;
    const volumen = deficit * area * 0.07;
    return Number(volumen.toFixed(2));
  }

  static determinarUrgencia(hFinal, umbralMin) {
    const deficit = umbralMin - hFinal;
    if (deficit > 20) return 'CRÍTICO';
    if (deficit > 10) return 'ALTO';
    if (deficit > 5) return 'MEDIO';
    return 'BAJO';
  }

  static calcularEstadoSemaforo(humedad, umbralMin, umbralMax) {
    if (humedad < 30 || humedad > 90) return 'deficit';
    if (humedad < umbralMin || humedad > umbralMax) return 'alerta';
    return 'optimo';
  }
}

module.exports = GestorDecisiones;
