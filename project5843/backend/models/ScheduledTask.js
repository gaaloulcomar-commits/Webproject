const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ScheduledTask', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    serverIds: {
      type: DataTypes.JSON,
      allowNull: false
    },
    scheduledTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cronExpression: {
      type: DataTypes.STRING
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      defaultValue: 'pending'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    emailNotification: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    notificationEmails: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  });
};