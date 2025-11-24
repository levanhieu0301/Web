//server/config/connect_db.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false, // tắt log dài của Sequelize
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL Connected Successfully!");
  } catch (error) {
    console.error("MySQL Connection Failed:", error);
  }
};

module.exports = { sequelize, connectDB };
