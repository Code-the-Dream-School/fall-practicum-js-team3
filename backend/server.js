require('dotenv').config();
const app = require('./src/app').default;
const connectMongo = require('./src/config/db.mongo');


const PORT = process.env.PORT || 8080;

// Start listening only once MongoDB is connected. connectMongo exits the process on failure.
connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
