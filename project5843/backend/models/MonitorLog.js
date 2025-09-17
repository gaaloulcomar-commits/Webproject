const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('MonitorLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    serverId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pingStatus: {
      type: DataTypes.BOOLEAN
    },
    telnetStatus: {
      type: DataTypes.BOOLEAN
    },
    responseTime: {
      type: DataTypes.INTEGER
    },
    errorMessage: {
      type: DataTypes.TEXT
    }
  });
};