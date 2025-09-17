const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RestartLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    serverIds: {
      type: DataTypes.JSON,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('started', 'completed', 'failed'),
      defaultValue: 'started'
    },
    details: {
      type: DataTypes.JSON
    },
    startTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    endTime: {
      type: DataTypes.DATE
    },
    isScheduled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};