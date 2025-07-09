// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { connectSnowflake } = require('./db');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. CORE MIDDLEWARE (Correct Order is Essential) ---
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false, 
    sameSite: 'lax'
  }
}));

// --- 2. API ROUTES (Correct Mounting Order) ---
app.use('/projects', require('./routes/projects'));
app.use('/timesheet', require('./routes/timesheet'));
app.use('/management', require('./routes/management'));
app.use('/', require('./routes/auth')); 

// --- 3. API DOCUMENTATION (SWAGGER) ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Cozentus API', version: '1.0.0' },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./routes/*.js'],
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

// // --- 4. SERVE REACT APP (For Production) ---
// const reactBuildPath = path.join(__dirname, '..', 'my-timesheet-app', 'dist');
// app.use(express.static(reactBuildPath));
// app.get(/^\/(?!api|api-docs).*/, (req, res) => {
//   res.sendFile(path.join(reactBuildPath, 'index.html'));
// });

// --- 5. SERVER STARTUP ---
connectSnowflake((err) => {
  if (err) {
    console.error('FATAL: Could not connect to Snowflake. Server is not starting.');
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
  });
});