const pool = require('../db');
const LecturaDTO = require('../../dto/lectura.dto');

class LecturaDAO {

  static async insertar(lecturaDTO) {
    const sql = `INSERT INTO lecturas_sensores 
      (parcela_id, humedad_suelo, temperatura_ambiente, humedad_relativa, origen, es_valida, usuario_registro, timestamp_registro) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
    const [result] = await pool.query(sql, [
      lecturaDTO.parcelaId,
      lecturaDTO.humedadSuelo,
      lecturaDTO.temperaturaAmbiente,
      lecturaDTO.humedadRelativa,
      lecturaDTO.origen,
      lecturaDTO.esValida,
      lecturaDTO.usuarioRegistro
    ]);
    return result.insertId;
  }

  static async obtenerUltimaPorParcela(parcelaId) {
    const sql = `SELECT l.*, p.nombre as nombre_parcela, p.cultivo 
      FROM lecturas_sensores l 
      JOIN parcelas p ON l.parcela_id = p.id 
      WHERE l.parcela_id = ? 
      ORDER BY l.timestamp_registro DESC LIMIT 1`;
    const [rows] = await pool.query(sql, [parcelaId]);
    if (rows.length === 0) return null;
    return mapearADTO(rows[0]);
  }

  static async obtenerUltimasPorParcela() {
    const sql = `SELECT l.*, p.nombre as nombre_parcela, p.cultivo 
      FROM lecturas_sensores l 
      JOIN parcelas p ON l.parcela_id = p.id 
      WHERE l.timestamp_registro = (
        SELECT MAX(l2.timestamp_registro) 
        FROM lecturas_sensores l2 
        WHERE l2.parcela_id = l.parcela_id
      )`;
    const [rows] = await pool.query(sql);
    return rows.map(mapearADTO);
  }

  static async obtenerHistorial(parcelaId, desde, hasta) {
    let sql = `SELECT l.*, p.nombre as nombre_parcela, p.cultivo, u.nombre as nombre_usuario
      FROM lecturas_sensores l 
      JOIN parcelas p ON l.parcela_id = p.id 
      LEFT JOIN usuarios u ON l.usuario_registro = u.id
      WHERE 1=1`;
    const params = [];
    if (parcelaId) {
      sql += ' AND l.parcela_id = ?';
      params.push(parcelaId);
    }
    if (desde) {
      sql += ' AND l.timestamp_registro >= ?';
      params.push(desde);
    }
    if (hasta) {
      sql += ' AND l.timestamp_registro <= ?';
      params.push(hasta);
    }
    sql += ' ORDER BY l.timestamp_registro DESC';
    const [rows] = await pool.query(sql, params);
    return rows.map(r => new LecturaDTO({
      id: r.id, parcelaId: r.parcela_id, nombreParcela: r.nombre_parcela,
      humedadSuelo: r.humedad_suelo, temperaturaAmbiente: r.temperatura_ambiente,
      humedadRelativa: r.humedad_relativa, origen: r.origen, esValida: r.es_valida,
      usuarioRegistro: r.usuario_registro, timestampRegistro: r.timestamp_registro,
      nombreUsuario: r.nombre_usuario
    }));
  }

  static async contarLecturasHoy() {
    const sql = `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN humedad_suelo BETWEEN 40 AND 80 THEN 1 ELSE 0 END) as optimas,
      SUM(CASE WHEN humedad_suelo < 40 OR humedad_suelo > 80 THEN 1 ELSE 0 END) as alertas,
      SUM(CASE WHEN humedad_suelo < 40 THEN 1 ELSE 0 END) as deficit
      FROM lecturas_sensores 
      WHERE DATE(timestamp_registro) = CURDATE()`;
    const [rows] = await pool.query(sql);
    return rows[0];
  }

  static async obtenerEstadisticas() {
    const sql = `SELECT 
      COUNT(*) as total_lecturas,
      AVG(humedad_suelo) as humedad_promedio,
      AVG(temperatura_ambiente) as temp_promedio
      FROM lecturas_sensores`;
    const [rows] = await pool.query(sql);
    return rows[0];
  }

  static async contarCSV(parcelaId) {
    const sql = `SELECT COUNT(*) as count FROM lecturas_sensores 
      WHERE parcela_id = ? AND origen = 'CSV'`;
    const [rows] = await pool.query(sql, [parcelaId]);
    return rows[0].count;
  }
}

function mapearADTO(row) {
  return new LecturaDTO({
    id: row.id,
    parcelaId: row.parcela_id,
    nombreParcela: row.nombre_parcela || null,
    humedadSuelo: row.humedad_suelo,
    temperaturaAmbiente: row.temperatura_ambiente,
    humedadRelativa: row.humedad_relativa,
    origen: row.origen,
    esValida: row.es_valida,
    usuarioRegistro: row.usuario_registro,
    timestampRegistro: row.timestamp_registro
  });
}

module.exports = LecturaDAO;
