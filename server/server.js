const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();

// Konfigurasi CORS untuk development dan production
const corsOptions = {
    origin: function (origin, callback) {
        // Izinkan request tanpa origin (mobile apps, curl, dll)
        if (!origin) return callback(null, true);
        
        // List domain yang diizinkan
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://*.vercel.app',
            /\.vercel\.app$/
        ];
        
        // Cek apakah origin diizinkan
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return origin === allowed || 
                       (allowed.includes('*') && origin.includes(allowed.replace('*.', '')));
            } else if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('🚫 CORS blocked for origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0
});

// Hardcode branch info
const BRANCH_INFO = {
    id: 'KCP-TEMPO-001',
    name: 'KCP Jakarta Tempo Pavillion 2',
    area: 'AREA JAKARTA SAHARJO'
};

// UUID helper
const uuidv4 = () => crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now();

// Generate tokens
const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            name: user.full_name
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
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

// 1. Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏦 Bank Branch Dashboard API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    branch: BRANCH_INFO,
    endpoints: {
      health: '/api/health',
      auth: '/api/login (POST)',
      dpk: '/api/dpk',
      pby: '/api/pby', 
      kol2: '/api/kol2',
      npf: '/api/npf',
      tabungan: '/api/tabungan',
      activity: '/api/activity-logs',
      profile: '/api/profile'
    }
  });
});

// 2. Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS status");
    res.json({ 
      success: true, 
      message: 'Database connected successfully',
      db: rows[0],
      branch: BRANCH_INFO
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: err.message
    });
  }
});

// 3. Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        branch: BRANCH_INFO,
        timestamp: new Date().toISOString()
    });
});

// 4. LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username and password required' 
            });
        }
        
        const userAgent = req.headers['user-agent'] || 'Unknown';
        
        const [users] = await pool.execute(
            `SELECT id, username, password, full_name 
             FROM users 
             WHERE username = ? AND role = 'admin'`,
            [username]
        );
        
        if (users.length === 0) {
            await pool.execute(
                `INSERT INTO activity_logs (id, action, username, user_name, user_agent, device_type, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    uuidv4(),
                    'login',
                    username,
                    'Unknown',
                    userAgent,
                    userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
                    'failed'
                ]
            );
            
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
        
        const user = users[0];
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            await pool.execute(
                `INSERT INTO activity_logs (id, action, username, user_name, user_agent, device_type, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    uuidv4(),
                    'login',
                    username,
                    user.full_name,
                    userAgent,
                    userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
                    'failed'
                ]
            );
            
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
        
        const accessToken = generateAccessToken(user);
        
        await pool.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );
        
        await pool.execute(
            `INSERT INTO activity_logs (id, action, username, user_name, user_agent, device_type, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                uuidv4(),
                'login',
                user.username,
                user.full_name,
                userAgent,
                userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
                'success'
            ]
        );
        
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

// 5. VERIFY TOKEN
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

// 6. GET ALL ACTIVITY LOGS
app.get('/api/activity-logs', authenticateToken, async (req, res) => {
    try {
        const { 
            limit = 50, 
            page = 1, 
            action, 
            username,
            startDate,
            endDate,
            status,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (action) {
            whereClause += ' AND action = ?';
            params.push(action);
        }
        
        if (username) {
            whereClause += ' AND username LIKE ?';
            params.push(`%${username}%`);
        }
        
        if (startDate) {
            whereClause += ' AND DATE(created_at) >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            whereClause += ' AND DATE(created_at) <= ?';
            params.push(endDate);
        }
        
        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        
        const validSortColumns = ['created_at', 'username', 'action', 'status'];
        const validSortOrders = ['asc', 'desc'];
        
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const sortDirection = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
        
        const offset = (page - 1) * limit;
        
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`,
            params
        );
        
        const total = countResult[0].total;
        
        const [logs] = await pool.execute(
            `SELECT * FROM activity_logs 
             ${whereClause}
             ORDER BY ${sortColumn} ${sortDirection}
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );
        
        res.json({
            success: true,
            data: logs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get activity logs' 
        });
    }
});

// 7. GET MY ACTIVITY LOGS
app.get('/api/activity-logs/my', authenticateToken, async (req, res) => {
    try {
        const { limit = 20, page = 1 } = req.query;
        const offset = (page - 1) * limit;
        
        const [logs] = await pool.execute(
            `SELECT * FROM activity_logs 
             WHERE username = ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [req.user.username, parseInt(limit), offset]
        );
        
        res.json({
            success: true,
            data: logs
        });
        
    } catch (error) {
        console.error('Get my activity logs error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get activity logs' 
        });
    }
});

