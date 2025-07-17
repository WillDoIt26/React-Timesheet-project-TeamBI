// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { execute } = require('./db'); // Simplified import
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. CORE MIDDLEWARE ---
// This setup is correct
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());

// **CRITICAL**: Serve static files from the 'public' directory.
// This allows the frontend to access http://<your_server>/uploads/avatars/image.png
app.use(express.static('public')); 

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax'
  }
}));

// --- 2. API ROUTES (WITH /api PREFIX) ---
// CORRECTED: Add the /api prefix to all routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/timesheet', require('./routes/timesheet'));
app.use('/api/management', require('./routes/management'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api', require('./routes/auth'));

// --- 3. API DOCUMENTATION (SWAGGER) ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Cozentus API', version: '1.0.0' },
    // Update the server URL in Swagger to include the /api prefix
    servers: [{ url: `http://localhost:${PORT}/api` }],
  },
  apis: ['./routes/*.js'],
};
// Update the swagger route as well
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));


// --- 4. SERVER STARTUP ---
execute('SELECT 1')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    console.error('FATAL: Could not connect to Snowflake. Server is not starting.', err);
    process.exit(1);
  });