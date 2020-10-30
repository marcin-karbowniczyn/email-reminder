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

//////////////// TO DO W PROJEKCIE ///////////////////////
/* 

    1. Szybki front-end, dodanie remindera, zobaczenie swoich reminderów, możliwość usunięcia, edycji? (To w ramach rozbudowy projektu.)
    2. Error handler serverowy, taki jak w natours.
    3. Powtórzenie JSowego frontendu na przykładzie appki z 1 kursu.

*/

//////////////// NOTKI, PRZYPOMNIENIA, CO ZROBIĆ W TRAKCIE PROJEKTU? ///////////////////////
/*
    1. Obejrzeć film o API i restAPI.
    4. Czym jest quicksort?
    7. Powtórzyć slajdy z kursu Node, agr. pipeline, streams i events. Events nie wiem czy muszę.
    8. Poczytać o util
    14. Czym był Multer i multi-part form data
    15. Jak działa indeksowanie, że np. kombinacja user i tour może być unique. Czy mogę to użyć u siebie?
    16. UnhandledRejection i SIGTERM, co to było?
    17. Czym właściwie są Promise   
    19. Przypomnieć sobie ten debugger co używałem.
    20. Co to jest branch w github?
    21. Przypomnieć sobie funkcje find, findIndex i includes
    22. Dokładnie poczytać o i++ i ++i i while loop
    
*/
