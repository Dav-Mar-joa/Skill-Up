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

// ----- SESSION -----
const sessionMiddleware = session({
  secret: process.env.JWT_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    dbName: 'SkilUp',
    collectionName: 'production',
  }),
  cookie: {
    secure: false, // Mettre true en prod avec HTTPS
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
  },
});
app.use(sessionMiddleware);

// ----- MONGODB -----
const connectionString = process.env.MONGODB_URI;
const client = new MongoClient(connectionString);
const dbName = process.env.MONGODB_DBNAME;
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Connecté à MongoDB');

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB :', err);
  }
}
connectDB();

// ----- PUG -----
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ----- STATIC -----
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// ----- AUTH MIDDLEWARE -----
app.use((req, res, next) => {
  const isAuth = !!req.session.user;
  const openPaths = ['/login', '/createUser'];

  if (isAuth && openPaths.includes(req.path)) {
    return res.redirect('/');
  }

  if (!isAuth && !openPaths.includes(req.path) && !req.path.startsWith('/public')) {
    return res.redirect('/login');
  }

  next();
});

// ----- ROUTES AUTH -----
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const collection = db.collection('Users');
    const user = await collection.findOne({ username });

    if (!user) {
      return res.render('login', { message: 'Login ou mot de passe erroné !' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { message: 'Login ou mot de passe erroné !' });
    }

    req.session.user = {
      _id: user._id,
      username: user.username,
    };

    console.log('✅ Connecté :', user.username);

    if (user.isAdmin === 'y') {
      return res.redirect('/admin');
    } else {
      return res.redirect('/');
    }
  } catch (err) {
    console.error('❌ Erreur login :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/createUser', (req, res) => {
  res.render('createUser');
});

app.post('/createUser', async (req, res) => {
  const { username, mdp: password, 'secret-question': secretQuestion } = req.body;

  try {
    const collection = db.collection('Users');
    const exists = await collection.findOne({ username });

    if (exists) {
      return res.render('createUser', { errorMessage: 'Nom d\'utilisateur déjà pris.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      password: hashedPassword,
      secretQuestion,
    };

    await collection.insertOne(newUser);

    res.redirect('/login');
  } catch (err) {
    console.error('❌ Erreur création user :', err);
    res.status(500).send('Erreur serveur');
  }
});

// ----- AJOUT TÂCHE -----
app.post('/', async (req, res) => {
  const dateJ = req.body.date
    ? moment.tz(req.body.date + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
    : moment.tz('Europe/Paris').startOf('day').toDate();

  const dateF = req.body.datef
    ? moment.tz(req.body.datef + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
    : moment.tz('Europe/Paris').startOf('day').toDate();

  const dateSimple = moment.tz(dateJ, 'Europe/Paris').format('YYYY-MM-DD');
  const dateSimpleFin = moment.tz(dateF, 'Europe/Paris').format('YYYY-MM-DD');

  let heureTravail = 0;
  const pause = parseInt(req.body.pause) || 0;

  if (dateSimpleFin === dateSimple) {
    const [hStart, mStart] = req.body.heure.split(':').map(Number);
    const [hEnd, mEnd] = req.body.heuref.split(':').map(Number);
    heureTravail = hEnd - hStart - pause;
  } else {
    const [hStart] = req.body.heure.split(':').map(Number);
    const [hEnd] = req.body.heuref.split(':').map(Number);
    heureTravail = (24 - hStart) + hEnd - pause;
  }

  const taux = parseInt(req.body.taux) || 0;
  const montant = heureTravail * taux;

  const task = {
    name: req.body.task,
    date: dateSimple,
    datef: dateSimpleFin,
    heure: req.body.heure,
    heuref: req.body.heuref,
    heureTravail,
    montant,
    taux,
    description: req.body.description,
    priority: req.body.priority,
    qui: req.body.qui,
  };

  try {
    const collection = db.collection(process.env.MONGODB_COLLECTION);
    await collection.insertOne(task);
    res.redirect('/?success=true');
  } catch (err) {
    console.error('❌ Erreur ajout tâche :', err);
    res.status(500).send('Erreur ajout tâche');
  }
});

// ----- ACCUEIL -----
app.get('/', async (req, res) => {
  const success = req.query.success === 'true';
  const successCourse = req.query.successCourse === 'true';

  try {
    const collection = db.collection(process.env.MONGODB_COLLECTION);
    const collectionCourses = db.collection('Courses');

    const tasks = await collection.find({}).sort({ date: 1 }).toArray();
    const courses = await collectionCourses.find({}).toArray();

    const salaire = tasks.reduce((total, task) => total + (task.montant || 0), 0);

    res.render('index', {
      title: 'Mon site',
      message: 'Bienvenue sur ma montre digitale',
      tasks,
      courses,
      success,
      successCourse,
      salaire,
    });
  } catch (err) {
    console.error('❌ Erreur accueil :', err);
    res.status(500).send('Erreur accueil');
  }
});

// ----- SUPPRIMER TÂCHE -----
app.delete('/delete-task/:id', async (req, res) => {
  const taskId = req.params.id;
  try {
    const collection = db.collection(process.env.MONGODB_COLLECTION);
    await collection.deleteOne({ _id: new ObjectId(taskId) });
    res.status(200).send('Tâche supprimée');
  } catch (err) {
    console.error('❌ Erreur suppression tâche :', err);
    res.status(500).send('Erreur suppression');
  }
});
