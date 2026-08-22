const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const generateToken = (admin) => {
    return jwt.sign(
        {
            id: admin.id,
            username: admin.username,
            role: 'admin',
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

exports.login = async (req, res, next) => {
    try {
        const username = String(req.body?.username || '').trim();
        const password = String(req.body?.password || '');

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuário e senha são obrigatórios',
            });
        }

        const admin = await Admin.findByUsername(username);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas',
            });
        }

        const isValid = await bcrypt.compare(password, admin.password_hash);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas',
            });
        }

        const token = generateToken(admin);

        return res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                created_at: admin.created_at,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.me = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Administrador não encontrado',
            });
        }

        return res.json({
            success: true,
            admin,
        });
    } catch (error) {
        next(error);
    }
};