// 8. GET ACTIVITY STATISTICS
app.get('/api/activity-logs/stats', authenticateToken, async (req, res) => {
    try {
        const { period = 'today', groupBy = 'action' } = req.query;
        
        let dateFilter = '';
        
        switch (period) {
            case 'today':
                dateFilter = 'DATE(created_at) = CURDATE()';
                break;
            case 'yesterday':
                dateFilter = 'DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
                break;
            case 'week':
                dateFilter = 'created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateFilter = 'created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                break;
            default:
                dateFilter = '1=1';
        }
        
        let groupByClause = '';
        let selectColumns = '';
        
        switch (groupBy) {
            case 'action':
                groupByClause = 'GROUP BY action';
                selectColumns = 'action,';
                break;
            case 'user':
                groupByClause = 'GROUP BY username, user_name';
                selectColumns = 'username, user_name,';
                break;
            case 'status':
                groupByClause = 'GROUP BY status';
                selectColumns = 'status,';
                break;
            default:
                groupByClause = 'GROUP BY action';
                selectColumns = 'action,';
        }
        
        const [stats] = await pool.execute(
            `SELECT 
                ${selectColumns}
                COUNT(*) as count
             FROM activity_logs
             WHERE ${dateFilter}
             ${groupByClause}
             ORDER BY count DESC`
        );
        
        const [totalResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM activity_logs WHERE ${dateFilter}`
        );
        
        const [usersResult] = await pool.execute(
            `SELECT COUNT(DISTINCT username) as unique_users FROM activity_logs WHERE ${dateFilter}`
        );
        
        res.json({
            success: true,
            stats,
            summary: {
                total: totalResult[0].total,
                unique_users: usersResult[0].unique_users,
                period
            }
        });
        
    } catch (error) {
        console.error('Get activity stats error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get activity statistics' 
        });
    }
});

// 9. LOGOUT
app.post('/api/logout', authenticateToken, async (req, res) => {
    try {
        const userAgent = req.headers['user-agent'] || 'Unknown';
        
        await pool.execute(
            `INSERT INTO activity_logs (id, action, username, user_name, user_agent, device_type, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                uuidv4(),
                'logout',
                req.user.username,
                req.user.name,
                userAgent,
                userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
                'success'
            ]
        );
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// 10. GET ALL DPK DATA
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

// 11. GET SPECIFIC PERIOD DPK DATA
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

// 12. CREATE/UPDATE DPK DATA
app.post('/api/dpk', authenticateToken, async (req, res) => {
    try {
        const {
            period,
            date,
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
            tabungan_haji,
            tabungan_bisnis,
            tabungan_emas,
            notes
        } = req.body;
        
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
        
        // Hitung CASA dan % CASA jika tidak dikirim
        const casaValue = casa ? parseFloat(casa) : (tabunganValue + giroValue);
        const casaPercentageValue = casa_percentage ? parseFloat(casa_percentage) : (dpkValue > 0 ? ((casaValue / dpkValue) * 100) : 0);
        
        // Parse target values
        const targetDpkValue = target_dpk ? parseFloat(target_dpk) : null;
        const targetTabunganValue = target_tabungan ? parseFloat(target_tabungan) : null;
        const targetGiroValue = target_giro ? parseFloat(target_giro) : null;
        const targetDepositoValue = target_deposito ? parseFloat(target_deposito) : null;
        const targetCasaValue = target_casa ? parseFloat(target_casa) : null;
        
        // Parse tabungan khusus fields
        const tabunganHajiValue = tabungan_haji ? parseFloat(tabungan_haji) : null;
        const tabunganBisnisValue = tabungan_bisnis ? parseFloat(tabungan_bisnis) : null;
        const tabunganEmasValue = tabungan_emas ? parseFloat(tabungan_emas) : null;
        
        // Format date
        let formattedDate = null;
        if (date) {
            try {
                if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    formattedDate = date;
                } else if (date.match(/^\d{2}-\w{3}-\d{4}$/)) {
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
                console.log(`Error parsing date ${date}:`, err.message);
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
            tabungan_haji: tabunganHajiValue,
            tabungan_bisnis: tabunganBisnisValue,
            tabungan_emas: tabunganEmasValue,
            notes: notes || null,
            created_by: req.user.username || 'admin'
        };
        
        // Check if data already exists
        const [existing] = await pool.execute(
            'SELECT id FROM dpk_data WHERE period = ?',
            [period]
        );
        
        let message;
        
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
                    tabungan_haji = ?,
                    tabungan_bisnis = ?,
                    tabungan_emas = ?,
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
                dpkData.tabungan_haji,
                dpkData.tabungan_bisnis,
                dpkData.tabungan_emas,
                dpkData.notes,
                dpkData.created_by,
                period
            ];
            
            await pool.execute(updateQuery, updateParams);
            message = 'Data updated successfully';
            
            await logDataActivity('update_dpk', req);
            
        } else {
            // INSERT NEW DATA
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
                    tabungan_haji,
                    tabungan_bisnis,
                    tabungan_emas,
                    notes, 
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                dpkData.tabungan_haji,
                dpkData.tabungan_bisnis,
                dpkData.tabungan_emas,
                dpkData.notes,
                dpkData.created_by
            ];
            
            await pool.execute(insertQuery, insertParams);
            message = 'Data created successfully';
            
            await logDataActivity('create_dpk', req);
        }
        
        res.json({
            success: true,
            message,
            data: dpkData
        });
        
    } catch (error) {
        console.error('Save DPK error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save DPK data',
            details: error.message,
            sqlError: error.sqlMessage
        });
    }
});

// 13. DELETE DPK DATA
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
        
        await logDataActivity('delete_dpk', req);
        
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

// 14. GET DASHBOARD DATA
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const [dpkData] = await pool.execute(
            `SELECT period, dpk, tabungan, giro, deposito, casa, casa_percentage,
                    target_dpk, target_tabungan, target_giro, target_deposito, target_casa,
                    tabungan_haji, tabungan_bisnis, tabungan_emas
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

// 15. GET ALL PBY DATA
app.get('/api/pby', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM pby_data 
       WHERE branch_id = ?
       ORDER BY 
         CASE 
           WHEN period LIKE '%Dec%' THEN 1
           WHEN period LIKE '%Jan%' THEN 2
           WHEN period LIKE '%Feb%' THEN 3
           WHEN period LIKE '%Mar%' THEN 4
           WHEN period LIKE '%Apr%' THEN 5
           WHEN period LIKE '%May%' THEN 6
           WHEN period LIKE '%Jun%' THEN 7
           WHEN period LIKE '%Jul%' THEN 8
           WHEN period LIKE '%Aug%' THEN 9
           WHEN period LIKE '%Sep%' THEN 10
           WHEN period LIKE '%Oct%' THEN 11
           WHEN period LIKE '%Nov%' THEN 12
           ELSE 13
         END DESC`,
      [BRANCH_INFO.id]
    );
    
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('Get PBY data error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get PBY data' 
    });
  }
});

