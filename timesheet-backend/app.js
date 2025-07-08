const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { connectSnowflake } = require('./db');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// 1. CORS Middleware FIRST
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
    maxAge: 60 * 60 * 1000,
    sameSite: 'lax',
    secure: false
  }
}));

// 3. Configure Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Documentation',
      version: '1.0.0',
      description: 'API documentation for your Node.js backend',
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 3000}` }
    ],
  },
  apis: ['./routes/*.js'], // Path to your route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 5. Routes (mount at root, not under /api)
app.use('/', require('./routes/auth'));
app.use('/timesheet', require('./routes/timesheet'));
app.use('/projects', require('./routes/projects'));


const PORT = process.env.PORT || 3000;

connectSnowflake((err) => {
  if (err) {
    console.error('Exiting due to Snowflake connection error.');
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
});
