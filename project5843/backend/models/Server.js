const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Server', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    hostname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sshPort: {
      type: DataTypes.INTEGER,
      defaultValue: 22
    },
    description: {
      type: DataTypes.TEXT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastPing: {
      type: DataTypes.DATE
    },
    lastTelnet: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'unknown'),
      defaultValue: 'unknown'
    },
    group: {
      type: DataTypes.STRING,
      defaultValue: 'default'
    },
    restartOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    restartDelay: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });
};