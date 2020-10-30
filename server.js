const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

mongoose
  .connect(process.env.DB.replace('<password>', process.env.DB_PASSWORD), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('App is connected to email-reminder database.'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECIEVED. Shutting down gracefully');
  // Server.close zamknie serwer, ale najpierw wykona wszystkie oczekujące requesty. Nie musimy używać server.exit, ponieważ SIGTERM sam z siebie spowoduje, że aplikacja zostanie wyłączona.
  server.close(() => {
    console.log('Process terminated!');
  });
});
