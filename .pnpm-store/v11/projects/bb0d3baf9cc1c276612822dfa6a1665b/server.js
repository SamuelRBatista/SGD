const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const { connectDB, syncDatabase, seedDatabase } = require('./src/config/database');
const app = require('./src/app');

const PORT = process.env.PORT || 3001;

async function startServer() {
  await connectDB();
  await syncDatabase();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
  });
}

startServer();
