const express = require('express');
const path = require('path');
require('dotenv').config();
const bodyParser = require('body-parser');
const moment = require('moment-timezone')
const { MongoClient, ObjectId } = require('mongodb');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');


const app = express()
app.use(cookieParser());
const sessionMiddleware = session({
    secret: process.env.JWT_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        dbName: 'SkilUp', // Nom de la base de données
        collectionName: 'production', // Nom de la collection pour les sessions
    }),
    cookie: {
        secure: false, // Mettre true en production avec HTTPS
        maxAge: 30*24 * 60 * 60 * 1000, // Durée de vie des cookies (30 jour ici)
    },
});;

app.use(sessionMiddleware);

// Connexion à MongoDB
// const connectionString = `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`;
const connectionString = process.env.MONGODB_URI;
const client = new MongoClient(connectionString);
const dbName = process.env.MONGODB_DBNAME;

let db;
async function connectDB() {
    try {
        await client.connect();
        db = client.db(dbName);
        console.log('Connecté à la base de données MongoDB');

        // ✅ Démarrer le serveur ici
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`Serveur démarré sur le port ${PORT}`);
        });

    } catch (err) {
        console.error('Erreur de connexion à la base de données :', err);
    }
}

connectDB();

// Définir Pug comme moteur de vues
app.set('view engine', 'pug');

// Définir le chemin du dossier 'views'
app.set('views', path.join(__dirname, 'views'));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour parser les données du formulaire
app.use(bodyParser.urlencoded({ extended: false }));

// app.use((req, res, next) => {
//   const isAuth = !!req.session.user;
//   const openPaths = ['/login', '/createUser'];

//   // Si l'utilisateur est connecté ET qu'il veut aller sur /login ou /createUser → on le redirige vers /
//   if (isAuth && openPaths.includes(req.path)) {
//     return res.redirect('/');
//   }

//   // Si l'utilisateur N'EST PAS connecté ET qu'il essaie d'aller sur une route protégée → redirection vers /login
//   if (!isAuth && !openPaths.includes(req.path) && !req.path.startsWith('/public')) {
//     return res.redirect('/login');
//   }

//   next();
// });

app.get('/login', async (req, res) => {
        res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log("username:", username);
    try {
        const collection = db.collection('Users');
        const userLogged = await collection.findOne({ username });
        // console.log('collection:', collection);
        console.log('userLogged:', userLogged);

        // Vérifier si l'utilisateur existe
        if (!userLogged) {
            return res.render('login', { message: "Login ou mot de passe erroné !" });
        }
        // if (userLogged.isLoggedIn) {
        //     return res.render('login', { message: "Ce compte est déjà connecté ailleurs." });
        // }

        // Vérifier si le mot de passe correspond au hash stocké
        const isMatch = await bcrypt.compare(password, userLogged.password);
        console.log("isMatch:", isMatch);
        if (!isMatch) {
            return res.render('login', { message: "Login ou mot de passe erroné !" });
        }

        await collection.updateOne(
            { _id: userLogged._id },
            { $set: { isLoggedIn: true } }
        );

        // Création de la session utilisateur après authentification réussie
        req.session.user = {
            _id: userLogged._id,
            username: userLogged.username,
        };

        // Redirection selon le rôle de l'utilisateur
        if (userLogged.isAdmin === "y") {
            console.log("Utilisateur admin connecté");
            return res.redirect('/admin');
        } else {
            console.log("Utilisateur connecté :", req.session.user.username);
            console.log("Session utilisateur :", req.session.user);
            res.redirect('/?success=true');
                    }
    } catch (err) {
        console.error("Erreur lors de la connexion :", err);
        res.status(500).send("Erreur lors de la connexion");
    }
});

app.get('/createUser', async (req, res) => {

    res.render('createUser');  } )

