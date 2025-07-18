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

/**
 * Executes a transaction.
 * @param {function(conn): Promise<any>} callback The callback function to execute with the connection.
 * @returns {Promise<any>}
 */
const transaction = async (callback) => {
  return new Promise((resolve, reject) => {
    pool.use(async (connection) => {
      try {
        await new Promise((resolve, reject) => connection.beginTransaction(err => err ? reject(err) : resolve()));
        const result = await callback(connection);
        await new Promise((resolve, reject) => connection.commit(err => err ? reject(err) : resolve()));
        resolve(result);
      } catch (err) {
        await new Promise((resolve, reject) => connection.rollback(err => err ? reject(err) : resolve()));
        reject(err);
      }
    });
  });
};

/**
 * Executes a statement within a transaction.
 * @param {any} connection The connection object from the transaction callback.
 * @param {string} sqlText The SQL statement to execute.
 * @param {Array<any>} binds The binds for the SQL statement.
 * @returns {Promise<{stmt: any, rows: any[]}>}
 */
const executeInTransaction = (connection, sqlText, binds = []) => {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) return reject(err);
        resolve({ stmt, rows });
      }
    });
  });
};

module.exports = { execute, transaction, executeInTransaction };