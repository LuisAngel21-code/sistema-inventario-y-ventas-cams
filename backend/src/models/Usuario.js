const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'cams_secret_key_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';
class Usuario {
  static async findByUsername(username) {
    const { rows } = await query(`SELECT u.id, u.username, u.password, u.rol, u.activo, v.id as vendedor_id, v.nombre, v.apellido FROM usuarios u LEFT JOIN vendedores v ON u.vendedor_id = v.id WHERE u.username = $1`, [username]);
    return rows[0] || null;
  }
  static async verifyPassword(plain, hash) { return bcrypt.compare(plain, hash); }
  static signToken(payload) { return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES }); }
  static verifyToken(token) { return jwt.verify(token, JWT_SECRET); }
}
module.exports = Usuario;
