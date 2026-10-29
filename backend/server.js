require('dotenv').config();
const app = require('./src/app').default;
const connectMongo = require('./src/config/db.mongo');

const PORT = process.env.PORT || 8080;

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Server startup failed:', error.message);
    process.exitCode = 1;
  });