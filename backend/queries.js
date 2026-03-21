const pool = require('./db');

// ==================== TABELA USERS ====================

// Criar usuário
const createUser = async (name, email, passwordHash, role = 'promotor') => {
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, passwordHash, role]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Erro ao criar usuário:', err.message);
    throw err;
  }
};

// Buscar usuário por email
const getUserByEmail = async (email) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Erro ao buscar usuário:', err.message);
    throw err;
  }
};

// Buscar usuário por ID
const getUserById = async (id) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Erro ao buscar usuário:', err.message);
    throw err;
  }
};

// ==================== TABELA PHOTOS ====================

// Salvar foto com referência do usuário
const savePhoto = async (url, publicId, userId = null) => {
  try {
    const result = await pool.query(
      'INSERT INTO photos (url, public_id, user_id) VALUES ($1, $2, $3) RETURNING *',
      [url, publicId, userId]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Erro ao salvar foto:', err.message);
    throw err;
  }
};

// Buscar fotos de um usuário
const getPhotosByUserId = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id, p.url, p.public_id, p.user_id, p.created_at,
        u.name as user_name, u.email as user_email
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1 
      ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (err) {
    console.error('Erro ao buscar fotos:', err.message);
    throw err;
  }
};

// Buscar todas as photos
const getAllPhotos = async () => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id, p.url, p.public_id, p.user_id, p.created_at,
        u.name as user_name, u.email as user_email
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC`
    );
    return result.rows;
  } catch (err) {
    console.error('Erro ao buscar todas as fotos:', err.message);
    throw err;
  }
};

// Buscar todas as photos com paginação
const getAllPhotosPaginated = async (offset, limit) => {
  try {
    // Buscar total
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM photos');
    const total = parseInt(totalResult.rows[0].total);

    // Buscar fotos paginadas
    const result = await pool.query(
      `SELECT 
        p.id, p.url, p.public_id, p.user_id, p.created_at,
        u.name as user_name, u.email as user_email
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { photos: result.rows, total };
  } catch (err) {
    console.error('Erro ao buscar fotos paginadas:', err.message);
    throw err;
  }
};

// Buscar foto por ID
const getPhotoById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id, p.url, p.public_id, p.user_id, p.created_at,
        u.name as user_name, u.email as user_email
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Erro ao buscar foto por ID:', err.message);
    throw err;
  }
};

// ==================== TABELA LOGS ====================

// Criar log
const createLog = async (userId, ip, route, method, body, statusCode) => {
  try {
    const result = await pool.query(
      'INSERT INTO logs (user_id, ip, route, method, body, status_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, ip, route, method, JSON.stringify(body), statusCode]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Erro ao criar log:', err.message);
    throw err;
  }
};

// Buscar logs de um usuário
const getLogsByUserId = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [userId]
    );
    return result.rows;
  } catch (err) {
    console.error('Erro ao buscar logs:', err.message);
    throw err;
  }
};

// Buscar todos os logs (últimos 1000)
const getAllLogs = async () => {
  try {
    const result = await pool.query(
      'SELECT * FROM logs ORDER BY created_at DESC LIMIT 1000'
    );
    return result.rows;
  } catch (err) {
    console.error('Erro ao buscar logs:', err.message);
    throw err;
  }
};

// Apagar log por ID
const deleteLogById = async (id) => {
  try {
    const result = await pool.query(
      'DELETE FROM logs WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Erro ao apagar log:', err.message);
    throw err;
  }
};

// Apagar múltiplos logs por IDs
const deleteLogsByIds = async (ids) => {
  try {
    const result = await pool.query(
      'DELETE FROM logs WHERE id = ANY($1::uuid[]) RETURNING *',
      [ids]
    );
    return result.rows;
  } catch (err) {
    console.error('Erro ao apagar logs:', err.message);
    throw err;
  }
};

// Apagar todos os logs (com filtros opcionais)
const deleteAllLogs = async () => {
  try {
    const result = await pool.query('DELETE FROM logs RETURNING id');
    return result.rowCount;
  } catch (err) {
    console.error('Erro ao apagar todos os logs:', err.message);
    throw err;
  }
};

// Buscar logs com filtros e paginação
const getLogsFiltered = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 25,
      route,
      method,
      status,
      startDate,
      endDate,
      sortField = 'created_at',
      sortDir = 'desc'
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Filtros
    if (route) {
      conditions.push(`route ILIKE $${paramIndex}`);
      values.push(`%${route}%`);
      paramIndex++;
    }
    if (method) {
      conditions.push(`method = $${paramIndex}`);
      values.push(method.toUpperCase());
      paramIndex++;
    }
    if (status) {
    if (String(status).endsWith('xx')) {
      const base = parseInt(status[0]) * 100;
      conditions.push(`status_code >= $${paramIndex} AND status_code < $${paramIndex + 1}`);
      values.push(base, base + 100);
      paramIndex += 2;
    } else {
      conditions.push(`status_code = $${paramIndex}`);
      values.push(parseInt(status));
      paramIndex++;
    }
  }
    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(endDate + ' 23:59:59');
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para total
    const totalQuery = `SELECT COUNT(*) as total FROM logs ${whereClause}`;
    const totalResult = await pool.query(totalQuery, values);
    const total = parseInt(totalResult.rows[0].total);

    // Query para logs paginados
    const sortOrder = sortDir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const allowedSortFields = ['created_at', 'route', 'method', 'status_code'];
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';

    const logsQuery = `
      SELECT * FROM logs 
      ${whereClause}
      ORDER BY ${safeSortField} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const logsResult = await pool.query(logsQuery, values);

    return { logs: logsResult.rows, total };
  } catch (err) {
    console.error('Erro ao buscar logs filtrados:', err.message);
    throw err;
  }
};
module.exports = {
  // Users
  createUser,
  getUserByEmail,
  getUserById,
  // Photos
  savePhoto,
  getPhotosByUserId,
  getAllPhotos,
  getAllPhotosPaginated,
  getPhotoById,
  // Logs
  createLog,
  getLogsByUserId,
  getAllLogs,
  getLogsFiltered,
  deleteLogById,
  deleteLogsByIds,
  deleteAllLogs,
};
