const fs = require('fs');
const csv = require('csv-parser');
const LecturaDTO = require('../dto/lectura.dto');
const Validador = require('../core/validador');

class AdaptadorCSV {

  static async leer(rutaArchivo) {
    const lecturas = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(rutaArchivo)
        .pipe(csv({ separator: ',' }))
        .on('data', (row) => {
          try {
            const lectura = this.procesarFila(row);
            if (lectura) {
              lecturas.push(lectura);
            }
          } catch (err) {
            console.warn('Fila inválida:', row, err.message);
          }
        })
        .on('end', () => resolve(lecturas))
        .on('error', (err) => reject(err));
    });
  }

  static procesarFila(row) {
    const humedad = Validador.sanitizarNumero(row.humedad_suelo || row.humedad);
    const temperatura = Validador.sanitizarNumero(row.temperatura_ambiente || row.temperatura);
    const parcelaId = Validador.sanitizarNumero(row.parcela_id || row.parcelaId);
    const hr = Validador.sanitizarNumero(row.humedad_relativa || row.hr);

    if (parcelaId == null || humedad == null || temperatura == null) {
      return null;
    }

    let esValida = true;
    try {
      Validador.esRangoHumedad(humedad);
      Validador.esRangoTemperatura(temperatura);
    } catch {
      esValida = false;
    }

    return new LecturaDTO({
      parcelaId,
      humedadSuelo: humedad,
      temperaturaAmbiente: temperatura,
      humedadRelativa: hr,
      origen: 'CSV',
      esValida
    });
  }
}

module.exports = AdaptadorCSV;
