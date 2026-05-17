const pool = require('../db');
const RecomendacionDTO = require('../../dto/recomendacion.dto');

class RecomendacionDAO {

  static async insertar(recomendacionDTO) {
    const sql = `INSERT INTO recomendaciones_riego 
      (parcela_id, volumen_sugerido_L, accion, estado, urgencia, usuario_aprobador, timestamp_generacion) 
      VALUES (?, ?, ?, 'PENDIENTE', ?, NULL, NOW())`;
    const [result] = await pool.query(sql, [
      recomendacionDTO.parcelaId,
      recomendacionDTO.volumenSugeridoL,
      recomendacionDTO.accion,
      recomendacionDTO.urgencia || 'BAJO'
    ]);
    return result.insertId;
  }

  static async obtenerPendientes() {
    const sql = `SELECT r.*, p.nombre as nombre_parcela, p.cultivo 
      FROM recomendaciones_riego r 
      JOIN parcelas p ON r.parcela_id = p.id 
      WHERE r.estado = 'PENDIENTE' AND r.accion IN ('APLICAR_RIEGO', 'DETENER_RIEGO')
      ORDER BY r.timestamp_generacion DESC`;
    const [rows] = await pool.query(sql);
    return rows.map(mapearADTO);
  }

  static async obtenerTodas() {
    const sql = `SELECT r.*, p.nombre as nombre_parcela, p.cultivo, u.nombre as operador, u.rol as operador_rol
      FROM recomendaciones_riego r 
      JOIN parcelas p ON r.parcela_id = p.id 
      LEFT JOIN usuarios u ON r.usuario_aprobador = u.id
      ORDER BY r.timestamp_generacion DESC`;
    const [rows] = await pool.query(sql);
    return rows;
  }

  static async actualizarEstado(id, estado, usuarioAprobador) {
    const sql = `UPDATE recomendaciones_riego 
      SET estado = ?, usuario_aprobador = ? 
      WHERE id = ?`;
    await pool.query(sql, [estado, usuarioAprobador, id]);
  }

  static async confirmarRiego(id, usuarioAprobador) {
    return this.actualizarEstado(id, 'EJECUTADA', usuarioAprobador);
  }

  static async enviarAValidacion(id, usuarioOperador) {
    const sql = `UPDATE recomendaciones_riego SET usuario_aprobador = ? WHERE id = ?`;
    await pool.query(sql, [usuarioOperador, id]);
  }

  static async rechazarRiego(id, usuarioAprobador) {
    return this.actualizarEstado(id, 'RECHAZADA', usuarioAprobador);
  }

  static async obtenerPorId(id) {
    const sql = `SELECT * FROM recomendaciones_riego WHERE id = ?`;
    const [rows] = await pool.query(sql, [id]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  static async obtenerUltimaEjecutada(parcelaId) {
    const sql = `SELECT * FROM recomendaciones_riego 
      WHERE parcela_id = ? AND estado = 'EJECUTADA' AND accion = 'APLICAR_RIEGO'
      ORDER BY timestamp_generacion DESC LIMIT 1`;
    const [rows] = await pool.query(sql, [parcelaId]);
    return rows[0] || null;
  }

  static async obtenerEstadisticas() {
    const sql = `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN estado = 'EJECUTADA' THEN 1 ELSE 0 END) as ejecutadas,
      SUM(CASE WHEN estado = 'RECHAZADA' THEN 1 ELSE 0 END) as rechazadas,
      SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
      SUM(CASE WHEN estado = 'EJECUTADA' THEN volumen_sugerido_L ELSE 0 END) as volumen_ejecutado
      FROM recomendaciones_riego`;
    const [rows] = await pool.query(sql);
    return rows[0];
  }
}

function mapearADTO(row) {
  return new RecomendacionDTO({
    id: row.id,
    parcelaId: row.parcela_id,
    nombreParcela: row.nombre_parcela,
    cultivo: row.cultivo,
    volumenSugeridoL: row.volumen_sugerido_L,
    accion: row.accion,
    estado: row.estado,
    urgencia: row.urgencia,
    usuarioAprobador: row.usuario_aprobador,
    timestampGeneracion: row.timestamp_generacion
  });
}

module.exports = RecomendacionDAO;
