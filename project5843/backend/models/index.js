const { Sequelize } = require('sequelize');
const UserModel = require('./User');
const ServerModel = require('./Server');
const RestartLogModel = require('./RestartLog');
const MonitorLogModel = require('./MonitorLog');
const ScheduledTaskModel = require('./ScheduledTask');

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'server_monitor',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  dialect: 'postgres',
  logging: false
});

const User = UserModel(sequelize);
const Server = ServerModel(sequelize);
const RestartLog = RestartLogModel(sequelize);
const MonitorLog = MonitorLogModel(sequelize);
const ScheduledTask = ScheduledTaskModel(sequelize);

// Define associations
User.hasMany(RestartLog, { foreignKey: 'userId' });
RestartLog.belongsTo(User, { foreignKey: 'userId' });

Server.hasMany(MonitorLog, { foreignKey: 'serverId' });
MonitorLog.belongsTo(Server, { foreignKey: 'serverId' });

User.hasMany(ScheduledTask, { foreignKey: 'createdBy' });
ScheduledTask.belongsTo(User, { foreignKey: 'createdBy' });

module.exports = {
  sequelize,
  User,
  Server,
  RestartLog,
  MonitorLog,
  ScheduledTask
};