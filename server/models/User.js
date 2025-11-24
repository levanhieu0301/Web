const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connect_db");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user','staff','admin'), 
    allowNull: false,
    defaultValue: 'user',             
  },
}, {
  tableName: "users",
  timestamps: false,
});

module.exports = User;


// const { DataTypes } = require("sequelize");
// const { sequelize } = require("../config/connect_db");

// const User = sequelize.define("User", {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true,
//   },
//   name: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   email: {
//     type: DataTypes.STRING,
//     allowNull: false,
//     unique: true,
//     validate: {
//       isEmail: true,
//     },
//   },
//   phone: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },
//   password: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   role: {
//     type: DataTypes.STRING,
//     defaultValue: "admin",
//   },
// }, {
//   tableName: "users", 
//   timestamps: false,   
// });

// module.exports = User;