const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const { testConnection, pool } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Verify Database Connection
    await testConnection();

    // 2. Start HTTP Server
    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 School Attendance REST API Server Running`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log('====================================================');
    });

    // 3. Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed.');
        try {
          await pool.end();
          console.log('🗄️  Database connection pool closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during pool shutdown:', err.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('💥 Failed to start application server:', error.message);
    process.exit(1);
  }
};

startServer();
