const { pool } = require('../config/database');

class Admin {
    static async findByUsername(username) {
        const query = `
            SELECT id, username, password_hash
            FROM admins
            WHERE username = $1
        `;
        const result = await pool.query(query, [username]);
        return result.rows[0] || null;
    }

    static async findById(id) {
        const query = `
            SELECT id, username, created_at
            FROM admins
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    static async create(username, passwordHash) {
        const query = `
            INSERT INTO admins (username, password_hash)
            VALUES ($1, $2)
            RETURNING id, username, created_at
        `;
        const result = await pool.query(query, [username, passwordHash]);
        return result.rows[0];
    }

    static async updatePassword(id, newHash) {
        const query = `
            UPDATE admins
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `;
        await pool.query(query, [newHash, id]);
    }
}

module.exports = Admin;