const pool = require('../db');

class ConfigDAO {

  static async obtenerConfig(parcelaId) {
    const sql = `SELECT * FROM config_sistema WHERE parcela_id = ?`;
    const [rows] = await pool.query(sql, [parcelaId]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  static async guardarConfig(parcelaId, umbralMin, umbralMax, kcActual, usuarioResponsable) {
    const existe = await this.obtenerConfig(parcelaId);
    if (existe) {
      const sql = `UPDATE config_sistema 
        SET umbral_min = ?, umbral_max = ?, kc_actual = ?, usuario_responsable = ? 
        WHERE parcela_id = ?`;
      await pool.query(sql, [umbralMin, umbralMax, kcActual, usuarioResponsable, parcelaId]);
    } else {
      const sql = `INSERT INTO config_sistema (parcela_id, umbral_min, umbral_max, kc_actual, usuario_responsable) 
        VALUES (?, ?, ?, ?, ?)`;
      await pool.query(sql, [parcelaId, umbralMin, umbralMax, kcActual, usuarioResponsable]);
    }
  }

  static async probarConexion() {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = ConfigDAO;
