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

// Hardcode branch info (karena cuma satu cabang)
const BRANCH_INFO = {
    id: 'KCP-TEMPO-001',
    name: 'KCP Jakarta Tempo Pavillion 2',
    area: 'AREA JAKARTA SAHARJO'
};

// Generate tokens
const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            name: user.full_name
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // Lebih lama karena single user
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
        branch: BRANCH_INFO,
        timestamp: new Date().toISOString()
    });
});

// 2. LOGIN (single admin user)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username and password required' 
            });
        }
        
        // Cari admin user
        const [users] = await pool.execute(
            `SELECT id, username, password, full_name 
             FROM users 
             WHERE username = ? AND role = 'admin'`,
            [username]
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
        
        // Generate token
        const accessToken = generateAccessToken(user);
        
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
            user: {
                ...user,
                branch: BRANCH_INFO
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// 3. VERIFY TOKEN
app.get('/api/verify-token', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: {
            ...req.user,
            branch: BRANCH_INFO
        },
        message: 'Token is valid'
    });
});

// 4. GET ALL DPK DATA
app.get('/api/dpk', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM dpk_data 
             WHERE branch_id = ?
             ORDER BY 
               CASE 
                 WHEN period = 'Dec-24' THEN 1
                 WHEN period = 'Oct-25' THEN 2
                 WHEN period = 'Nov-25' THEN 3
                 WHEN period = '31-Dec' THEN 4
                 ELSE 5
               END`,
            [BRANCH_INFO.id]
        );
        
        res.json({
            success: true,
            data: rows
        });
        
    } catch (error) {
        console.error('Get DPK data error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// 5. GET SPECIFIC PERIOD DPK DATA
app.get('/api/dpk/:period', authenticateToken, async (req, res) => {
    try {
        const { period } = req.params;
        
        const [rows] = await pool.execute(
            `SELECT * FROM dpk_data 
             WHERE branch_id = ? AND period = ?`,
            [BRANCH_INFO.id, period]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Data not found' 
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
        
    } catch (error) {
        console.error('Get DPK period error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// 6. CREATE/UPDATE DPK DATA - FIXED dengan 18 kolom
app.post('/api/dpk', authenticateToken, async (req, res) => {
    try {
        const {
            period,
            date,
            dpk,
            tabungan,
            giro,
            deposito,
            target_dpk,
            target_tabungan,
            target_giro,
            target_deposito,
            target_casa,
            notes
        } = req.body;
        
        console.log('📥 Received DPK data:', req.body);
        
        // Validasi required fields
        const requiredFields = ['period', 'dpk', 'tabungan', 'giro', 'deposito'];
        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                return res.status(400).json({ 
                    success: false, 
                    error: `${field} wajib diisi` 
                });
            }
        }
        
        // Parse nilai numerik
        const dpkValue = parseFloat(dpk);
        const tabunganValue = parseFloat(tabungan);
        const giroValue = parseFloat(giro);
        const depositoValue = parseFloat(deposito);
        
        // Validasi numerik
        if (isNaN(dpkValue) || dpkValue <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'DPK harus berupa angka lebih dari 0' 
            });
        }
        
        if (isNaN(tabunganValue)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tabungan harus berupa angka' 
            });
        }
        
        if (isNaN(giroValue)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Giro harus berupa angka' 
            });
        }
        
        if (isNaN(depositoValue)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Deposito harus berupa angka' 
            });
        }
        
        // Hitung CASA dan % CASA
        const casaValue = tabunganValue + giroValue;
        const casaPercentageValue = dpkValue > 0 ? ((casaValue / dpkValue) * 100) : 0;
        
        // Parse target values (nullable)
        const targetDpkValue = target_dpk ? parseFloat(target_dpk) : null;
        const targetTabunganValue = target_tabungan ? parseFloat(target_tabungan) : null;
        const targetGiroValue = target_giro ? parseFloat(target_giro) : null;
        const targetDepositoValue = target_deposito ? parseFloat(target_deposito) : null;
        const targetCasaValue = target_casa ? parseFloat(target_casa) : null;
        
        // Format date
        let formattedDate = null;
        if (date) {
            try {
                if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // Format YYYY-MM-DD
                    formattedDate = date;
                } else if (date.match(/^\d{2}-\w{3}-\d{4}$/)) {
                    // Format DD-MMM-YYYY (contoh: 01-Jan-2026)
                    const parts = date.split('-');
                    const months = {
                        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                    };
                    const day = parts[0];
                    const month = months[parts[1]];
                    const year = parts[2];
                    formattedDate = `${year}-${month}-${day}`;
                }
            } catch (err) {
                console.log(`⚠️ Error parsing date ${date}:`, err.message);
            }
        }
        
        // Data untuk database
        const dpkData = {
            period: period,
            date: formattedDate,
            branch_id: BRANCH_INFO.id,
            branch_name: BRANCH_INFO.name,
            area: BRANCH_INFO.area,
            dpk: dpkValue,
            tabungan: tabunganValue,
            giro: giroValue,
            deposito: depositoValue,
            casa: casaValue,
            casa_percentage: parseFloat(casaPercentageValue.toFixed(2)),
            target_dpk: targetDpkValue,
            target_tabungan: targetTabunganValue,
            target_giro: targetGiroValue,
            target_deposito: targetDepositoValue,
            target_casa: targetCasaValue,
            notes: notes || null,
            created_by: req.user.username || 'admin'
        };
        
        console.log('🔄 Processed DPK data:', dpkData);
        
        // Check if data already exists
        const [existing] = await pool.execute(
            'SELECT id FROM dpk_data WHERE period = ?',
            [period]
        );
        
        let message;
        let queryResult;
        
        if (existing.length > 0) {
            // Update existing data
            const updateQuery = `
                UPDATE dpk_data SET 
                    date = ?,
                    branch_id = ?,
                    branch_name = ?,
                    area = ?,
                    dpk = ?, 
                    tabungan = ?, 
                    giro = ?, 
                    deposito = ?,
                    casa = ?, 
                    casa_percentage = ?,
                    target_dpk = ?, 
                    target_tabungan = ?, 
                    target_giro = ?,
                    target_deposito = ?, 
                    target_casa = ?, 
                    notes = ?,
                    updated_at = NOW(),
                    created_by = ?
                WHERE period = ?
            `;
            
            const updateParams = [
                dpkData.date,
                dpkData.branch_id,
                dpkData.branch_name,
                dpkData.area,
                dpkData.dpk,
                dpkData.tabungan,
                dpkData.giro,
                dpkData.deposito,
                dpkData.casa,
                dpkData.casa_percentage,
                dpkData.target_dpk,
                dpkData.target_tabungan,
                dpkData.target_giro,
                dpkData.target_deposito,
                dpkData.target_casa,
                dpkData.notes,
                dpkData.created_by,
                period
            ];
            
            console.log('📝 Update query with', updateParams.length, 'params');
            
            [queryResult] = await pool.execute(updateQuery, updateParams);
            message = 'Data updated successfully';
        } else {
            // Insert new data - 18 KOLOM
            const insertQuery = `
                INSERT INTO dpk_data (
                    period, 
                    date,
                    branch_id, 
                    branch_name, 
                    area,
                    dpk, 
                    tabungan, 
                    giro, 
                    deposito, 
                    casa, 
                    casa_percentage,
                    target_dpk, 
                    target_tabungan, 
                    target_giro, 
                    target_deposito, 
                    target_casa, 
                    notes, 
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const insertParams = [
                dpkData.period,
                dpkData.date,
                dpkData.branch_id,
                dpkData.branch_name,
                dpkData.area,
                dpkData.dpk,
                dpkData.tabungan,
                dpkData.giro,
                dpkData.deposito,
                dpkData.casa,
                dpkData.casa_percentage,
                dpkData.target_dpk,
                dpkData.target_tabungan,
                dpkData.target_giro,
                dpkData.target_deposito,
                dpkData.target_casa,
                dpkData.notes,
                dpkData.created_by
            ];
            
            console.log('➕ Insert query with', insertParams.length, 'params');
            console.log('➕ Params:', insertParams);
            
            [queryResult] = await pool.execute(insertQuery, insertParams);
            message = 'Data created successfully';
        }
        
        console.log('✅ Database result:', queryResult);
        
        res.json({
            success: true,
            message,
            data: dpkData
        });
        
    } catch (error) {
        console.error('❌ Save DPK error:', error);
        console.error('🔍 Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });
        
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save DPK data',
            details: error.message,
            sqlError: error.sqlMessage
        });
    }
});

// 7. DELETE DPK DATA
app.delete('/api/dpk/:period', authenticateToken, async (req, res) => {
    try {
        const { period } = req.params;
        
        const [result] = await pool.execute(
            'DELETE FROM dpk_data WHERE branch_id = ? AND period = ?',
            [BRANCH_INFO.id, period]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Data not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Data deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete DPK error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// 8. GET DASHBOARD DATA
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const [dpkData] = await pool.execute(
            `SELECT period, dpk, tabungan, giro, deposito, casa, casa_percentage,
                    target_dpk, target_tabungan, target_giro, target_deposito, target_casa
             FROM dpk_data 
             WHERE branch_id = ?
             ORDER BY period DESC`,
            [BRANCH_INFO.id]
        );
        
        res.json({
            success: true,
            branch: BRANCH_INFO,
            data: dpkData
        });
        
    } catch (error) {
        console.error('Dashboard error:', error);
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

// 404 handler
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
    console.log(`🏢 Branch: ${BRANCH_INFO.name}`);
    console.log(`📍 Area: ${BRANCH_INFO.area}`);
    console.log(`🔐 Single Admin Mode`);
});