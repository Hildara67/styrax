class MotorFAO56 {

  static calcularETc(kc, et0) {
    const kcNum = Number(kc);
    const et0Num = Number(et0);
    if (isNaN(kcNum) || isNaN(et0Num)) {
      throw new Error('Parámetros deben ser numéricos');
    }
    const resultado = kcNum * et0Num;
    return Number(resultado.toFixed(2));
  }

  static calcularBalanceHidrico(hInicial, precip, riego, etc, drenaje) {
    const balance = hInicial + precip + riego - etc - drenaje;
    return Number(balance.toFixed(2));
  }
}

module.exports = MotorFAO56;
