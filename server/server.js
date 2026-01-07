const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Generate tokens
const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            branch: user.branch_code,
            employeeId: user.employee_id 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET + '_refresh',
        { expiresIn: '7d' }
    );
};

// Middleware untuk verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Access token required' 
        });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                error: 'Invalid or expired token' 
            });
        }
        req.user = user;
        next();
    });
};

// ============ ROUTES ============

// 1. Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username and password required' 
            });
        }
        
        // Cari user
        const [users] = await pool.execute(
            `SELECT id, employee_id, username, password, full_name, email, 
                    branch_code, position, role 
             FROM users 
             WHERE username = ? OR employee_id = ?`,
            [username, username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
        
        const user = users[0];
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
        
        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        
        // Update last login
        await pool.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );
        
        // Hapus password dari response
        delete user.password;
        
        res.json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error during login' 
        });
    }
});

// 3. VERIFY TOKEN
app.get('/api/verify-token', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user,
        message: 'Token is valid'
    });
});

// 4. GET PROFILE
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT id, employee_id, username, full_name, email, 
                    branch_code, position, role, last_login, created_at 
             FROM users 
             WHERE id = ?`,
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            user: users[0]
        });
        
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// 5. LOGOUT
app.post('/api/logout', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Logout successful' 
    });
});

// 6. GET BRANCH DATA
app.get('/api/branch-data', authenticateToken, async (req, res) => {
    try {
        const branchData = {
            branch_code: req.user.branch,
            branch_name: `Cabang ${req.user.branch}`,
            total_deposits: 50000000,
            total_loans: 25000000,
            monthly_target: 75000000,
            performance_score: 85,
            customers_count: 1250,
            staff_count: 15
        };
        
        res.json({
            success: true,
            data: branchData
        });
        
    } catch (error) {
        console.error('Branch data error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// 7. REFRESH TOKEN (tambahan untuk completeness)
app.post('/api/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ 
                success: false, 
                error: 'Refresh token required' 
            });
        }
        
        // Verify refresh token
        jwt.verify(refreshToken, process.env.JWT_SECRET + '_refresh', (err, decoded) => {
            if (err) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Invalid refresh token' 
                });
            }
            
            // Generate new access token
            const newAccessToken = jwt.sign(
                { 
                    id: decoded.id, 
                    username: decoded.username, 
                    role: decoded.role,
                    branch: decoded.branch,
                    employeeId: decoded.employeeId 
                },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            
            res.json({
                success: true,
                accessToken: newAccessToken
            });
        });
        
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// ============ ERROR HANDLING ============

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

// 404 handler - HARUS DI AKHIR SETELAH SEMUA ROUTE
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found',
        path: req.originalUrl 
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`🔑 JWT Enabled`);
});