app.post('/createUser', async (req, res) => {
  const { username, mdp: password, 'secret-question': secretQuestion } = req.body;
    console.log("Username:", username);
    console.log("Password:", password);  
    console.log("secret-question", secretQuestion);                   
  try {
    const usersCollection = db.collection('Users');
    const existingUser = await usersCollection.findOne({ username });

    if (existingUser) {
      // On renvoie la page avec un message d'erreur
      return res.render('createUser', { errorMessage: 'Nom d\'utilisateur déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      username,
      password: hashedPassword,
      secretQuestion,
    };

    await usersCollection.insertOne(user);

    res.redirect('/login'); // ou vers la page principale directement
  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur :', err);
    res.status(500).send('Erreur lors de la création de l\'utilisateur');
  }
}); 

// // Route pour soumettre des tâches
// app.post('/', async (req, res) => {
//   const user = req.session.user || "";
//   if (!user) {
//             return res.redirect('/login'); // Redirection si l'utilisateur n'est pas connecté
//         }
//     const dateJ = req.body.date 
//         ? moment.tz(req.body.date + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
//         : moment.tz('Europe/Paris').startOf('day').toDate();

//     const dateF = req.body.datef 
//         ? moment.tz(req.body.datef + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
//         : moment.tz('Europe/Paris').startOf('day').toDate();
//         const dateSimple= moment.tz(dateJ, "Europe/Paris").format('YYYY-MM-DD'); 
//         const dateSimpleFin= moment.tz(dateF, "Europe/Paris").format('YYYY-MM-DD'); 
//         let heureTravail = 0; // Initialiser heureTravail à 0
//         const pause = parseInt(req.body.pause);
//     // Vérifier si la date de fin est le même jour que la date de début
//         if(dateSimpleFin === dateSimple) {
//         //    const heureTravail=req.body.heuref - req.body.heure; 
//            const heureDebut=req.body.heure.split(':');
//            const heureFin=req.body.heuref.split(':');
//            heureTravail = (heureFin[0] - heureDebut[0]-pause); // Calculer la différence d'heures
//         //    console.log("type of heure debut:", typeof (req.body.heure));
//         //    console.log("heure fin:", req.body.heuref);
//            console.log("Heures de travail:", heureTravail);
//         }
//         else{
//            const heureDebut=req.body.heure.split(':');
//            const heureFin=req.body.heuref.split(':');
//            heureTravail = (24 - parseInt(heureDebut[0])) + parseInt(heureFin[0]-pause); // Calculer la différence d'heures
//            console.log("Heures de travail:", heureTravail);
//         }
//         const taux = parseInt(req.body.taux) 
//         const montant = heureTravail * taux; // Calcul du montant total
//         console.log("montant",montant)
//     const task = {
//         name: req.body.task,
//         date: dateSimple,
//         datef: dateSimpleFin,
//         heure: req.body.heure,
//         montant: montant, // Ajouter le montant au document
//         taux: req.body.taux,
//         heuref: req.body.heuref,
//         heureTravail: heureTravail,
//         description: req.body.description,
//         priority: req.body.priority,
//         qui: req.body.qui
//     };

//     try {
//         const collection = db.collection(process.env.MONGODB_COLLECTION);
//         await collection.insertOne(task);
//         res.redirect('/?success=true'); // Redirection avec un paramètre de succès
//     } catch (err) {
//         console.error('Erreur lors de l\'ajout de la tâche :', err);
//         res.status(500).send('Erreur lors de l\'ajout de la tâche');
//     }
// });

// // // Route pour la page d'accueil
// app.get('/', async (req, res) => {
//     const success = req.query.success === 'true'; // Vérification du paramètre de succès
//     const successCourse = req.query.successCourse === 'true';
     

//     try {
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const tomorrow = new Date(today);
//         tomorrow.setDate(today.getDate() + 1);
//         let salaire = 0;
//         const collection = db.collection(process.env.MONGODB_COLLECTION);
//         const collectionCourses = db.collection('Courses');
//         const tasks = await collection.find({}).sort({ date: 1 }).toArray();
//         const courses = await collectionCourses.find({}).toArray();
//         tasks.forEach(task => {
//         //   console.log('Original Date:', task.date.toString().slice(0, 10));
//           salaire = salaire + task.montant; // Calcul du salaire total
//         });

//         res.render('index', { 
//             title: 'Mon site', 
//             message: 'Bienvenue sur ma montre digitale', 
//             tasks: tasks || [], 
//             courses: courses || [],
//             successCourse,
//             salaire,
//             success 
//         });
//     } catch (err) {
//         console.error('Erreur lors de la récupération des tâches :', err);
//         res.status(500).send('Erreur lors de la récupération des tâches');
//     }
// });
// // ROUTE POUR SOUMETTRE DES TÂCHES
// app.post('/', async (req, res) => {
//   const user = req.session.user || "";
//   if (!user) {
//     return res.redirect('/login'); // Redirection si l'utilisateur n'est pas connecté
//   }

//   const dateJ = req.body.date
//     ? moment.tz(req.body.date + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
//     : moment.tz('Europe/Paris').startOf('day').toDate();

//   const dateF = req.body.datef
//     ? moment.tz(req.body.datef + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
//     : moment.tz('Europe/Paris').startOf('day').toDate();

//   const dateSimple = moment.tz(dateJ, "Europe/Paris").format('YYYY-MM-DD');
//   const dateSimpleFin = moment.tz(dateF, "Europe/Paris").format('YYYY-MM-DD');

//   let heureTravail = 0; // Initialiser heureTravail à 0
//   const pause = parseInt(req.body.pause) || 0;

//   if (dateSimpleFin === dateSimple) {
//     const heureDebut = req.body.heure.split(':');
//     const heureFin = req.body.heuref.split(':');
//     heureTravail = (parseInt(heureFin[0]) - parseInt(heureDebut[0]) - pause);
//     console.log("Heures de travail (même jour):", heureTravail);
//   } else {
//     const heureDebut = req.body.heure.split(':');
//     const heureFin = req.body.heuref.split(':');
//     heureTravail = (24 - parseInt(heureDebut[0])) + parseInt(heureFin[0]) - pause;
//     console.log("Heures de travail (jours différents):", heureTravail);
//   }

//   const taux = parseInt(req.body.taux) || 0;
//   const montant = heureTravail * taux;

//   console.log("Montant calculé :", montant);

//   const task = {
//     user: user, // ✅ Association de l'utilisateur
//     name: req.body.task,
//     date: dateSimple,
//     datef: dateSimpleFin,
//     heure: req.body.heure,
//     montant: montant,
//     taux: req.body.taux,
//     heuref: req.body.heuref,
//     heureTravail: heureTravail,
//     description: req.body.description,
//     priority: req.body.priority,
//     qui: req.body.qui
//   };

//   try {
//     const collection = db.collection('Users');
//                 await collection.updateOne(
//                 { _id: new ObjectId(req.session.user._id) },
//                 { $push: { tasks: task } }
//                 );
//                 res.redirect('/?success=true');
//             } catch (err) {
//                 console.error('Erreur lors de l\'ajout de la tâche :', err);
//                 res.status(500).send('Erreur lors de l\'ajout de la tâche');
//             }
// });

// const { ObjectId } = require('mongodb');

// ROUTE GET /
app.get('/', async (req, res) => {
  const success = req.query.success === 'true';
  const successCourse = req.query.successCourse === 'true';

  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = new ObjectId(req.session.user._id);

    const collection = db.collection('Users');
    const user = await collection.findOne({ _id: userId });

    if (!user) {
      return res.redirect('/login');
    }

    const tasks = user.tasks || [];
    let salaire = 0;
    tasks.forEach(task => {
      salaire += task.montant;
    });

    const collectionCourses = db.collection('Courses');
    const courses = await collectionCourses.find({}).toArray();

    res.render('index', {
      title: 'Mon site',
      message: 'Bienvenue sur ma montre digitale',
      tasks,
      courses: courses || [],
      successCourse,
      salaire,
      success
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des tâches :', err);
    res.status(500).send('Erreur lors de la récupération des tâches');
  }
});

// ROUTE POST /
app.post('/', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const userId = new ObjectId(req.session.user._id);

  const dateJ = req.body.date
    ? moment.tz(req.body.date + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
    : moment.tz('Europe/Paris').startOf('day').toDate();

  const dateF = req.body.datef
    ? moment.tz(req.body.datef + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
    : moment.tz('Europe/Paris').startOf('day').toDate();

  const dateSimple = moment.tz(dateJ, "Europe/Paris").format('YYYY-MM-DD');
  const dateSimpleFin = moment.tz(dateF, "Europe/Paris").format('YYYY-MM-DD');

  let heureTravail = 0;
  const pause = parseInt(req.body.pause) || 0;

  if (dateSimpleFin === dateSimple) {
    const heureDebut = req.body.heure.split(':');
    const heureFin = req.body.heuref.split(':');
    heureTravail = (parseInt(heureFin[0]) - parseInt(heureDebut[0]) - pause);
  } else {
    const heureDebut = req.body.heure.split(':');
    const heureFin = req.body.heuref.split(':');
    heureTravail = (24 - parseInt(heureDebut[0])) + parseInt(heureFin[0]) - pause;
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
    qui: req.body.qui
  };

  try {
    const collection = db.collection('Users');

    await collection.updateOne(
      { _id: userId },
      { $push: { tasks: task } }
    );

    res.redirect('/?success=true');
  } catch (err) {
    console.error('Erreur lors de l\'ajout de la tâche :', err);
    res.status(500).send('Erreur lors de l\'ajout de la tâche');
  }
});



// // ROUTE POUR LA PAGE D'ACCUEIL
// app.get('/', async (req, res) => {
//   const user = req.session.user || "";
//   if (!user) {
//     return res.redirect('/login'); // Redirection si non connecté
//   }

//   const success = req.query.success === 'true';
//   const successCourse = req.query.successCourse === 'true';

//   try {
//     let salaire = 0;

//     const collection = db.collection(process.env.MONGODB_COLLECTION);
//     const collectionCourses = db.collection('Courses');

//     // ✅ Filtrer les tâches PAR UTILISATEUR
//     const tasks = await collection.find({ user: user }).sort({ date: 1 }).toArray();

//     const courses = await collectionCourses.find({}).toArray();
//     tasks.forEach(task => {
//       salaire += task.montant || 0;
//     });

//     res.render('index', {
//       title: 'Mon site',
//       message: 'Bienvenue sur ma montre digitale',
//       tasks: tasks || [],
//       courses: courses || [],
//       successCourse,
//       salaire,
//       success
//     });

//   } catch (err) {
//     console.error('Erreur lors de la récupération des tâches :', err);
//     res.status(500).send('Erreur lors de la récupération des tâches');
//   }
// });

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
app.delete('/delete-task/:id', async (req, res) => {
    const taskId = req.params.id;
    try {
        const collection = db.collection(process.env.MONGODB_COLLECTION);
        await collection.deleteOne({ _id: new ObjectId(taskId) });
        res.status(200).send('Tâche supprimée avec succès');
    } catch (err) {
        console.error('Erreur lors de la suppression de la tâche :', err);
        res.status(500).send('Erreur lors de la suppression de la tâche');
    }
});
