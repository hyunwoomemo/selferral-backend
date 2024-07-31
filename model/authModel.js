const db = require("../db");

exports.getAllUser = async () => {
  const [rows] = await db.query("SELECT * FROM users");

  return rows[0];
};

exports.getUserInfo = async (email) => {
  const [rows] = await db.query("SELECT name, email, hp, createdAt, type FROM users where email = ?", [email]);

  return rows[0];
};