// 16. GET SPECIFIC PERIOD PBY DATA
app.get('/api/pby/:period', authenticateToken, async (req, res) => {
  try {
    const { period } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT * FROM pby_data 
       WHERE branch_id = ? AND period = ?`,
      [BRANCH_INFO.id, period]
    );
    
    if (rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No PBY data found for this period'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('Get PBY period error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// 17. CREATE/UPDATE PBY DATA
app.post('/api/pby', authenticateToken, async (req, res) => {
  try {
    const {
      period,
      date,
      griya,
      griya_cair,
      griya_runoff,
      oto,
      oto_cair,
      oto_runoff,
      mitraguna,
      mitraguna_cair,
      mitraguna_runoff,
      pensiun,
      pensiun_cair,
      pensiun_runoff,
      cicil_emas,
      cicil_emas_cair,
      cicil_emas_runoff,
      cfg,
      pwg,
      pby,
      target_griya,
      target_oto,
      target_mitraguna,
      target_pensiun,
      target_cicil_emas,
      target_cfg,
      target_pwg,
      target_pby,
      notes
    } = req.body;
    
    const parseFloatOrNull = (val) => {
      if (val === undefined || val === null || val === '' || val === 'null') return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };
    
    const parseFloatRequired = (val, fieldName) => {
      if (val === undefined || val === null || val === '' || val === 'null') {
        throw new Error(`${fieldName} wajib diisi`);
      }
      const parsed = parseFloat(val);
      if (isNaN(parsed)) {
        throw new Error(`${fieldName} harus berupa angka`);
      }
      return parsed;
    };
    
    const griyaValue = parseFloatRequired(griya, 'griya');
    const otoValue = parseFloatRequired(oto, 'oto');
    const mitragunaValue = parseFloatRequired(mitraguna, 'mitraguna');
    const pensiunValue = parseFloatRequired(pensiun, 'pensiun');
    const cicilEmasValue = parseFloatRequired(cicil_emas, 'cicil_emas');
    
    const griyaCairValue = parseFloatOrNull(griya_cair) || 0;
    const griyaRunoffValue = parseFloatOrNull(griya_runoff) || 0;
    const otoCairValue = parseFloatOrNull(oto_cair) || 0;
    const otoRunoffValue = parseFloatOrNull(oto_runoff) || 0;
    const mitragunaCairValue = parseFloatOrNull(mitraguna_cair) || 0;
    const mitragunaRunoffValue = parseFloatOrNull(mitraguna_runoff) || 0;
    const pensiunCairValue = parseFloatOrNull(pensiun_cair) || 0;
    const pensiunRunoffValue = parseFloatOrNull(pensiun_runoff) || 0;
    const cicilEmasCairValue = parseFloatOrNull(cicil_emas_cair) || 0;
    const cicilEmasRunoffValue = parseFloatOrNull(cicil_emas_runoff) || 0;
    
    const cfgValue = parseFloatRequired(cfg !== undefined ? cfg : (griyaValue + otoValue + mitragunaValue + pensiunValue), 'cfg');
    const pwgValue = parseFloatRequired(pwg !== undefined ? pwg : cicilEmasValue, 'pwg');
    const pbyValue = parseFloatRequired(pby !== undefined ? pby : (cfgValue + pwgValue), 'pby');
    
    const cfgCairValue = griyaCairValue + otoCairValue + mitragunaCairValue + pensiunCairValue;
    const cfgRunoffValue = griyaRunoffValue + otoRunoffValue + mitragunaRunoffValue + pensiunRunoffValue;
    const pwgCairValue = cicilEmasCairValue;
    const pwgRunoffValue = cicilEmasRunoffValue;
    const pbyCairValue = cfgCairValue + pwgCairValue;
    const pbyRunoffValue = cfgRunoffValue + pwgRunoffValue;
    
    const targetGriyaValue = parseFloatOrNull(target_griya);
    const targetOtoValue = parseFloatOrNull(target_oto);
    const targetMitragunaValue = parseFloatOrNull(target_mitraguna);
    const targetPensiunValue = parseFloatOrNull(target_pensiun);
    const targetCicilEmasValue = parseFloatOrNull(target_cicil_emas);
    const targetCFGValue = parseFloatOrNull(target_cfg);
    const targetPWGValue = parseFloatOrNull(target_pwg);
    const targetPBYValue = parseFloatOrNull(target_pby);
    
    let formattedDate = null;
    if (date && date !== 'null') {
      try {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDate = date;
        } else if (date.match(/^\d{2}-\w{3}-\d{4}$/)) {
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
        console.log(`Error parsing date:`, err.message);
      }
    }
    
    const [existing] = await pool.execute(
      'SELECT id FROM pby_data WHERE period = ? AND branch_id = ?',
      [period, BRANCH_INFO.id]
    );
    
    let message;
    
    if (existing.length > 0) {
      const updateQuery = `
        UPDATE pby_data SET 
          date = ?,
          griya = ?, griya_cair = ?, griya_runoff = ?,
          oto = ?, oto_cair = ?, oto_runoff = ?,
          mitraguna = ?, mitraguna_cair = ?, mitraguna_runoff = ?,
          pensiun = ?, pensiun_cair = ?, pensiun_runoff = ?,
          cicil_emas = ?, cicil_emas_cair = ?, cicil_emas_runoff = ?,
          cfg = ?, pwg = ?, pby = ?,
          cfg_cair = ?, cfg_runoff = ?,
          pwg_cair = ?, pwg_runoff = ?,
          pby_cair = ?, pby_runoff = ?,
          target_cfg = ?, target_pwg = ?, target_pby = ?,
          target_griya = ?, target_oto = ?, target_mitraguna = ?,
          target_pensiun = ?, target_cicil_emas = ?,
          notes = ?, updated_at = NOW(), created_by = ?
        WHERE period = ? AND branch_id = ?
      `;
      
      const updateParams = [
        formattedDate,
        griyaValue, griyaCairValue, griyaRunoffValue,
        otoValue, otoCairValue, otoRunoffValue,
        mitragunaValue, mitragunaCairValue, mitragunaRunoffValue,
        pensiunValue, pensiunCairValue, pensiunRunoffValue,
        cicilEmasValue, cicilEmasCairValue, cicilEmasRunoffValue,
        cfgValue, pwgValue, pbyValue,
        cfgCairValue, cfgRunoffValue,
        pwgCairValue, pwgRunoffValue,
        pbyCairValue, pbyRunoffValue,
        targetCFGValue, targetPWGValue, targetPBYValue,
        targetGriyaValue, targetOtoValue, targetMitragunaValue,
        targetPensiunValue, targetCicilEmasValue,
        notes && notes !== 'null' ? notes : null,
        req.user.username || 'admin',
        period, BRANCH_INFO.id
      ];
      
      await pool.execute(updateQuery, updateParams);
      message = 'Data PBY berhasil diupdate';
      
      await logDataActivity('update_pby', req);
      
    } else {
      const insertQuery = `
        INSERT INTO pby_data (
          period, date,
          branch_id, branch_name, area,
          griya, griya_cair, griya_runoff,
          oto, oto_cair, oto_runoff,
          mitraguna, mitraguna_cair, mitraguna_runoff,
          pensiun, pensiun_cair, pensiun_runoff,
          cicil_emas, cicil_emas_cair, cicil_emas_runoff,
          cfg, pwg, pby,
          cfg_cair, cfg_runoff,
          pwg_cair, pwg_runoff,
          pby_cair, pby_runoff,
          target_cfg, target_pwg, target_pby,
          target_griya, target_oto, target_mitraguna,
          target_pensiun, target_cicil_emas,
          notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertParams = [
        period, formattedDate,
        BRANCH_INFO.id, BRANCH_INFO.name, BRANCH_INFO.area,
        griyaValue, griyaCairValue, griyaRunoffValue,
        otoValue, otoCairValue, otoRunoffValue,
        mitragunaValue, mitragunaCairValue, mitragunaRunoffValue,
        pensiunValue, pensiunCairValue, pensiunRunoffValue,
        cicilEmasValue, cicilEmasCairValue, cicilEmasRunoffValue,
        cfgValue, pwgValue, pbyValue,
        cfgCairValue, cfgRunoffValue,
        pwgCairValue, pwgRunoffValue,
        pbyCairValue, pbyRunoffValue,
        targetCFGValue, targetPWGValue, targetPBYValue,
        targetGriyaValue, targetOtoValue, targetMitragunaValue,
        targetPensiunValue, targetCicilEmasValue,
        notes && notes !== 'null' ? notes : null,
        req.user.username || 'admin'
      ];
      
      await pool.execute(insertQuery, insertParams);
      message = 'Data PBY berhasil disimpan';
      
      await logDataActivity('create_pby', req);
    }
    
    const [savedData] = await pool.execute(
      'SELECT * FROM pby_data WHERE period = ? AND branch_id = ?',
      [period, BRANCH_INFO.id]
    );
    
    res.json({
      success: true,
      message,
      data: savedData[0] || null
    });
    
  } catch (error) {
    console.error('Save PBY error:', error.message);
    
    let errorMessage = 'Gagal menyimpan data PBY';
    let statusCode = 500;
    
    if (error.message.includes('wajib diisi') || error.message.includes('harus berupa angka')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.code === 'ER_DUP_ENTRY') {
      statusCode = 409;
      errorMessage = 'Data untuk periode ini sudah ada';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

// 18. DELETE PBY DATA
app.delete('/api/pby/:period', authenticateToken, async (req, res) => {
  try {
    const { period } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM pby_data WHERE branch_id = ? AND period = ?',
      [BRANCH_INFO.id, period]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'PBH data not found' 
      });
    }
    
    await logDataActivity('delete_pby', req);
    
    res.json({
      success: true,
      message: 'Data PBY deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete PBY error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// 19. GET PROFILE
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, full_name, role, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    const user = users[0];
    
    res.json({
      success: true,
      user: {
        ...user,
        branch: BRANCH_INFO
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// 20. UPDATE USER PROFILE
app.patch('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, username } = req.body;
    
    if (!full_name || !username) {
      return res.status(400).json({
        success: false,
        error: 'full_name dan username wajib diisi'
      });
    }
    
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, req.user.id]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Username sudah digunakan'
      });
    }
    
    await pool.execute(
      `UPDATE users SET 
        full_name = ?, 
        username = ?, 
        updated_at = NOW() 
       WHERE id = ?`,
      [full_name, username, req.user.id]
    );
    
    const [users] = await pool.execute(
      `SELECT 
        id, 
        employee_id, 
        username, 
        full_name, 
        email, 
        branch_code, 
        position, 
        role, 
        is_active, 
        last_login, 
        created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const updatedUser = users[0];
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        branch: BRANCH_INFO
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// 21. CHANGE PASSWORD
app.patch('/api/users/password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'current_password dan new_password wajib diisi'
      });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password baru minimal 6 karakter'
      });
    }
    
    const [users] = await pool.execute(
      'SELECT id, password FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = users[0];
    
    const validPassword = await bcrypt.compare(current_password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Password saat ini salah'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, req.user.id]
    );
    
    const userAgent = req.headers['user-agent'] || 'Unknown';
    await pool.execute(
      `INSERT INTO activity_logs (id, action, username, user_name, user_agent, device_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        'change_password',
        req.user.username,
        req.user.name,
        userAgent,
        userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
        'success'
      ]
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// 22. GET USER DETAILS
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT 
        id, 
        employee_id, 
        username, 
        full_name, 
        email, 
        branch_code, 
        position, 
        role, 
        is_active, 
        last_login, 
        created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = users[0];
    
    res.json({
      success: true,
      user: {
        ...user,
        branch: BRANCH_INFO
      }
    });
    
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user details'
    });
  }
});

// 23. GET MY BRANCH INFO
app.get('/api/my-branch', authenticateToken, (req, res) => {
  res.json({
    success: true,
    branch: BRANCH_INFO
  });
});

// 24. GET BRANCH DATA
app.get('/api/branch-data', authenticateToken, async (req, res) => {
  try {
    const [dpkData] = await pool.execute(
      'SELECT period, dpk, tabungan, giro, deposito, casa FROM dpk_data WHERE branch_id = ? ORDER BY period DESC LIMIT 12',
      [BRANCH_INFO.id]
    );
    
    const [pbyData] = await pool.execute(
      'SELECT period, pby, cfg, pwg FROM pby_data WHERE branch_id = ? ORDER BY period DESC LIMIT 12',
      [BRANCH_INFO.id]
    );
    
    res.json({
      success: true,
      branch: BRANCH_INFO,
      dpk_data: dpkData,
      pby_data: pbyData
    });
    
  } catch (error) {
    console.error('Get branch data error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// 25. GET ALL KOL2 DATA
app.get('/api/kol2', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM kol2_data 
       ORDER BY 
         CASE 
           WHEN period LIKE '%Dec%' THEN 1
           WHEN period LIKE '%Jan%' THEN 2
           WHEN period LIKE '%Feb%' THEN 3
           WHEN period LIKE '%Mar%' THEN 4
           WHEN period LIKE '%Apr%' THEN 5
           WHEN period LIKE '%May%' THEN 6
           WHEN period LIKE '%Jun%' THEN 7
           WHEN period LIKE '%Jul%' THEN 8
           WHEN period LIKE '%Aug%' THEN 9
           WHEN period LIKE '%Sep%' THEN 10
           WHEN period LIKE '%Oct%' THEN 11
           WHEN period LIKE '%Nov%' THEN 12
           ELSE 13
         END DESC`
    );
    
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('Get KOL2 data error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get KOL2 data' 
    });
  }
});

// 26. GET SPECIFIC PERIOD KOL2 DATA
app.get('/api/kol2/:period', authenticateToken, async (req, res) => {
  try {
    const { period } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT * FROM kol2_data WHERE period = ?`,
      [period]
    );
    
    if (rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No KOL2 data found for this period'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('Get KOL2 period error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// 27. CREATE/UPDATE KOL2 DATA
app.post('/api/kol2', authenticateToken, async (req, res) => {
  try {
    const {
      period,
      date,
      griya,
      oto,
      mitraguna,
      pensiun,
      cicil_emas,
      cfg,
      pwg,
      kol2,
      notes
    } = req.body;
    
    const parseFloatOrZero = (val) => {
      if (val === undefined || val === null || val === '' || val === 'null') return 0;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    const griyaValue = parseFloatOrZero(griya);
    const otoValue = parseFloatOrZero(oto);
    const mitragunaValue = parseFloatOrZero(mitraguna);
    const pensiunValue = parseFloatOrZero(pensiun);
    const cicilEmasValue = parseFloatOrZero(cicil_emas);
    
    const cfgValue = parseFloatOrZero(cfg !== undefined ? cfg : (griyaValue + otoValue + mitragunaValue + pensiunValue));
    const pwgValue = parseFloatOrZero(pwg !== undefined ? pwg : cicilEmasValue);
    const kol2Value = parseFloatOrZero(kol2 !== undefined ? kol2 : (cfgValue + pwgValue));
    
    let formattedDate = null;
    if (date && date !== 'null') {
      try {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDate = date;
        } else if (date.match(/^\d{2}-\w{3}-\d{4}$/)) {
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
        console.log(`Error parsing date:`, err.message);
      }
    }
    
    const [existing] = await pool.execute(
      'SELECT id FROM kol2_data WHERE period = ?',
      [period]
    );
    
    let message;
    let query;
    
    if (existing.length > 0) {
      query = `
        UPDATE kol2_data SET 
          date = ?,
          griya = ?, 
          oto = ?, 
          mitraguna = ?, 
          pensiun = ?, 
          cicil_emas = ?,
          cfg = ?, 
          pwg = ?, 
          kol2 = ?,
          notes = ?, 
          updated_at = CURRENT_TIMESTAMP,
          created_by = ?
        WHERE period = ?
      `;
      
      const params = [
        formattedDate,
        griyaValue, 
        otoValue, 
        mitragunaValue, 
        pensiunValue, 
        cicilEmasValue,
        cfgValue, 
        pwgValue, 
        kol2Value,
        notes && notes !== 'null' ? notes : null,
        req.user.username || 'admin',
        period
      ];
      
      await pool.execute(query, params);
      message = 'Data KOL2 berhasil diupdate';
      
      await logDataActivity('update_kol2', req);
      
    } else {
      query = `
        INSERT INTO kol2_data (
          period, 
          date,
          branch_id, 
          branch_name, 
          area,
          griya, 
          oto, 
          mitraguna, 
          pensiun, 
          cicil_emas,
          cfg, 
          pwg, 
          kol2,
          notes, 
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        period, 
        formattedDate,
        'KCP-TEMPO-001', 
        'KCP Jakarta Tempo Pavillion 2', 
        'AREA JAKARTA SAHARJO',
        griyaValue, 
        otoValue, 
        mitragunaValue, 
        pensiunValue, 
        cicilEmasValue,
        cfgValue, 
        pwgValue, 
        kol2Value,
        notes && notes !== 'null' ? notes : null,
        req.user.username || 'admin'
      ];
      
      await pool.execute(query, params);
      message = 'Data KOL2 berhasil disimpan';
      
      await logDataActivity('create_kol2', req);
    }
    
    const [savedData] = await pool.execute(
      'SELECT * FROM kol2_data WHERE period = ?',
      [period]
    );
    
    res.json({
      success: true,
      message,
      data: savedData[0] || null
    });
    
  } catch (error) {
    console.error('Save KOL2 error:', error.message);
    
    let errorMessage = 'Gagal menyimpan data KOL2';
    let statusCode = 500;
    
    if (error.code === 'ER_DUP_ENTRY') {
      statusCode = 409;
      errorMessage = 'Data untuk periode ini sudah ada';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

// 28. DELETE KOL2 DATA
app.delete('/api/kol2/:period', authenticateToken, async (req, res) => {
  try {
    const { period } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM kol2_data WHERE period = ?',
      [period]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'KOL2 data not found' 
      });
    }
    
    await logDataActivity('delete_kol2', req);
    
    res.json({
      success: true,
      message: 'Data KOL2 deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete KOL2 error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// 29. GET ALL NPF DATA
app.get('/api/npf', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM npf_data 
       ORDER BY 
         CASE 
           WHEN period LIKE '%Dec%' THEN 1
           WHEN period LIKE '%Jan%' THEN 2
           WHEN period LIKE '%Feb%' THEN 3
           WHEN period LIKE '%Mar%' THEN 4
           WHEN period LIKE '%Apr%' THEN 5
           WHEN period LIKE '%May%' THEN 6
           WHEN period LIKE '%Jun%' THEN 7
           WHEN period LIKE '%Jul%' THEN 8
           WHEN period LIKE '%Aug%' THEN 9
           WHEN period LIKE '%Sep%' THEN 10
           WHEN period LIKE '%Oct%' THEN 11
           WHEN period LIKE '%Nov%' THEN 12
           ELSE 13
         END DESC`
    );
    
    res.json({
      success: true,
      data: rows
    });
    
  } catch (error) {
    console.error('Get NPF data error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get NPF data' 
    });
  }
});

// 30. GET SPECIFIC PERIOD NPF DATA
app.get('/api/npf/:period', authenticateToken, async (req, res) => {
  try {
    const { period } = req.params;
    
    const [rows] = await pool.execute(
      `SELECT * FROM npf_data WHERE period = ?`,
      [period]
    );
    
    if (rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No NPF data found for this period'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('Get NPF period error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// 31. CREATE/UPDATE NPF DATA
app.post('/api/npf', authenticateToken, async (req, res) => {
  try {
    const {
      period,
      date,
      griya,
      oto,
      mitraguna,
      pensiun,
      cicil_emas,
      cfg,
      pwg,
      npf,
      notes
    } = req.body;
    
    const parseFloatOrZero = (val) => {
      if (val === undefined || val === null || val === '' || val === 'null') return 0;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    const griyaValue = parseFloatOrZero(griya);
    const otoValue = parseFloatOrZero(oto);
    const mitragunaValue = parseFloatOrZero(mitraguna);
    const pensiunValue = parseFloatOrZero(pensiun);
    const cicilEmasValue = parseFloatOrZero(cicil_emas);
    
    const cfgValue = parseFloatOrZero(cfg !== undefined ? cfg : (griyaValue + otoValue + mitragunaValue + pensiunValue));
    const pwgValue = parseFloatOrZero(pwg !== undefined ? pwg : cicilEmasValue);
    const npfValue = parseFloatOrZero(npf !== undefined ? npf : (cfgValue + pwgValue));
    
    let formattedDate = null;
    if (date && date !== 'null') {
      try {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDate = date;
        } else if (date.match(/^\d{2}-\w{3}-\d{4}$/)) {
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
        console.log(`Error parsing date:`, err.message);
      }
    }
    
    const [existing] = await pool.execute(
      'SELECT id FROM npf_data WHERE period = ?',
      [period]
    );
    
    let message;
    let query;
    
    if (existing.length > 0) {
      query = `
        UPDATE npf_data SET 
          date = ?,
          griya = ?, 
          oto = ?, 
          mitraguna = ?, 
          pensiun = ?, 
          cicil_emas = ?,
          cfg = ?, 
          pwg = ?, 
          npf = ?,
          notes = ?, 
          updated_at = CURRENT_TIMESTAMP,
          created_by = ?
        WHERE period = ?
      `;
      
      const params = [
        formattedDate,
        griyaValue, 
        otoValue, 
        mitragunaValue, 
        pensiunValue, 
        cicilEmasValue,
        cfgValue, 
        pwgValue, 
        npfValue,
        notes && notes !== 'null' ? notes : null,
        req.user.username || 'admin',
        period
      ];
      
      await pool.execute(query, params);
      message = 'Data NPF berhasil diupdate';
      
      await logDataActivity('update_npf', req);
      
    } else {
      query = `
        INSERT INTO npf_data (
          period, 
          date,
          branch_id, 
          branch_name, 
          area,
          griya, 
          oto, 
          mitraguna, 
          pensiun, 
          cicil_emas,
          cfg, 
          pwg, 
          npf,
          notes, 
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        period, 
        formattedDate,
        'KCP-TEMPO-001', 
        'KCP Jakarta Tempo Pavillion 2', 
        'AREA JAKARTA SAHARJO',
        griyaValue, 
        otoValue, 
        mitragunaValue, 
        pensiunValue, 
        cicilEmasValue,
        cfgValue, 
        pwgValue, 
        npfValue,
        notes && notes !== 'null' ? notes : null,
        req.user.username || 'admin'
      ];
      
      await pool.execute(query, params);
      message = 'Data NPF berhasil disimpan';
      
      await logDataActivity('create_npf', req);
    }
    
    const [savedData] = await pool.execute(
      'SELECT * FROM npf_data WHERE period = ?',
      [period]
    );
    
    res.json({
      success: true,
      message,
      data: savedData[0] || null
    });
    
  } catch (error) {
    console.error('Save NPF error:', error.message);
    
    let errorMessage = 'Gagal menyimpan data NPF';
    let statusCode = 500;
    
    if (error.code === 'ER_DUP_ENTRY') {
      statusCode = 409;
      errorMessage = 'Data untuk periode ini sudah ada';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
});

// 32. DELETE NPF DATA
app.delete('/api/npf/:period', authenticateToken, async (req, res) => {
  try {
    const { period } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM npf_data WHERE period = ?',
      [period]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'NPF data not found' 
      });
    }
    
    await logDataActivity('delete_npf', req);
    
    res.json({
      success: true,
      message: 'Data NPF deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete NPF error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// 33. GET ALL TABUNGAN DATA
app.get('/api/tabungan', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM tabungan_data 
             WHERE branch_id = ?
             ORDER BY 
               CASE 
                 WHEN period LIKE '%Dec%' THEN 1
                 WHEN period LIKE '%Jan%' THEN 2
                 WHEN period LIKE '%Feb%' THEN 3
                 WHEN period LIKE '%Mar%' THEN 4
                 WHEN period LIKE '%Apr%' THEN 5
                 WHEN period LIKE '%May%' THEN 6
                 WHEN period LIKE '%Jun%' THEN 7
                 WHEN period LIKE '%Jul%' THEN 8
                 WHEN period LIKE '%Aug%' THEN 9
                 WHEN period LIKE '%Sep%' THEN 10
                 WHEN period LIKE '%Oct%' THEN 11
                 WHEN period LIKE '%Nov%' THEN 12
                 ELSE 13
               END DESC`,
            [BRANCH_INFO.id]
        );
        
        res.json({
            success: true,
            data: rows
        });
        
    } catch (error) {
        console.error('Get Tabungan data error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get Tabungan data' 
        });
    }
});

// 34. GET SPECIFIC PERIOD TABUNGAN DATA
app.get('/api/tabungan/:period', authenticateToken, async (req, res) => {
    try {
        const { period } = req.params;
        
        const [rows] = await pool.execute(
            `SELECT * FROM tabungan_data 
             WHERE branch_id = ? AND period = ?`,
            [BRANCH_INFO.id, period]
        );
        
        if (rows.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: 'No Tabungan data found for this period'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
        
    } catch (error) {
        console.error('Get Tabungan period error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// 35. CREATE/UPDATE TABUNGAN DATA
app.post('/api/tabungan', authenticateToken, async (req, res) => {
    try {
        const {
            period,
            date,
            tabungan_haji,
            tabungan_bisnis,
            tabungan_emas,
            notes
        } = req.body;
        
        // Validasi required fields
        const requiredFields = ['period', 'tabungan_haji', 'tabungan_bisnis', 'tabungan_emas'];
        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                return res.status(400).json({ 
                    success: false, 
                    error: `${field} wajib diisi` 
                });
            }
        }
        
        const parseFloatOrZero = (val, fieldName) => {
            if (val === undefined || val === null || val === '' || val === 'null') {
                return 0;
            }
            const parsed = parseFloat(val);
            if (isNaN(parsed)) {
                throw new Error(`${fieldName} harus berupa angka`);
            }
            return parsed;
        };
        
        const tabunganHajiValue = parseFloatOrZero(tabungan_haji, 'Tabungan Haji');
        const tabunganBisnisValue = parseFloatOrZero(tabungan_bisnis, 'Tabungan Bisnis');
        const tabunganEmasValue = parseFloatOrZero(tabungan_emas, 'Tabungan Emas');
        
        let formattedDate = null;
        if (date && date !== 'null') {
            try {
                if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    formattedDate = date;
                } else if (date.match(/^\d{2}-\w{3}-\d{4}$/)) {
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
                console.log(`Error parsing date:`, err.message);
            }
        }
        
        const tabunganData = {
            period: period,
            date: formattedDate,
            branch_id: BRANCH_INFO.id,
            branch_name: BRANCH_INFO.name,
            area: BRANCH_INFO.area,
            tabungan_haji: tabunganHajiValue,
            tabungan_bisnis: tabunganBisnisValue,
            tabungan_emas: tabunganEmasValue,
            notes: notes || null,
            created_by: req.user.username || 'admin'
        };
        
        const [existing] = await pool.execute(
            'SELECT id FROM tabungan_data WHERE period = ? AND branch_id = ?',
            [period, BRANCH_INFO.id]
        );
        
        let message;
        
        if (existing.length > 0) {
            const updateQuery = `
                UPDATE tabungan_data SET 
                    date = ?,
                    tabungan_haji = ?, 
                    tabungan_bisnis = ?, 
                    tabungan_emas = ?,
                    notes = ?,
                    updated_at = NOW(),
                    created_by = ?
                WHERE period = ? AND branch_id = ?
            `;
            
            const updateParams = [
                tabunganData.date,
                tabunganData.tabungan_haji,
                tabunganData.tabungan_bisnis,
                tabunganData.tabungan_emas,
                tabunganData.notes,
                tabunganData.created_by,
                period,
                BRANCH_INFO.id
            ];
            
            await pool.execute(updateQuery, updateParams);
            message = 'Data Tabungan berhasil diupdate';
            
            await logDataActivity('update_tabungan', req);
            
        } else {
            const insertQuery = `
                INSERT INTO tabungan_data (
                    period, 
                    date,
                    branch_id, 
                    branch_name, 
                    area,
                    tabungan_haji, 
                    tabungan_bisnis, 
                    tabungan_emas, 
                    notes, 
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const insertParams = [
                tabunganData.period,
                tabunganData.date,
                tabunganData.branch_id,
                tabunganData.branch_name,
                tabunganData.area,
                tabunganData.tabungan_haji,
                tabunganData.tabungan_bisnis,
                tabunganData.tabungan_emas,
                tabunganData.notes,
                tabunganData.created_by
            ];
            
            await pool.execute(insertQuery, insertParams);
            message = 'Data Tabungan berhasil disimpan';
            
            await logDataActivity('create_tabungan', req);
        }
        
        const [savedData] = await pool.execute(
            'SELECT * FROM tabungan_data WHERE period = ? AND branch_id = ?',
            [period, BRANCH_INFO.id]
        );
        
        res.json({
            success: true,
            message,
            data: savedData[0] || null
        });
        
    } catch (error) {
        console.error('Save Tabungan error:', error);
        
        let errorMessage = 'Gagal menyimpan data Tabungan';
        let statusCode = 500;
        
        if (error.message.includes('harus berupa angka')) {
            statusCode = 400;
            errorMessage = error.message;
        } else if (error.code === 'ER_DUP_ENTRY') {
            statusCode = 409;
            errorMessage = 'Data untuk periode ini sudah ada';
        } else if (error.sqlMessage) {
            errorMessage = `Database error: ${error.sqlMessage}`;
        }
        
        res.status(statusCode).json({ 
            success: false, 
            error: errorMessage,
            details: error.message,
            sqlError: error.sqlMessage
        });
    }
});

// 36. DELETE TABUNGAN DATA
app.delete('/api/tabungan/:period', authenticateToken, async (req, res) => {
    try {
        const { period } = req.params;
        
        const [result] = await pool.execute(
            'DELETE FROM tabungan_data WHERE branch_id = ? AND period = ?',
            [BRANCH_INFO.id, period]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Data not found' 
            });
        }
        
        await logDataActivity('delete_tabungan', req);
        
        res.json({
            success: true,
            message: 'Data Tabungan berhasil dihapus'
        });
        
    } catch (error) {
        console.error('Delete Tabungan error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

// 37. CREATE ACTIVITY LOG (POST)
app.post('/api/activity-logs', authenticateToken, async (req, res) => {
    try {
        const {
            action,
            username,
            user_name,
            user_agent,
            device_type,
            status = 'success',
            details
        } = req.body;
        
        const userAgent = req.headers['user-agent'] || user_agent || 'Unknown';
        
        await pool.execute(
            `INSERT INTO activity_logs (id, action, username, user_name, user_agent, device_type, status, details)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                uuidv4(),
                action,
                username || req.user.username,
                user_name || req.user.name,
                userAgent,
                device_type || (userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'),
                status,
                details ? JSON.stringify(details) : null
            ]
        );
        
        res.json({
            success: true,
            message: 'Activity logged successfully'
        });
        
    } catch (error) {
        console.error('Create activity log error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create activity log' 
        });
    }
});

// ============ HELPER FUNCTIONS ============

// Helper function untuk log activity
async function logDataActivity(action, req) {
    try {
        const userAgent = req.headers['user-agent'] || 'Unknown';
        
        const actionDescriptions = {
            'create_dpk': 'Create DPK Data',
            'update_dpk': 'Update DPK Data',
            'delete_dpk': 'Delete DPK Data',
            'create_pby': 'Create PBY Data',
            'update_pby': 'Update PBY Data',
            'delete_pby': 'Delete PBY Data',
            'create_kol2': 'Create KOL2 Data',
            'update_kol2': 'Update KOL2 Data',
            'delete_kol2': 'Delete KOL2 Data',
            'create_npf': 'Create NPF Data',
            'update_npf': 'Update NPF Data',
            'delete_npf': 'Delete NPF Data',
            'create_tabungan': 'Create Tabungan Data',
            'update_tabungan': 'Update Tabungan Data',
            'delete_tabungan': 'Delete Tabungan Data'
        };
        
        await pool.execute(
            `INSERT INTO activity_logs (id, action, username, user_name, user_agent, device_type, status, details)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                uuidv4(),
                action,
                req.user.username,
                req.user.name,
                userAgent,
                userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
                'success',
                JSON.stringify({
                    description: actionDescriptions[action] || action,
                    timestamp: new Date().toISOString()
                })
            ]
        );
    } catch (error) {
        console.error('Error logging data activity:', error);
    }
}

// ============ VERCEL COMPATIBILITY ============

// Ekspor app untuk Vercel
module.exports = app;

// Jika tidak di Vercel, start server sendiri
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log(`🏢 Branch: ${BRANCH_INFO.name}`);
        console.log(`📍 Area: ${BRANCH_INFO.area}`);
        console.log(`🔐 Single Admin Mode`);
        console.log(`📊 Activity Logging: ENABLED`);
    });
}