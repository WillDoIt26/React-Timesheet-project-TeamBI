// db.js
const snowflake = require('snowflake-sdk');
require('dotenv').config();

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA
});

function connectSnowflake(callback) {
  connection.connect((err, conn) => {
    if (err) {
      console.error('Unable to connect to Snowflake:', err);
      callback(err);
    } else {
      console.log('Connected to Snowflake.');
      callback(null, conn);
    }
  });
}

function getConn() {
  return connection;
}

module.exports = { connectSnowflake, getConn };
