const pool = require('../db');
const UsuarioDTO = require('../../dto/usuario.dto');

class UsuarioDAO {

  static async autenticar(nombre, password) {
    const sql = `SELECT * FROM usuarios WHERE nombre = ? AND activo = true LIMIT 1`;
    const [rows] = await pool.query(sql, [nombre]);
    if (rows.length === 0) return null;
    const usuario = rows[0];
    if (usuario.password_hash !== password) return null;
    await this.actualizarUltimaSesion(usuario.id);
    return new UsuarioDTO({
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      activo: usuario.activo
    });
  }

  static async actualizarUltimaSesion(id) {
    const sql = `UPDATE usuarios SET ultima_sesion = NOW() WHERE id = ?`;
    await pool.query(sql, [id]);
  }

  static async listarTodos() {
    const sql = `SELECT id, nombre, rol, ultima_sesion, activo FROM usuarios ORDER BY id`;
    const [rows] = await pool.query(sql);
    return rows;
  }

  static async crear(nombre, rol, passwordHash) {
    const sql = `INSERT INTO usuarios (nombre, rol, password_hash, fecha_creacion) VALUES (?, ?, ?, NOW())`;
    const [result] = await pool.query(sql, [nombre, rol, passwordHash]);
    return result.insertId;
  }

  static async desactivar(id) {
    const sql = `UPDATE usuarios SET activo = false WHERE id = ?`;
    await pool.query(sql, [id]);
  }

  static async buscarPorNombre(nombre) {
    const sql = `SELECT * FROM usuarios WHERE nombre = ?`;
    const [rows] = await pool.query(sql, [nombre]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async listarOperadores() {
    const sql = `SELECT id, nombre FROM usuarios WHERE rol = 'OPERADOR' AND activo = true`;
    const [rows] = await pool.query(sql);
    return rows;
  }
}

module.exports = UsuarioDAO;
