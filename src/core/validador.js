class Validador {

  static esNumero(valor) {
    return typeof valor === 'number' && !isNaN(valor);
  }

  static esRangoHumedad(valor) {
    if (!this.esNumero(valor)) {
      throw new Error('Humedad fuera de rango: ' + valor);
    }
    if (valor < 0 || valor > 100) {
      throw new Error('Humedad fuera de rango: ' + valor);
    }
    return true;
  }

  static esRangoTemperatura(valor) {
    if (!this.esNumero(valor)) {
      throw new Error('Temperatura fuera de rango: ' + valor);
    }
    if (valor < -10 || valor > 50) {
      throw new Error('Temperatura fuera de rango: ' + valor);
    }
    return true;
  }

  static esRangoHR(valor) {
    if (valor == null) return true;
    if (!this.esNumero(valor)) {
      throw new Error('Humedad relativa fuera de rango: ' + valor);
    }
    if (valor < 0 || valor > 100) {
      throw new Error('Humedad relativa fuera de rango: ' + valor);
    }
    return true;
  }

  static esAreaValida(valor) {
    if (!this.esNumero(valor) || valor <= 0) {
      throw new Error('Área debe ser un número mayor a 0');
    }
    return true;
  }

  static esNombreUnico(nombre) {
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío');
    }
    return true;
  }

  static validarUmbrales(umbralMin, umbralMax) {
    if (!this.esNumero(umbralMin) || !this.esNumero(umbralMax)) {
      throw new Error('Los umbrales deben ser numéricos');
    }
    if (umbralMin < 0 || umbralMax > 100 || umbralMin > 100 || umbralMax < 0) {
      throw new Error('Los umbrales deben estar entre 0% y 100%');
    }
    if (umbralMin >= umbralMax) {
      throw new Error('El umbral mínimo debe ser menor al máximo');
    }
    return true;
  }

  static validarKc(valor) {
    if (!this.esNumero(valor)) {
      throw new Error('Kc debe ser numérico');
    }
    if (valor < 0.1 || valor > 2.0) {
      throw new Error('Kc debe estar entre 0.1 y 2.0');
    }
    return true;
  }

  static sanitizarNumero(valor) {
    const numero = Number(valor);
    if (isNaN(numero)) return null;
    return numero;
  }
}

module.exports = Validador;
