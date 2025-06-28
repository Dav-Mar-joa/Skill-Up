const express = require('express');
const path = require('path');
require('dotenv').config();
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const { MongoClient, ObjectId } = require('mongodb');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cookieParser());

const sessionMiddleware = session({
  secret: process.env.JWT_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DBNAME || 'SkilUp',
    collectionName: 'sessions',
  }),
  cookie: {
    secure: false, // à true en prod HTTPS
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
  },
});

app.use(sessionMiddleware);

// Connexion MongoDB
const client = new MongoClient(process.env.MONGODB_URI);
let db;
async function connectDB() {
  try {
    await client.connect();
    db = client.db(process.env.MONGODB_DBNAME || 'SkilUp');
    console.log('Connecté à MongoDB');

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (err) {
    console.error('Erreur connexion MongoDB:', err);
  }
}

// Middleware de protection des routes (hors login et createUser)
app.use((req, res, next) => {
  if (!req.session.user && !['/login', '/createUser'].includes(req.path)) {
    return res.redirect('/login');
  }
  next();
});

connectDB();

// Configuration moteur Pug + dossier views et statics
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/manifest.json', (req, res) => {
  res.type('application/manifest+json');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

// ==== ROUTES ====

// GET page login
app.get('/login', (req, res) => {
  res.render('login', { message: null });
});

// POST login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const collection = db.collection('Users');
    const user = await collection.findOne({ username });
    if (!user) {
      return res.render('login', { message: "Login ou mot de passe erroné !" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { message: "Login ou mot de passe erroné !" });
    }
    req.session.user = {
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin || 'n',
    };
    if (user.isAdmin === 'y') {
      return res.redirect('/admin');
    }
    return res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

// GET page création utilisateur
app.get('/createUser', (req, res) => {
  res.render('createUser', { errorMessage: null });
});

// POST création utilisateur
app.post('/createUser', async (req, res) => {
  const { username, mdp: password, 'secret-question': secretQuestion } = req.body;
  try {
    const usersCollection = db.collection('Users');
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.render('createUser', { errorMessage: 'Nom d\'utilisateur déjà utilisé.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({
      username,
      password: hashedPassword,
      secretQuestion,
      tasks: [],
      isAdmin: 'n',
    });
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// POST ajout tâche
app.post('/', async (req, res) => {
  try {
    const { date, datef, heure, heuref, pause, taux, task, description, priority, qui } = req.body;
    const dateStart = date
      ? moment.tz(date + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
      : moment.tz('Europe/Paris').startOf('day').toDate();
    const dateEnd = datef
      ? moment.tz(datef + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
      : moment.tz('Europe/Paris').startOf('day').toDate();

    const dateSimpleStart = moment.tz(dateStart, 'Europe/Paris').format('YYYY-MM-DD');
    const dateSimpleEnd = moment.tz(dateEnd, 'Europe/Paris').format('YYYY-MM-DD');
    let heureTravail = 0;
    const pauseInt = parseInt(pause) || 0;

    if (dateSimpleStart === dateSimpleEnd) {
      const [hDebut] = heure.split(':').map(Number);
      const [hFin] = heuref.split(':').map(Number);
      heureTravail = hFin - hDebut - pauseInt;
    } else {
      const [hDebut] = heure.split(':').map(Number);
      const [hFin] = heuref.split(':').map(Number);
      heureTravail = (24 - hDebut) + hFin - pauseInt;
    }

    const tauxInt = parseInt(taux) || 0;
    const montant = heureTravail * tauxInt;

    const newTask = {
      _id: new ObjectId(),
      name: task,
      date: dateSimpleStart,
      datef: dateSimpleEnd,
      heure,
      heuref,
      heureTravail,
      montant,
      taux: tauxInt,
      description,
      priority,
      qui,
    };

    const collection = db.collection('Users');
    await collection.updateOne(
      { _id: new ObjectId(req.session.user._id) },
      { $push: { tasks: newTask } }
    );

    res.redirect('/?success=true');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur ajout tâche');
  }
});

// GET page principale (index)
app.get('/', async (req, res) => {
  const success = req.query.success === 'true';
  const successCourse = req.query.successCourse === 'true';

  try {
    const collection = db.collection('Users');
    const user = await collection.findOne({ _id: new ObjectId(req.session.user._id) });
    const tasks = user?.tasks || [];

    let salaire = 0;
    tasks.forEach(task => salaire += task.montant);

    const collectionCourses = db.collection('Courses');
    const courses = await collectionCourses.find({}).toArray();

    res.render('index', {
      tasks,
      courses,
      salaire,
      success,
      successCourse,
      username: req.session.user.username,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur récupération tâches');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erreur déconnexion:', err);
      return res.status(500).send('Erreur lors de la déconnexion');
    }
    res.clearCookie('connect.sid'); // supprimer cookie session
    res.redirect('/login');
  });
});

// DELETE tâche
app.delete('/delete-task/:id', async (req, res) => {
  const taskId = req.params.id;
  try {
    const collection = db.collection('Users');
    await collection.updateOne(
      { _id: new ObjectId(req.session.user._id) },
      { $pull: { tasks: { _id: new ObjectId(taskId) } } }
    );
    res.status(200).send('Tâche supprimée');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur suppression tâche');
  }
});
