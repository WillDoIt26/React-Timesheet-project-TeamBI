const { getConn, connectSnowflake } = require('./db');

// Connect to Snowflake first
connectSnowflake((err) => {
  if (err) {
    console.error('Connection failed:', err);
    return;
  }

  const conn = getConn();
  
  // Now execute the test query
  conn.execute({
    sqlText: "SELECT 1 FROM USERS LIMIT 1",
    complete: function(err, stmt, rows) {
      if (err) {
        console.error('Test query failed:', err);
      } else {
        console.log('Test query succeeded:', rows);
      }
    }
  });
});
