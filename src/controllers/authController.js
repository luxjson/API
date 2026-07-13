const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const generateToken = (admin) => {
    return jwt.sign(
        { id: admin.id, username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validação básica
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Usuário e senha são obrigatórios' 
            });
        }

        // Buscar admin
        const admin = await Admin.findByUsername(username);
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciais inválidas' 
            });
        }

        // Comparar senha
        const isValid = await bcrypt.compare(password, admin.password_hash);
        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciais inválidas' 
            });
        }

        // Gerar token
        const token = generateToken(admin);

        // Remover hash da resposta
        delete admin.password_hash;

        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                created_at: admin.created_at
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.me = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin não encontrado' 
            });
        }
        res.json({ success: true, admin });
    } catch (error) {
        next(error);
    }
};
