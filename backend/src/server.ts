import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

async function startServer(): Promise<void> {
  // Connect to MongoDB
  await connectDB();

  // Start Express server
  app.listen(env.PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║   🐻 Grizzlywear API Server             ║
  ║   Port: ${String(env.PORT).padEnd(33)}║
  ║   Environment: ${env.NODE_ENV.padEnd(26)}║
  ╚══════════════════════════════════════════╝
    `);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
