const bcrypt = require('bcryptjs');
const { User, Server } = require('./models');

async function seedDatabase() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@company.com',
        password: adminPassword,
        role: 'admin',
        permissions: {
          canMonitor: true,
          canRestart: true,
          canViewLogs: true,
          canManageServers: true,
          canManageUsers: true,
          canScheduleTasks: true
        }
      }
    });

    // Create demo servers based on your script
    const servers = [
      {
        name: 'SiegeAssurnetFront',
        hostname: 'SiegeAssurnetFront',
        ipAddress: '192.168.1.10',
        port: 80,
        group: 'frontend',
        restartOrder: 1,
        description: 'Frontend server'
      },
      {
        name: 'droolslot2',
        hostname: 'droolslot2',
        ipAddress: '192.168.1.11',
        port: 80,
        group: 'frontend',
        restartOrder: 2,
        description: 'Drools server'
      },
      {
        name: 'siegeawf',
        hostname: 'siegeawf',
        ipAddress: '192.168.1.12',
        port: 80,
        group: 'middleware',
        restartOrder: 3,
        description: 'AWF server'
      },
      {
        name: 'siegeasdrools',
        hostname: 'siegeasdrools',
        ipAddress: '192.168.1.13',
        port: 8080,
        group: 'middleware',
        restartOrder: 4,
        description: 'AS Drools server'
      },
      {
        name: 'siegeaskeycloak',
        hostname: 'siegeaskeycloak',
        ipAddress: '192.168.1.14',
        port: 8080,
        group: 'auth',
        restartOrder: 5,
        description: 'Keycloak authentication server'
      },
      {
        name: 'siegeasbackend',
        hostname: 'siegeasbackend',
        ipAddress: '192.168.1.15',
        port: 7001,
        group: 'backend',
        restartOrder: 6,
        restartDelay: 650,
        description: 'Backend application server'
      },
      {
        name: 'assurnetprod',
        hostname: 'assurnetprod',
        ipAddress: '192.168.1.16',
        port: 80,
        group: 'production',
        restartOrder: 7,
        description: 'Production server'
      },
      {
        name: 'SiegeAssurnetDigitale',
        hostname: 'SiegeAssurnetDigitale',
        ipAddress: '192.168.1.17',
        port: 7002,
        group: 'backend',
        restartOrder: 6,
        description: 'Digital platform server'
      },
      {
        name: 'siegedbc',
        hostname: 'siegedbc',
        ipAddress: '192.168.1.18',
        port: 1521,
        group: 'database',
        restartOrder: 0,
        description: 'Database server (not restarted automatically)'
      }
    ];

    for (const serverData of servers) {
      await Server.findOrCreate({
        where: { hostname: serverData.hostname },
        defaults: serverData
      });
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

module.exports = { seedDatabase };

// Run seeding if called directly
if (require.main === module) {
  const { sequelize } = require('./models');
  
  sequelize.authenticate()
    .then(() => sequelize.sync())
    .then(() => seedDatabase())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}