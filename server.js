const app = require('./app');
const sequelize = require('./config/database');

sequelize.sync()
  .then(() => {
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch((error) => {
    console.error('Unable to sync the database:', error);
  });