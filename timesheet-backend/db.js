// db.js
const snowflake = require('snowflake-sdk');
require('dotenv').config();

const pool = snowflake.createPool({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA
}, {
  max: 10,
  min: 1
});

const execute = (sqlText, binds = []) => {
  return new Promise((resolve, reject) => {
    pool.use(async (connection) => {
      try {
        connection.execute({
          sqlText,
          binds,
          complete: (err, stmt, rows) => {
            if (err) return reject(err);
            resolve({ stmt, rows });
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  });
};

module.exports = { execute };