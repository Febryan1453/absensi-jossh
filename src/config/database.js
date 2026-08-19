const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'project_absensi',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  charset: 'utf8mb4',
  /**
   * KONVENSI WAKTU: setiap DATETIME di basis data ini adalah UTC.
   *
   * mysql2 memakai setelan ini untuk dua arah — mengubah objek Date menjadi
   * UTC saat menulis, dan menafsirkan DATETIME sebagai UTC saat membaca. Maka
   * waktu HARUS ditulis sebagai objek Date yang diikat sebagai parameter.
   *
   * JANGAN memakai NOW(). NOW() dihitung MySQL pada zona waktu sesi, bukan
   * lewat mysql2, sehingga ia menulis jam dinding server ke kolom yang nanti
   * dibaca kembali seolah UTC. Di server berzona WIB nilainya lalu tampil
   * tujuh jam di masa depan — dan itu tidak pernah terlihat sebagai error,
   * hanya sebagai angka yang salah di layar. Pakai UTC_TIMESTAMP() bila
   * benar-benar harus di dalam SQL.
   */
  timezone: '+00:00',
  decimalNumbers: true
});

/**
 * Execute a callback within an atomic MySQL transaction.
 * Automatically handles BEGIN, COMMIT, ROLLBACK, and releases the connection.
 * @param {Function} callback - Async function receiving (connection) => Promise<any>
 * @returns {Promise<any>}
 */
const withTransaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database successfully.');
    connection.release();
  } catch (error) {
    console.error('❌ Failed to connect to MySQL Database:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  withTransaction,
  testConnection
};
