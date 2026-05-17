const fs = require('fs');
const path = require('path');
const pool = require('./db');

class SistemaArchivos {

  static async exportarCSV(datos, columnas, nombreArchivo) {
    const BOM = '\uFEFF';
    const encabezado = columnas.join(',');
    const filas = datos.map(fila =>
      columnas.map(col => {
        const valor = fila[col] != null ? fila[col] : '';
        if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"') || valor.includes('\n'))) {
          return `"${valor.replace(/"/g, '""')}"`;
        }
        return valor;
      }).join(',')
    );
    const csvContent = BOM + encabezado + '\n' + filas.join('\n');

    const dir = path.dirname(nombreArchivo);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(nombreArchivo, csvContent, 'utf8');
    return nombreArchivo;
  }

  static async generarRespaldo(rutaSalida) {
    const tablas = ['usuarios', 'parcelas', 'lecturas_sensores', 'recomendaciones_riego', 'config_sistema'];
    const respaldo = {};
    for (const tabla of tablas) {
      const [rows] = await pool.query(`SELECT * FROM \`${tabla}\``);
      respaldo[tabla] = rows;
    }
    respaldo._metadata = {
      generado: new Date().toISOString(),
      version: '1.0',
      total_registros: Object.values(respaldo).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    };
    const dir = path.dirname(rutaSalida);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(rutaSalida, JSON.stringify(respaldo, null, 2), 'utf8');
    return rutaSalida;
  }

  static async exportarJSON(datos, nombreArchivo) {
    const dir = path.dirname(nombreArchivo);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(nombreArchivo, JSON.stringify(datos, null, 2), 'utf8');
    return nombreArchivo;
  }
}

module.exports = SistemaArchivos;
