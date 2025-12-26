import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Parse server address - handle formats like "server,port" or just "server"
let server = process.env.DB_SERVER || '';
let port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433;

// If server contains comma, split it (format: "server,port")
if (server.includes(',')) {
  const parts = server.split(',');
  server = parts[0].trim();
  port = parts.length > 1 ? parseInt(parts[1].trim(), 10) : 1433;
}

const dbConfig = {
  server: server,
  port: port,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  requestTimeout: 30000,
};

let pool = null;

export async function getConnection() {
  try {
    if (!pool) {
      pool = await sql.connect(dbConfig);
      console.log('SQL Server connection pool created');
    }
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function testConnection() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT 1 as test');
    return result.recordset;
  } catch (error) {
    throw new Error(`Database connection test failed: ${error.message}`);
  }
}

export async function runQuery(queryText) {
  const pool = await getConnection();
  try {
    const result = await pool.request().query(queryText);
    return {
      rows: result.recordset,
      rowCount: result.recordset.length,
    };
  } catch (error) {
    console.error('Query execution error:', error);
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

