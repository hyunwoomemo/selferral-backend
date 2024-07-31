const db = require("../db");

exports.getAllExchanges = async () => {
  const [rows] = await db.query("SELECT * FROM exchanges");

  return rows[0];
};
