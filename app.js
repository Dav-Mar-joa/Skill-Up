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
// const sessionMiddleware = session({
//     secret: process.env.JWT_SECRET || 'default-secret',
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({
//         mongoUrl: process.env.MONGODB_URI,
//         dbName: 'SkilUp', // Nom de la base de données
//         collectionName: 'production', // Nom de la collection pour les sessions
//     }),
//     cookie: {
//         secure: false, // Mettre true en production avec HTTPS
//         maxAge: 30*24 * 60 * 60 * 1000, // Durée de vie des cookies (30 jour ici)
//     },
// });;
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    dbName: 'SkilUp',
    collectionName: 'production',
  }),
  cookie: {
    secure: false,              // true si HTTPS
    httpOnly: true,             // interdit l'accès JS au cookie
    maxAge: 30 * 24 * 60 * 60 * 1000  // 30 jours
  },
  rolling: true                 // <–– renouvelle maxAge à chaque requête
}));
app.use(express.json())
// app.use(sessionMiddleware);

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

app.locals.companyName = process.env.COMPANY_NAME

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

// app.get('/login', async (req, res) => {
//         res.render('login');
// });

app.get('/login', (req, res) => {
  if (req.session.user && req.session.user.isAdmin === "y") {
    return res.redirect('/admin');
  }
  res.render('login');
});
// Affichage du form de création de chantier
// app.get('/createChantier', async (req, res) => {
//   try {
//     // Récupère tous les ouvriers/admin de ta collection UsersAdmin
//     const usersAdmin = await db
//       .collection('UsersAdmin')
//       .find({})
//       .sort({ username: 1 })
//       .toArray();

//     // Envoie-les à Pug
//     res.render('createChantier', { usersAdmin });
//   } catch (err) {
//     console.error('Erreur en récupérant UsersAdmin :', err);
//     res.status(500).send('Erreur serveur');
//   }
// });
// app.post('/createChantier', async (req, res) => {
//         res.render('createChantier');
// });

// app.get('/admin', async (req, res) => {
//         res.render('admin');
// });

app.get('/admin', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const userId = new ObjectId(req.session.user._id);
  const user = await db.collection('UsersAdmin').findOne({ _id: userId });

  if (!user || user.isAdmin !== "y") {
    return res.redirect('/');
  }

  res.render('admin');
});
// app.post('/login', async (req, res) => {
//     const { username, password } = req.body;
//     console.log("username:", username);
//     console.log("req.session.user:", req.session.user);
//   //   if (!req.session.user) {
//   //   return res.redirect('/login');
//   // }
      
//     try {
//         const collection = db.collection('UsersAdmin');
//         const userLogged = await collection.findOne({ username });
//         // console.log('collection:', collection);
//         console.log('userLogged:', userLogged);

//         if(userLogged.secretQuestion===""){
//             res.redirect("/login") 
//         }

//         // Vérifier si l'utilisateur existe
//         if (!userLogged.username) {
//             res.redirect("/login") 
//         }
//         // if (userLogged.isLoggedIn) {
//         //     return res.render('login', { message: "Ce compte est déjà connecté ailleurs." });
//         // }

//         // Vérifier si le mot de passe correspond au hash stocké
//         const isMatch = await bcrypt.compare(password, userLogged.password);
//         console.log("isMatch:", isMatch);
//         if (!isMatch) {
//             return res.render('login', { message: "Login ou mot de passe erroné !" });
//         }

//         await collection.updateOne(
//             { _id: userLogged._id },
//             { $set: { isLoggedIn: true } }
//         );

//         // Création de la session utilisateur après authentification réussie
//         req.session.user = {
//             _id: userLogged._id,
//             username: userLogged.username,
//         };

//         // Redirection selon le rôle de l'utilisateur
//         if (userLogged.isAdmin === "y") {
//             console.log("Utilisateur admin connecté");
//             res.redirect("/admin")
//         } else {
//             console.log("Utilisateur connecté :", req.session.user.username);
//             console.log("Session utilisateur :", req.session.user);
//             res.redirect('/?success=true');
//                     }
//     } catch (err) {
//         console.error("Erreur lors de la connexion :", err);
//         res.status(500).send("Erreur lors de la connexion");
//     }
// });

// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   console.log("username:", username);
//   console.log("req.session.user:", req.session.user);

//   try {
//     const collection = db.collection('UsersAdmin');
//     const userLogged = await collection.findOne({ username });

//     console.log('userLogged:', userLogged);

//     // Vérifier si l'utilisateur existe
//     if (!userLogged) {
//       return res.render('login', { message: "Nom d'utilisateur ou mot de passe erroné !" });
//     }

//     // Vérifier la question secrète (exemple, sinon ajuste selon ton besoin)
//     if (userLogged.secretQuestion === "") {
//       return res.render('login', { message: "Nom d'utilisateur ou mot de passe erroné !" });
//     }

//     // Vérifier le mot de passe
//     const isMatch = await bcrypt.compare(password, userLogged.password);
//     console.log("isMatch:", isMatch);

//     if (!isMatch) {
//       return res.render('login', { message: "Nom d'utilisateur ou mot de passe erroné !" });
//     }

//     // Vérifier si déjà connecté ailleurs (si tu veux garder ça)
//     // if (userLogged.isLoggedIn) {
//     //   return res.render('login', { message: "Ce compte est déjà connecté ailleurs." });
//     // }

//     // Mettre à jour le statut
//     await collection.updateOne(
//       { _id: userLogged._id },
//       { $set: { isLoggedIn: true } }
//     );

//     // Créer la session
//     req.session.user = {
//       _id: userLogged._id,
//       username: userLogged.username,
//     };

//     // Rediriger selon le rôle
//     if (userLogged.isAdmin === "y") {
//       console.log("Utilisateur admin connecté");
//       return res.redirect("/admin");
//     } else {
//       console.log("Utilisateur connecté :", req.session.user.username);
//       console.log("Session utilisateur :", req.session.user);
//       return res.redirect('/?success=true');
//     }

//   } catch (err) {
//     console.error("Erreur lors de la connexion :", err);
//     res.status(500).send("Erreur lors de la connexion");
//   }
// });

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const collection = db.collection('UsersAdmin');
    const userLogged = await collection.findOne({ username });

    if (!userLogged) {
      return res.render('login', { message: "Nom d'utilisateur ou mot de passe erroné !" });
    }

    // Si pas encore de mdp, rediriger vers la complétion du profil
    if (!userLogged.password) {
      // Passe username dans query pour que le formulaire soit pré-rempli
      return res.redirect(`/completeProfile?username=${encodeURIComponent(username)}`);
    }

    // Vérifier mdp classique
    const isMatch = await bcrypt.compare(password, userLogged.password);

    if (!isMatch) {
      return res.render('login', { message: "Nom d'utilisateur ou mot de passe erroné !" });
    }

    await collection.updateOne({ _id: userLogged._id }, { $set: { isLoggedIn: true } });

    req.session.user = { _id: userLogged._id, username: userLogged.username };

    if (userLogged.isAdmin === "y") {
      return res.redirect("/admin");
    } else {
      return res.redirect('/?success=true');
    }
  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    res.status(500).send("Erreur lors de la connexion");
  }
});

app.get('/createUser', async (req, res) => {

    res.render('createUser');  } )

app.get('/loginMdpOublie', async (req, res) => {
    res.render('loginMdpOublie');  } )

app.get('/loginOublie', async (req, res) => {
    res.render('loginOublie');  } )

app.post('/loginOublie', async (req, res) => {
  const { secretQuestion, password,'reponse-secret-question': reponseSecretQuestion } = req.body;
  // console.log("secretQuestion:", secretQuestion);
  // console.log("password:", password);   

  try {
    const collection = db.collection('UsersAdmin');

    // Chercher tous les utilisateurs avec cette question secrète
    const users = await collection.find({ secretQuestion }).toArray();

    if (users.length === 0) {
      return res.render('loginOublie', { message: `Question secrete ou mot de passe incorrect !` });
    }

    // Parcourir les utilisateurs pour comparer le mot de passe hashé
    for (const user of users) {
      const match = await bcrypt.compare(password, user.password);
      if (match && user.reponseSecretQuestion === reponseSecretQuestion) {
        // Mot de passe correct, renvoyer le login
       return res.render('loginOublie', { message: `Votre login est : ${user.username}` });
      }
        
    }
    return res.render('loginOublie', { message: `Question secrete ou mot de passe incorrect !` });
    // // Aucun mot de passe ne correspond
    // res.status(400).send("Mot de passe incorrect");

  } catch (err) {
    console.error("Erreur serveur :", err);
    res.status(500).send("Erreur serveur");
  }
});

app.get('/mdpOublie', async (req, res) => {
    res.render('mdpOublie');  } )    

// app.post('/mdpnOublie', async (req, res) => {
//   const { secretQuestion, password, passwordConfirmed, username} = req.body;

//   if (password !=passwordConfirmed) {
//       return res.render('mpdOublie', { message: `Mots de passes ne sont pas identiques !` });
//     }
//   console.log("secretQuestion:", secretQuestion);
//   console.log("password:", password); 
//   console.log("passwordConfirmed:", passwordConfirmed);  
//   console.log("username:", username);
//   try {
//     const collection = db.collection('UsersAdmin');

//     // Chercher tous les utilisateurs avec cette question secrète
//     const user = await collection.findOne({ username,secretQuestion }).toArray();

//     if (user) {
//       await collection.updateOne(password, { $set: { password: await bcrypt.hash(password, 10) } });
//       return res.render('mdpOublie', { message: `Mot de passe changé !` });
//     }

//   } catch (err) {
//     console.error("Erreur serveur :", err);
//     res.status(500).send("Erreur serveur");
//   }
// });
    
app.post('/mdpOublie', async (req, res) => {
  const { secretQuestion, password, passwordConfirmed, username,'reponse-secret-question':reponseSecretQuestion } = req.body;

  if (password !== passwordConfirmed) {
    return res.render('mdpOublie', { message: `Les mots de passe ne sont pas identiques !` });
  }

  // console.log("secretQuestion:", secretQuestion);
  // console.log("password:", password);
  // console.log("passwordConfirmed:", passwordConfirmed);
  // console.log("username:", username);

  try {
    const collection = db.collection('UsersAdmin');

    // Chercher l'utilisateur unique avec username + question secrète
    const user = await collection.findOne({ username, secretQuestion });

    // if (!user && reponseSecretQuestion!=user.reponeseSecretQuestion) {
    //   return res.render('mdpOublie', { message: `Utilisateur ou question secrète incorrects !` });
    // }

    if (!user || reponseSecretQuestion !== user.reponseSecretQuestion) {
  return res.render('mdpOublie', { message: `Utilisateur ou réponse à la question secrète incorrecte !` });
}


    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour
    await collection.updateOne(
      { username, secretQuestion },
      { $set: { password: hashedPassword } }
    );

    return res.render('mdpOublie', { message: `Mot de passe changé !` });

  } catch (err) {
    console.error("Erreur serveur :", err);
    res.status(500).send("Erreur serveur");
  }
});

app.get('/completeProfile', async (req, res) => { 

  res.render('completeProfile');
});
// Affiche l'historique de TOUS les UsersAdmin
app.get('/historiqueOuvrierAll', async (req, res) => {
  try {
    const usersChantiers = await db.collection("UsersAdmin").find({}).toArray();

    // 1) Lire tous les UsersAdmin avec leurs tâches
    const usersAdmin = await db
      .collection('UsersAdmin')
      .find({})
      .sort({username: 1}) // Tri par nom d'utilisateur
      .toArray();
       // Pour chaque user, trier son tableau tasks par date croissante
      usersAdmin.forEach(user => {
        if (user.tasks && Array.isArray(user.tasks)) {
          user.tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
      });

      usersAdmin.forEach(user => {
    if (user.tasks) {
      user.tasks.forEach(task => {
        // Tous les ouvriers du chantier sauf le user courant
        const autres = usersChantiers
          .filter(u => u.tasks?.length)
          .filter(u => 
            u.tasks.some(t2 => t2.id_Chantier?.toString() === task.id_Chantier?.toString())
          )
          .map(u => u.username)
          .sort((a, b) => a.localeCompare(b));

        // Évite les doublons
        task.autresOuvriers = [...new Set(autres)];

        // console.log("Task enrichie :", {
        //   username: user.username,
        //   taskId: task._id.toString(),
        //   chantierId: task.id_Chantier?.toString(),
        //   autresOuvriers: task.autresOuvriers
        // });
      });
    }
  });
    const allUsers = await db
      .collection('UsersAdmin')
      .find({})
      .sort({username: 1}) // Tri par nom d'utilisateur
      .toArray();  
    // console.log('usersAdmin:', usersAdmin);
    // 2) Rendre la vue en passant la liste
    res.render('historiqueOuvrier', { usersAdmin,allUsers });
  } catch (err) {
    console.error('Erreur récupération historique ouvriers :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/historiqueOuvrier', async (req, res) => {
  // console.log("sans filtre");
  try {
    // Calculer le mois en cours
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const usersChantiers = await db.collection("UsersAdmin").find({}).toArray();

    // Pipeline aggregation pour le mois en cours
    const pipeline = [
      {
        $addFields: {
          tasks: {
            $filter: {
              input: "$tasks",
              as: "task",
              cond: {
                $and: [
                  { $gte: ["$$task.date", startDate] },
                  { $lt: ["$$task.date", endDate] }
                ]
              }
            }
          }
        }
      },
      {
        $match: {
          "tasks.0": { $exists: true }
        }
      },
      { $sort: { username: 1 } }
    ];
    const allUsers = await db
      .collection('UsersAdmin')
      .find({})
      .sort({username: 1}) // Tri par nom d'utilisateur
      .toArray();
    const usersAdmin = await db.collection('UsersAdmin').aggregate(pipeline).toArray();

    usersAdmin.forEach(user => {
    if (user.tasks) {
      user.tasks.forEach(task => {
        // Tous les ouvriers du chantier sauf le user courant
        const autres = usersChantiers
          .filter(u => u.tasks?.length)
          .filter(u => 
            u.tasks.some(t2 => t2.id_Chantier?.toString() === task.id_Chantier?.toString())
          )
          .map(u => u.username)
          .sort((a, b) => a.localeCompare(b));

        // Évite les doublons
        task.autresOuvriers = [...new Set(autres)];

        // console.log("Task enrichie :", {
        //   username: user.username,
        //   taskId: task._id.toString(),
        //   chantierId: task.id_Chantier?.toString(),
        //   autresOuvriers: task.autresOuvriers
        // });
      });
    }
  });
    // usersAdmin.forEach(user => {
    //   if (user.tasks) {
    //     user.tasks.forEach(task => {
    //       const autres = usersChantiers
    //         .filter(u => u._id.toString() !== user._id.toString() && u.tasks)
    //         .flatMap(u =>
    //           u.tasks
    //             .filter(t2 => t2.id_Chantier?.toString() === task.id_Chantier?.toString())
    //             .map(() => u.username)
    //         );

    //       task.autresOuvriers = [...new Set(autres)];

    //       console.log("Task enrichie :", {
    //         username: user.username,
    //         taskId: task._id.toString(),
    //         chantierId: task.id_Chantier?.toString(),
    //         autresOuvriers: task.autresOuvriers
    //       });
    //     });
    //   }
    // });

    // Tri final
    usersAdmin.forEach(user => {
    if (user.tasks) {
      user.tasks.forEach(task => {
        // Tous les ouvriers du chantier sauf le user courant
        const autres = usersChantiers
          .filter(u => u.tasks?.length)
          .filter(u => 
            u.tasks.some(t2 => t2.id_Chantier?.toString() === task.id_Chantier?.toString())
          )
          .map(u => u.username);

        // Évite les doublons
        task.autresOuvriers = [...new Set(autres)];

        // console.log("Task enrichie :", {
        //   username: user.username,
        //   taskId: task._id.toString(),
        //   chantierId: task.id_Chantier?.toString(),
        //   autresOuvriers: task.autresOuvriers
        // });
      });
    }
  });

    
    usersAdmin.forEach(user => {
      if (user.tasks && Array.isArray(user.tasks)) {
        user.tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    });

    res.render('historiqueOuvrier', { usersAdmin,allUsers });
  } catch (err) {
    console.error('Erreur récupération historique ouvriers :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.post('/historiqueOuvrier', async (req, res) => {
  try {
    const { username, mois } = req.body;
    const usersChantiers = await db.collection("UsersAdmin").find({}).toArray();


    // Filtre de base
    const userFilter = {};
    if (username && username.trim() !== '') {
      userFilter.username = username.trim();
    }

    // Filtre sur les tâches
    let startDate, endDate;
    if (mois && mois.trim() !== '') {
      const [year, month] = mois.split('-');
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 1);
    }

    // Pipeline
    const pipeline = [
      { $match: userFilter } // filtre sur le username si fourni
    ];

    if (startDate && endDate) {
      pipeline.push({
        $addFields: {
          tasks: {
            $filter: {
              input: "$tasks",
              as: "task",
              cond: { 
                $and: [
                  { $gte: ["$$task.date", startDate] },
                  { $lt: ["$$task.date", endDate] }
                ]
              }
            }
          }
        }
      });
      // Ne garder que les utilisateurs qui ont au moins une tâche dans cette période
      pipeline.push({
        $match: { "tasks.0": { $exists: true } }
      });
    }

    // Tri
    pipeline.push({ $sort: { username: 1 } });

    const usersAdmin = await db.collection('UsersAdmin').aggregate(pipeline).toArray();

    usersAdmin.forEach(user => {
    if (user.tasks) {
      user.tasks.forEach(task => {
        // Tous les ouvriers du chantier sauf le user courant
        const autres = usersChantiers
          .filter(u => u.tasks?.length)
          .filter(u => 
            u.tasks.some(t2 => t2.id_Chantier?.toString() === task.id_Chantier?.toString())
          )
          .map(u => u.username)
          .sort((a, b) => a.localeCompare(b));

        // Évite les doublons
        task.autresOuvriers = [...new Set(autres)];

        // console.log("Task enrichie :", {
        //   username: user.username,
        //   taskId: task._id.toString(),
        //   chantierId: task.id_Chantier?.toString(),
        //   autresOuvriers: task.autresOuvriers
        // });
      });
    }
  });
    const allUsers = await db.collection('UsersAdmin').find({}).sort({ username: 1 }).toArray();

    res.render('historiqueOuvrier', { usersAdmin, allUsers });

  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// app.post('/historiqueOuvrier', async (req, res) => {
//   try {
//     const { username, mois, jour } = req.body;

//     // Construire le filtre utilisateur de base (username)
//     const userFilter = {};
//     if (username && username.trim() !== '') {
//       userFilter.username = username.trim();
//     }

//     // Construire la plage de date en ISODate pour filtrer tasks
//     let startDate, endDate;
//     if (mois && mois.trim() !== '') {
//       const [year, month] = mois.split('-');
//       startDate = new Date(year, month - 1, 1);
//       endDate = new Date(year, month, 1);
//     } else if (jour && jour.trim() !== '') {
//       startDate = new Date(jour);
//       endDate = new Date(jour);
//       endDate.setDate(endDate.getDate() + 1);
//     }

//     // Pipeline aggregation
//     const pipeline = [
//       { $match: userFilter }
//     ];

//     if (startDate && endDate) {
//       pipeline.push({
//         $addFields: {
//           tasks: {
//             $filter: {
//               input: "$tasks",
//               as: "task",
//               cond: {
//                 $and: [
//                   { $gte: ["$$task.date", startDate] },
//                   { $lt: ["$$task.date", endDate] }
//                 ]
//               }
//             }
//           }
//         }
//       });
//       // Ne garder que les utilisateurs qui ont au moins une tâche dans cette période
//       pipeline.push({
//         $match: {
//           "tasks.0": { $exists: true }
//         }
//       });
//     }

//     // Trier par username
//     pipeline.push({ $sort: { username: 1 } });

//     // Exécuter aggregation
//     const usersAdmin = await db.collection('UsersAdmin').aggregate(pipeline).toArray();

//     // Trier les tâches au cas où (pas forcément utile)
//     usersAdmin.forEach(user => {
//       if (user.tasks && Array.isArray(user.tasks)) {
//         user.tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
//       }
//     });
//     const allUsers = await db
//       .collection('UsersAdmin')
//       .find({})
//       .sort({username: 1}) // Tri par nom d'utilisateur
//       .toArray(); 

//     res.render('historiqueOuvrier', { usersAdmin, allUsers });
//   } catch (err) {
//     console.error('Erreur récupération historique ouvriers :', err);
//     res.status(500).send('Erreur serveur');
//   }
// });




// POST : filtrer selon le mois choisi
// app.post('/payementOuvrier', async (req, res) => {
//   try {
//     const { mois } = req.body;

//     const [year, month] = mois.split('-');
//     const startDate = new Date(year, month - 1, 1);
//     const endDate = new Date(year, month, 1);

//     const pipeline = [
//       {
//         $addFields: {
//           tasks: {
//             $filter: {
//               input: "$tasks",
//               as: "task",
//               cond: { $and: [{ $gte: ["$$task.date", startDate] }, { $lt: ["$$task.date", endDate] }] }
//             }
//           }
//         }
//       },
//       { $match: { "tasks.0": { $exists: true } } },
//       { $sort: { username: 1 } }
//     ];

//     const usersAdmin = await db.collection('UsersAdmin').aggregate(pipeline).toArray();

//     let montantTotalGeneral = 0;
//     usersAdmin.forEach(user => {
//       if (user.tasks && Array.isArray(user.tasks)) {
//         user.tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
//         user.totalMontant = user.tasks.reduce((acc, t) => acc + Number(t.montant || 0), 0);
//         montantTotalGeneral += user.totalMontant;
//       }
//     });

//     res.render('payementOuvrier', { usersAdmin, montantTotalGeneral, moisActuel: mois });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Erreur serveur');
//   }
// });


// ------------------------

app.get('/payementOuvrier', async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const pipeline = [
      {
        $addFields: {
          tasks: {
            $filter: {
              input: "$tasks",
              as: "task",
              cond: { $and: [{ $gte: ["$$task.date", startDate] }, { $lt: ["$$task.date", endDate] }] }
            }
          }
        }
      },
      { $match: { "tasks.0": { $exists: true } } },
      { $sort: { username: 1 } }
    ];

    const usersAdmin = await db.collection('UsersAdmin').aggregate(pipeline).toArray();

    let montantTotalGeneral = 0;
    usersAdmin.forEach(user => {
      if (user.tasks && Array.isArray(user.tasks)) {
        user.tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
        user.totalMontant = user.tasks.reduce((acc, t) => acc + Number(t.montant || 0), 0);
        montantTotalGeneral += user.totalMontant;
      }
    });

    // transmettre aussi le mois actuel pour l'input
    const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    res.render('payementOuvrier', { usersAdmin, montantTotalGeneral, moisActuel });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

app.post('/payementOuvrier', async (req, res) => {
  try {
    const { userId, mois } = req.body;
    const ObjectId = require('mongodb').ObjectId;

    // --- Si userId est présent, c'est un toggle d'état isPayed ---
    if (userId) {
      const user = await db.collection('UsersAdmin').findOne({ _id: new ObjectId(userId) });
      if (!user) return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });

      const newPayedState = user.isPayed === "y" ? "n" : "y";

      await db.collection('UsersAdmin').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isPayed: newPayedState } }
      );

      return res.json({ success: true, newPayedState });
    }

    // --- Sinon, filtrage par mois pour affichage page ---
    const now = new Date();
    const [year, month] = mois ? mois.split('-') : [now.getFullYear(), now.getMonth() + 1];
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const pipeline = [
      {
        $addFields: {
          tasks: {
            $filter: {
              input: "$tasks",
              as: "task",
              cond: { $and: [{ $gte: ["$$task.date", startDate] }, { $lt: ["$$task.date", endDate] }] }
            }
          }
        }
      },
      { $match: { "tasks.0": { $exists: true } } },
      { $sort: { username: 1 } }
    ];

    const usersAdmin = await db.collection('UsersAdmin').aggregate(pipeline).toArray();

    let montantTotalGeneral = 0;
    usersAdmin.forEach(user => {
      if (user.tasks && Array.isArray(user.tasks)) {
        user.tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
        user.totalMontant = user.tasks.reduce((acc, t) => acc + Number(t.montant || 0), 0);
        montantTotalGeneral += user.totalMontant;
      }
    });

    res.render('payementOuvrier', { usersAdmin, montantTotalGeneral, moisActuel: `${year}-${String(month).padStart(2,'0')}` });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// Route pour remettre à zéro tous les paiements
app.post('/refresh', async (req, res) => {
  try {
    // Met à jour tous les utilisateurs (sauf Admin) pour remettre isPayed à "n"
    const result = await db.collection('UsersAdmin').updateMany(
      { username: { $ne: "Admin" } }, // on exclut l'admin
      { $set: { isPayed: "n" } }
    );

    // console.log(`Paiements remis à zéro pour ${result.modifiedCount} utilisateurs`);
    
    // Redirige vers la page de paiement pour voir les changements
    res.redirect('/payementOuvrier');
  } catch (err) {
    console.error("Erreur lors de la remise à zéro des paiements :", err);
    res.status(500).send("Erreur serveur");
  }
});

// ------------------------

// app.post('/payementOuvrier', async (req, res) => {
//   try {
//     const { username, mois, jour } = req.body;
//     const { userId, taskId } = req.body;
//      if (!userId || !taskId) return res.status(400).send('Paramètres manquants');
    
//     // Construire le filtre utilisateur de base (username)
//     const userFilter = {};
//     if (username && username.trim() !== '') {
//       userFilter.username = username.trim();
//     }

//     // Construire la plage de date en ISODate pour filtrer tasks
//     let startDate, endDate;
//     if (mois && mois.trim() !== '') {
//       const [year, month] = mois.split('-');
//       startDate = new Date(year, month - 1, 1);
//       endDate = new Date(year, month, 1);
//     } else if (jour && jour.trim() !== '') {
//       startDate = new Date(jour);
//       endDate = new Date(jour);
//       endDate.setDate(endDate.getDate() + 1);
//     }

//     // Pipeline aggregation
//     const pipeline = [
//       { $match: userFilter }
//     ];

//     if (startDate && endDate) {
//       pipeline.push({
//         $addFields: {
//           tasks: {
//             $filter: {
//               input: "$tasks",
//               as: "task",
//               cond: {
//                 $and: [
//                   { $gte: ["$$task.date", startDate] },
//                   { $lt: ["$$task.date", endDate] }
//                 ]
//               }
//             }
//           }
//         }
//       });
//       // Ne garder que les utilisateurs qui ont au moins une tâche dans cette période
//       pipeline.push({
//         $match: {
//           "tasks.0": { $exists: true }
//         }
//       });
//     }

//     // Trier par username
//     pipeline.push({ $sort: { username: 1 } });

//     // Exécuter aggregation
//     const usersAdmin = await db.collection('UsersAdmin').aggregate(pipeline).toArray();

//     // Trier les tâches au cas où (pas forcément utile)
//     usersAdmin.forEach(user => {
//       if (user.tasks && Array.isArray(user.tasks)) {
//         user.tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
//       }
//     });

//     res.render('payementOuvrier', { usersAdmin });
//   } catch (err) {
//     console.error('Erreur récupération historique ouvriers :', err);
//     res.status(500).send('Erreur serveur');
//   }
// });

app.get('/createOuvrier', async (req, res) => {

    res.render('createOuvrier');  } ) 

app.get('/adminOuvriers', async (req, res) => {

    res.render('adminOuvriers');  } )
   

app.post('/createOuvrier', async (req, res) => {
  let { username, taux } = req.body;
  username = username.trim()
    // console.log("Username:", username); 
    // console.log("taux", taux); 
  const isAdmin = "n"
  const isPayed = "n"                  

  try {
    const usersCollection = db.collection('UsersAdmin');
    // const existingUser = await usersCollection.findOne({ username });

    // if (existingUser) {
    //   // On renvoie la page avec un message d'erreur
    //   return res.render('createUser', { errorMessage: 'Nom d\'utilisateur déjà utilisé.' });
    // }

    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      username,
      taux,
      isAdmin,
      isPayed
    };

    await usersCollection.insertOne(user);

    res.redirect('/admin'); // ou vers la page principale directement
  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur :', err);
    res.status(500).send('Erreur lors de la création de l\'utilisateur');
  }
}); 

app.get('/updateOuvrier', async (req, res) => {

    try {
    // 1) Lire tous les UsersAdmin avec leurs tâches
    const usersAdmin = await db
      .collection('UsersAdmin')
      .find({ isAdmin: { $ne: "y" } })
      .toArray();
    // console.log('usersAdmin:', usersAdmin);
    // 2) Rendre la vue en passant la liste
    res.render('updateOuvrier', { usersAdmin });
  } catch (err) {
    console.error('Erreur récupération historique ouvriers :', err);
    res.status(500).send('Erreur serveur');
  }  } ) 
app.get('/listeOuvrier', async (req, res) => {

    try {
    // 1) Lire tous les UsersAdmin avec leurs tâches
    const usersAdmin = await db
      .collection('UsersAdmin')
      .find({ isAdmin: { $ne: "y" } })
      .sort({ username: 1 })
      .toArray();
    // console.log('usersAdmin:', usersAdmin);
    // 2) Rendre la vue en passant la liste
    res.render('listeOuvrier', { usersAdmin });
  } catch (err) {
    console.error('Erreur récupération historique ouvriers :', err);
    res.status(500).send('Erreur serveur');
  }  } )
app.post('/updateOuvrier', async (req, res) => {
  const { username, taux } = req.body;
    // console.log("Username:", username); 
    // console.log("taux", taux);                 
  try {
    const usersCollection = db.collection('UsersAdmin');
    // const existingUser = await usersCollection.findOne({ username });

    // if (existingUser) {
    //   // On renvoie la page avec un message d'erreur
    //   return res.render('createUser', { errorMessage: 'Nom d\'utilisateur déjà utilisé.' });
    // }

    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      username,
      taux
    };

    await usersCollection.updateOne(
      { username: username },
      { $set: { taux: taux } }
    );

    res.redirect('/admin'); // ou vers la page principale directement
  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur :', err);
    res.status(500).send('Erreur lors de la création de l\'utilisateur');
  }
});

app.get('/deleteOuvrier', async (req, res) => {

    try {
    // 1) Lire tous les UsersAdmin avec leurs tâches
    const usersAdmin = await db
      .collection('UsersAdmin')
      .find({ isAdmin: { $ne: "y" } })
      .sort({ username: 1 })
      .toArray();
    // console.log('usersAdmin:', usersAdmin);
    // 2) Rendre la vue en passant la liste
    res.render('deleteOuvrier', { usersAdmin });
  } catch (err) {
    console.error('Erreur récupération historique ouvriers :', err);
    res.status(500).send('Erreur serveur');
  }  } ) 

app.post('/deleteOuvrier', async (req, res) => {
  const { username } = req.body;
    // console.log("Username:", username);                 
  try {
    const usersCollection = db.collection('UsersAdmin');
    // const existingUser = await usersCollection.findOne({ username });

    // if (existingUser) {
    //   // On renvoie la page avec un message d'erreur
    //   return res.render('createUser', { errorMessage: 'Nom d\'utilisateur déjà utilisé.' });
    // }

    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      username,
    };

    await usersCollection.deleteOne(
      { username: username },
    );

    res.redirect('/admin'); // ou vers la page principale directement
  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur :', err);
    res.status(500).send('Erreur lors de la création de l\'utilisateur');
  }
});
   
app.get('/createChantier', async (req, res) => {
  try {
    // Va chercher tous les admins (chefs + ouvriers)
    const usersAdmin = await db
      .collection('UsersAdmin')
      .find({ isAdmin: { $ne: "y" } })
      .toArray();

    // Passe-les à la vue
    res.render('createChantier', { usersAdmin, success: req.query.success });
  } catch (err) {
    console.error('Erreur lors du chargement des utilisateurs admin :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.post('/createChantier', async (req, res) => {
  try {
    // 1) Récupération des champs du formulaire
    const { task, pause, date, heure, datef, heuref, qui,repas,atelier20Point12,skilUp} = req.body;
    let ouvriers = req.body['ouvriers[]'] || req.body.ouvriers; 
    // si un seul ouvrier, Express renvoie une string, sinon un tableau
    if (!Array.isArray(ouvriers)) ouvriers = [ouvriers];

    // 2) Calcul des dates
    const dateJ = moment.tz(date + ' ' + heure, 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate();
    const dateF = moment.tz(datef + ' ' + heuref, 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate();
    const start = moment(dateJ), end = moment(dateF);
    // 3) Différence en heures – pause
    let diffHours = end.diff(start, 'hours');
    diffHours = diffHours < 0 ? diffHours + 24 : diffHours;  // si tranche sur nuit
    diffHours -= parseInt(pause) || 0;
    const id_Chantier = new ObjectId(); // id unique pour le chantier
    // 4) Récupérer en base le chef + ouvriers pour connaître leurs taux
    const col = db.collection('UsersAdmin');
    const participants = await col.find({
      username: { $in: [qui, ...ouvriers] }
    }).toArray();

    // 5) Construire et injecter une tâche dans chaque document
    const ops = participants.map(u => {
      const montant = diffHours * (u.taux || 0);
      const t = {
        _id: new ObjectId(),    // id unique pour la sous‑tâche
        id_Chantier : id_Chantier, // lien vers le chantier
        task,
        date: dateJ,
        datef: dateF,
        heure,
        heuref,
        pause: parseInt(pause) || 0,
        heureTravail: diffHours,
        montant,
        taux: u.taux,
        qui,
        repas,
        atelier20Point12,
        skilUp
      };
      return {
        updateOne: {
          filter: { _id: u._id },
          update:  { $push: { tasks: t } }
        }
      };
    });

    // 6) Exécuter les mises à jour en bulk
    if (ops.length) {
      await col.bulkWrite(ops);
    }

    // 7) Redirection
    res.redirect('/admin');

  } catch (err) {
    console.error('Erreur création chantier & tâches :', err);
    res.status(500).send('Erreur serveur');
  }
});

// app.post("/chantier/:id/addOuvrier", async (req, res) => {
//   try {
//     const chantierId = req.params.id;
//     const { username } = req.body; // ouvrier à assigner

//     // récupérer le chantier (bloc mère)
//     const chantier = await db.collection("Chantiers").findOne({ _id: new ObjectId(chantierId) });
//     if (!chantier) return res.status(404).send("Chantier non trouvé");

//     // récupérer l’ouvrier
//     const user = await db.collection("UsersAdmin").findOne({ username });
//     if (!user) return res.status(404).send("Ouvrier non trouvé");

//     // construire la nouvelle task
//     const newTask = {
//       _id: new ObjectId(),
//       id_Chantier: chantier._id,
//       task: chantier.nom, // ou "Hermés" etc.
//       date: chantier.dateDebut || new Date(),
//       datef: chantier.dateFin || null,
//       heure: chantier.heureDebut || null,
//       heuref: chantier.heureFin || null,
//       pause: 0,
//       heureTravail: 0,
//       montant: 0,
//       taux: user.taux,
//       qui: chantier.chef || null,
//       repas: null,
//       atelier20Point12: null,
//       skilUp: null,
//       taxiRefund: 0
//     };

//     // pousser la tâche dans le user
//     await db.collection("UsersAdmin").updateOne(
//       { username },
//       { $push: { tasks: newTask } }
//     );

//     res.redirect(`/chantier/${chantierId}`);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Erreur lors de l’assignation de l’ouvrier");
//   }
// });

// app.post('/add-user-to-task', async (req, res) => {
//   const { taskId, userId } = req.body;

//   if (!taskId || !userId) return res.status(400).json({ success: false, message: "Paramètres manquants" });

//   try {
//     const task = await Task.findById(taskId);
//     if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée" });

//     if (!task.ouvriers) task.ouvriers = [];
//     if (!task.ouvriers.includes(userId)) task.ouvriers.push(userId);

//     await task.save();

//     const user = await User.findById(userId);

//     res.json({ success: true, message: "Utilisateur ajouté", user, task });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Erreur serveur" });
//   }
// });app.post('/add-user-to-task', async (req, res) => {
//   const { taskId, userId } = req.body;

//   if (!taskId || !userId) return res.status(400).json({ success: false, message: "Paramètres manquants" });

//   try {
//     const task = await Task.findById(taskId);
//     if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée" });

//     if (!task.ouvriers) task.ouvriers = [];
//     if (!task.ouvriers.includes(userId)) task.ouvriers.push(userId);

//     await task.save();

//     const user = await User.findById(userId);

//     res.json({ success: true, message: "Utilisateur ajouté", user, task });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Erreur serveur" });
//   }
// });
// app.get("/historiqueOuvrier", async (req, res) => {
//   try {
//     const usersAdmin = await usersCollection.find().toArray();
//     const allUsers = await usersCollection.find().toArray(); // 👈 pareil mais clair
//     console.log("allUsers:", allUsers);
//     console.log("useersAdmon:", usersAdmin);    

//     res.render("historiqueOuvrier", { usersAdmin, allUsers });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Erreur serveur");
//   }
// });

app.get("/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const userWithTask = await db.collection('UsersAdmin').findOne(
    { "tasks._id": new ObjectId(taskId) },
    { "tasks.$": 1 }
  );
  const allUsers = await db.collection('UsersAdmin').find().toArray();

  res.render("taskDetails", { task: userWithTask.tasks[0], allUsers });
});

// app.post("/add-user-to-task/:taskId", async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const { userId } = req.body;

//     console.log("taskId:", taskId);
//     console.log("userId:", userId);

//     // récupérer la task existante
//     const userWithTask = await db.collection('UsersAdmin').findOne({ "tasks._id": new ObjectId(taskId) }, { "tasks.$": 1 });
//     if (!userWithTask || !userWithTask.tasks || !userWithTask.tasks[0]) {
//       return res.status(404).json({ error: "Task introuvable" });
//     }

//     const task = userWithTask.tasks[0];
//     console.log("task:", task);

//     // créer une copie pour le nouvel ouvrier
//     const newTask = {
//       ...task,
//       _id: new ObjectId(),   // nouveau _id
//       qui: await getUserNameById(userId) // nom du nouvel ouvrier
//     };

//     // insérer la task dans le bon user
//     await db.collection('UsersAdmin').updateOne(
//       { _id: new ObjectId(userId) },
//       { $push: { tasks: newTask } }
//     );

//     res.json(newTask);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Erreur serveur" });
//   }
// });

app.post("/add-user-to-task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    
    const dataUserAjout = await db.collection('UsersAdmin').findOne({ _id: new ObjectId(userId) });

    // Récupérer la tâche exacte via son _id
    const userWithTask = await db.collection('UsersAdmin').findOne(
      { "tasks._id": new ObjectId(taskId) },
      { projection: { "tasks.$": 1 } }
    );
    console.log("userWithTask:", userWithTask);

    if (!userWithTask || !userWithTask.tasks || !userWithTask.tasks[0]) {
      return res.status(404).json({ error: "Tâche introuvable" });
    }

    const task = userWithTask.tasks[0];

    const taux = parseFloat(dataUserAjout.taux) || 0;
    console.log("taux:", taux);
    const montant = task.heureTravail*taux || 0;
    console.log("montant:", montant);

    // Copier la tâche en changeant seulement l'ID et le nom de l'ouvrier
    const newTask = {
      ...task,
      _id: new ObjectId(),         // nouveau _id
      qui: task.qui, // nom du nouvel ouvrier
      taux: taux,
      montant: montant,
      taxiRefund:0
    };

    // Ajouter la tâche au nouvel ouvrier
    await db.collection('UsersAdmin').updateOne(
      { _id: new ObjectId(userId) },
      { $push: { tasks: newTask } }
    );

    res.json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


async function getUserNameById(userId) {
  try {
    const user = await db
      .collection("UsersAdmin")
      .findOne({ _id: new ObjectId(userId) });

    return user ? user.username : "Utilisateur inconnu";
  } catch (err) {
    console.error("Erreur getUserNameById:", err);
    return "Erreur utilisateur";
  }
}


app.post('/completeProfile', async (req, res) => {
  const { username, mdp: password,mdpConfirmed: passwordConfirmed, 'secret-question': secretQuestion,'reponse-secret-question':reponseSecretQuestion } = req.body;

  if (password !== passwordConfirmed) {
    return res.render('completeProfile', { errorMessage: 'Les mots de passe ne correspondent pas.' });
  }

  try {
    const col = db.collection('UsersAdmin');
    const user = await col.findOne({ username });

    if (!user) {
      return res.render('completeProfile', { errorMessage: 'Nom d\'utilisateur introuvable.' });
    }

    if (user.password) {
      return res.render('completeProfile', { errorMessage: 'Profil déjà complété.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await col.updateOne(
      { username },
      { $set: { password: hashedPassword, secretQuestion,reponseSecretQuestion } }
    );

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la complétion du profil');
  }
});

app.post('/createUser', async (req, res) => {
  const { username, mdp: password, 'secret-question': secretQuestion,'reponse-secret-question': reponseSecretQuestion } = req.body;
    // console.log("Username:", username);
    // console.log("Password:", password);  
    // console.log("secret-question", secretQuestion);                   
  try {
    const usersCollection = db.collection('UsersAdmin');
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
      reponseSecretQuestion,
      isAdmin:'n'
    };  

    await usersCollection.insertOne(user);

    res.redirect('/login'); // ou vers la page principale directement
  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur :', err);
    res.status(500).send('Erreur lors de la création de l\'utilisateur');
  }
}); 

// app.get('/', async (req, res) => {
//   const success = req.query.success === 'true';
//   const successCourse = req.query.successCourse === 'true';



//   if (!req.session.user) {
//     return res.redirect('/login');
//   }

//   try {
//     const userId = new ObjectId(req.session.user._id);

//     const collection = db.collection('UsersAdmin');
//     const user = await collection.findOne({ _id: userId });

//     if (!user) {
//       return res.redirect('/login');
//     }

//     const tasks = user.tasks || [];
//     let salaire = 0;
//     tasks.forEach(task => {
//       salaire += task.montant;
//     });
  

//     const collectionCourses = db.collection('Courses');
//     const courses = await collectionCourses.find({}).toArray();

//     res.render('index', {
//       title: 'Mon site',
//       message: 'Bienvenue sur ma montre digitale',
//       tasks,
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

app.get('/historiqueUserAll', async (req, res) => {
  const success = req.query.success === 'true';
  const successCourse = req.query.successCourse === 'true';

  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = new ObjectId(req.session.user._id);

    const collection = db.collection('UsersAdmin');
    const user = await collection.findOne({ _id: userId });

    if (!user) {
      return res.redirect('/login');
    }

    // ✅ Si c’est un admin → redirige vers /admin
    if (user.isAdmin === "y") {
      return res.redirect('/admin');
    }

    // Sinon → c’est un user normal → on continue à afficher index
    const tasks = user.tasks || [];
    let salaire = 0;
    tasks.forEach(task => {
      salaire += task.montant;
    });
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    const collectionCourses = db.collection('Courses');
    const courses = await collectionCourses.find({}).toArray();

    res.render('index', {
      title: 'Mon site',
      message: 'Bienvenue sur ma montre digitale',
      tasks,
      courses: courses || [],
      successCourse,
      salaire,
      success,
      username:user.username
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des tâches :', err);
    res.status(500).send('Erreur lors de la récupération des tâches');
  }
});
app.get('/', async (req, res) => {
  const success = req.query.success === 'true';
  const successCourse = req.query.successCourse === 'true';

  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = new ObjectId(req.session.user._id);

    const collection = db.collection('UsersAdmin');
    const user = await collection.findOne({ _id: userId });

    if (!user) {
      return res.redirect('/login');
    }

    if (user.isAdmin === "y") {
      return res.redirect('/admin');
    }

    // Récupérer le mois et l'année actuels
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1; // JS: 0=Janvier

    // Filtrer les tâches du mois en cours
    const tasks = (user.tasks || []).filter(task => {
      const dateTask = new Date(task.date);
      return (
        dateTask.getUTCFullYear() === currentYear &&
        (dateTask.getUTCMonth() + 1) === currentMonth
      );
    });

    let salaire = 0;
    tasks.forEach(task => {
      salaire += task.montant;
    });
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    const collectionCourses = db.collection('Courses');
    const courses = await collectionCourses.find({}).toArray();

    res.render('index', {
      title: 'Mon site',
      message: 'Bienvenue sur ma montre digitale',
      tasks,
      courses: courses || [],
      successCourse,
      salaire,
      success,
      username:user.username
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des tâches :', err);
    res.status(500).send('Erreur lors de la récupération des tâches');
  }
});

app.post('/historiqueUser', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = new ObjectId(req.session.user._id);
    const collection = db.collection('UsersAdmin');
    const user = await collection.findOne({ _id: userId }).sort({ username: 1 });

    if (!user) {
      return res.redirect('/login');
    }

    // ✅ Vérifie si admin → redirige vers /admin
    if (user.isAdmin === "y") {
      return res.redirect('/admin');
    }

    const moisChoisi = req.body.mois; // format YYYY-MM
    if (!moisChoisi) {
      return res.redirect('/');
    }

    const [annee, mois] = moisChoisi.split('-').map(Number);

    const tasks = (user.tasks || []).filter(task => {
      const dateTask = new Date(task.date);
      return dateTask.getUTCFullYear() === annee && (dateTask.getUTCMonth() + 1) === mois;
    });

    let salaire = 0;
    tasks.forEach(task => {
      salaire += task.montant;
    });
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    const collectionCourses = db.collection('Courses');
    const courses = await collectionCourses.find({}).toArray();

    res.render('index', {
      title: 'Mon site',
      message: `Historique pour ${moisChoisi}`,
      tasks,
      courses: courses || [],
      success: false,
      successCourse: false,
      salaire,
      username: user.username
    });

  } catch (err) {
    console.error('Erreur lors de la récupération de l\'historique :', err);
    res.status(500).send('Erreur lors de la récupération de l\'historique');
  }
});

// ROUTE POST /
// app.post('/', async (req, res) => {
//   if (!req.session.user) {
//     return res.redirect('/login');
//   }
//   console.log("qui :", req.body.qui);
//   console.log("req.body:", req.body);
//   const userId = new ObjectId(req.session.user._id)

//   const dateJ = req.body.date
//     ? moment.tz(req.body.date + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
//     : moment.tz('Europe/Paris').startOf('day').toDate();

//   const dateF = req.body.datef
//     ? moment.tz(req.body.datef + ' 00:00', 'YYYY-MM-DD HH:mm', 'Europe/Paris').toDate()
//     : moment.tz('Europe/Paris').startOf('day').toDate();

//   const dateSimple = moment.tz(dateJ, "Europe/Paris").format('YYYY-MM-DD');
//   const dateSimpleFin = moment.tz(dateF, "Europe/Paris").format('YYYY-MM-DD');

//   let heureTravail = 0;
//   const pause = parseInt(req.body.pause) || 0;

//   if (dateSimpleFin === dateSimple) {
//     const heureDebut = req.body.heure.split(':');
//     const heureFin = req.body.heuref.split(':');
//     heureTravail = (parseInt(heureFin[0]) - parseInt(heureDebut[0]) - pause);
//   } else {
//     const heureDebut = req.body.heure.split(':');
//     const heureFin = req.body.heuref.split(':');
//     heureTravail = (24 - parseInt(heureDebut[0])) + parseInt(heureFin[0]) - pause;
//   }

//   const taux = parseInt(req.body.taux) || 0;
//   const montant = heureTravail * taux;

//   const task = {
//     _id: new ObjectId(),
//     name: req.body.task,
//     date: dateSimple,
//     datef: dateSimpleFin,
//     heure: req.body.heure,
//     heuref: req.body.heuref,
//     pause:pause,
//     heureTravail,
//     montant,
//     taux,
//     description: req.body.description,
//     priority: req.body.priority,
//     qui: req.body.qui
//   };

//   try {
//     const collection = db.collection('UsersAdmin');

//     await collection.updateOne(
//       { _id: userId },
//       { $push: { tasks: task } }
//     );

//     res.redirect('/?success=true');
//   } catch (err) {
//     console.error('Erreur lors de l\'ajout de la tâche :', err);
//     res.status(500).send('Erreur lors de l\'ajout de la tâche');
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
// app.delete('/delete-task/:id', async (req, res) => {
//     const taskId = req.params.id;
//     try {
//         const collection = db.collection(process.env.MONGODB_COLLECTION);
//         await collection.deleteOne({ _id: new ObjectId(taskId) });
//         res.status(200).send('Tâche supprimée avec succès');
//     } catch (err) {
//         console.error('Erreur lors de la suppression de la tâche :', err);
//         res.status(500).send('Erreur lors de la suppression de la tâche');
//     }
// });
// app.delete('/delete-task/:id', async (req, res) => {
//   const taskId = req.params.id;
//   console.log('ID de la tâche à supprimer:', taskId);

//   if (!ObjectId.isValid(taskId)) {
//     return res.status(400).send('ID invalide');
//   }

//   try {
//     const collection = db.collection('tasks'); // adapte le nom

//     const result = await collection.deleteOne({ _id: new ObjectId(taskId) });

//     if (result.deletedCount === 0) {
//       return res.status(404).send('Tâche non trouvée');
//     }

//     res.status(200).send('Tâche supprimée avec succès');
//   } catch (err) {
//     console.error('Erreur lors de la suppression de la tâche :', err);
//     res.status(500).send('Erreur lors de la suppression de la tâche');
//   }
// });

// app.delete('/delete-task/:id', async (req, res) => {
//   // 1) Récupère l’ID de la tâche à supprimer
//   const taskId = req.params.id;
//   if (!ObjectId.isValid(taskId)) {
//     return res.status(400).send('ID invalide');
//   }

//   // 2) Récupère l’ID de l’utilisateur connecté
//   if (!req.session.user) {
//     return res.status(401).send('Non authentifié');
//   }
//   const userId = new ObjectId(req.session.user._id);

//   try {
//     const users = db.collection('UsersAdmin');

//     // 3) Utilise $pull pour retirer la tâche du tableau
//     const result = await users.updateOne(
//       { _id: userId },
//       { $pull: { tasks: { _id: new ObjectId(taskId) } } }
//     );

//     if (result.modifiedCount === 0) {
//       return res.status(404).send('Tâche non trouvée');
//     }

//     res.status(200).send('Tâche supprimée avec succès');
//   } catch (err) {
//     console.error('Erreur lors de la suppression de la tâche :', err);
//     res.status(500).send('Erreur lors de la suppression de la tâche');
//   }
// });

app.delete('/delete-task/:id', async (req, res) => {
  try {
    const taskId = req.params.id;

    // Valide que taskId est bien une chaîne non vide
    if (!taskId) {
      return res.status(400).send('ID de tâche manquant');
    }
    const ObjectId = require('mongodb').ObjectId;
    const _id = new ObjectId(taskId);

    // Mise à jour MongoDB : retirer la tâche dans tous les documents users où elle se trouve
    const result = await db.collection('UsersAdmin').updateOne(
      { 'tasks._id': _id },
      { $pull: { tasks: { _id: _id } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send('Tâche non trouvée');
    }

    // res.status(200).send('Tâche supprimée');
    res.status(200).send('Tâche supprimée');
  } catch (error) {
    console.error('Erreur suppression tâche :', error);
    res.status(500).send('Erreur serveur lors de la suppression');
  }
});

app.put('/modify-task-hours/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const nouvelleHeureTravail = Number(req.body.nouvelleHeureTravail);
    // console.log("nouvelle heure : ", req.body);

    if (!taskId || isNaN(nouvelleHeureTravail)) {
      return res.status(400).send('Paramètres manquants ou heure invalide');
    }

    const ObjectId = require('mongodb').ObjectId;
    const _id = new ObjectId(taskId);

    // 1️⃣ Retrouver la tâche pour récupérer le taux
    const user = await db.collection('UsersAdmin').findOne({ 'tasks._id': _id }, { projection: { 'tasks.$': 1 } });

    if (!user || !user.tasks || user.tasks.length === 0) {
      return res.status(404).send('Tâche non trouvée');
    }

    const task = user.tasks[0];
    const taux = task.taux;
    const taxiRefund = task.taxiRefund || 0; // Récupérer le remboursement taxi s'il existe
    const nouveauMontant = nouvelleHeureTravail * taux + taxiRefund; // Calculer le nouveau montant

    // 2️⃣ Mettre à jour heureTravail ET montant
    const result = await db.collection('UsersAdmin').updateOne(
      { 'tasks._id': _id },
      {
        $set: {
          'tasks.$.heureTravail': nouvelleHeureTravail,
          'tasks.$.montant': nouveauMontant
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send('Tâche non trouvée ou inchangée');
    }

    res.status(200).json({
      nouvelleHeureTravail,
      nouveauMontant
    });

  } catch (error) {
    console.error('Erreur modification heureTravail :', error);
    res.status(500).send('Erreur serveur lors de la modification');
  }
});

// app.put('/add-taxi-refund/:id', async (req, res) => {
//   try {
//     const taskId = req.params.id;
//     const taxiRefund = Number(req.body.taxiRefund);

//     if (!taskId || isNaN(taxiRefund) || taxiRefund <= 0) {
//       return res.status(400).send('Paramètres manquants ou prix invalide');
//     }

//     const ObjectId = require('mongodb').ObjectId;
//     const _id = new ObjectId(taskId);

//     // Récupération de la tâche
//     const user = await db.collection('UsersAdmin').findOne({ 'tasks._id': _id }, { projection: { 'tasks.$': 1 } });

//     if (!user || !user.tasks || user.tasks.length === 0) {
//       return res.status(404).send('Tâche non trouvée');
//     }

//     const task = user.tasks[0];

//     // Calcul du nouveau montant : on ajoute le remboursement au montant actuel
//     const nouveauMontant = task.montant + taxiRefund;

//     // Mise à jour
//     const result = await db.collection('UsersAdmin').updateOne(
//       { 'tasks._id': _id },
//       {
//         $set: {
//           'tasks.$.montant': nouveauMontant
//         }
//       }
//     );

//     if (result.modifiedCount === 0) {
//       return res.status(404).send('Tâche non trouvée ou inchangée');
//     }

//     res.status(200).json({
//       taxiRefund,
//       nouveauMontant
//     });

//   } catch (error) {
//     console.error('Erreur ajout remboursement taxi :', error);
//     res.status(500).send('Erreur serveur lors du remboursement taxi');
//   }
// });
app.put('/add-taxi-refund/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const taxiRefund = Number(req.body.taxiRefund);

    if (!taskId || isNaN(taxiRefund) || taxiRefund < 0) {
      return res.status(400).send('Paramètres manquants ou prix invalide');
    }

    const ObjectId = require('mongodb').ObjectId;
    const _id = new ObjectId(taskId);

    // Récupération de la tâche
    const user = await db.collection('UsersAdmin').findOne({ 'tasks._id': _id }, { projection: { 'tasks.$': 1 } });

    if (!user || !user.tasks || user.tasks.length === 0) {
      return res.status(404).send('Tâche non trouvée');
    }

    const task = user.tasks[0];

    // Calcul du nouveau montant : on ajoute le remboursement taxi au montant actuel
    const nouveauMontant = (task.heureTravail)*parseFloat(task.taux) + taxiRefund;

    // Mise à jour montant ET taxiRefund
    const result = await db.collection('UsersAdmin').updateOne(
      { 'tasks._id': _id },
      {
        $set: {
          'tasks.$.montant': nouveauMontant,
          'tasks.$.taxiRefund': taxiRefund
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send('Tâche non trouvée ou inchangée');
    }

    res.status(200).json({
      taxiRefund,
      nouveauMontant
    });

  } catch (error) {
    console.error('Erreur ajout remboursement taxi :', error);
    res.status(500).send('Erreur serveur lors du remboursement taxi');
  }
});


// app.put('/modify-task-hours/:id', async (req, res) => {
//   try {
//     const taskId = req.params.id;
//     const nouvelleHeureTravail = Number( req.body.nouvelleHeureTravail);
//     console.log(nouvelleHeureTravail)

//     if (!taskId || nouvelleHeureTravail == null) {
//       return res.status(400).send('Paramètres manquants');
//     }

//     const ObjectId = require('mongodb').ObjectId;
//     const _id = new ObjectId(taskId);

//     const result = await db.collection('UsersAdmin').updateOne(
//       { 'tasks._id': _id },
//       { $set: { 'tasks.$.heureTravail': nouvelleHeureTravail } }
//     );

//     if (result.modifiedCount === 0) {
//       return res.status(404).send('Tâche non trouvée ou inchangée');
//     }

//     res.status(200).send('Heures de travail modifiées');
//   } catch (error) {
//     console.error('Erreur modification heureTravail :', error);
//     res.status(500).send('Erreur serveur lors de la modification');
//   }
// });

// app.put('/modify-task-hours/:id', async (req, res) => {
//   try {
//     const taskId = req.params.id;
//     const nouvelleHeureTravail = Number(req.body.nouvelleHeureTravail);
//     console.log("nouvelle heure : ",req.body)

//     if (!taskId || isNaN(nouvelleHeureTravail)) {
//       return res.status(400).send('Paramètres manquants ou heure invalide');
//     }

//     const ObjectId = require('mongodb').ObjectId;
//     const _id = new ObjectId(taskId);

//     const result = await db.collection('UsersAdmin').updateOne(
//       { 'tasks._id': _id },
//       { $set: { 'tasks.$.heureTravail': nouvelleHeureTravail } }
//     );

//     if (result.modifiedCount === 0) {
//       return res.status(404).send('Tâche non trouvée ou inchangée');
//     }

//     res.status(200).send('Heures de travail modifiées');
//   } catch (error) {
//     console.error('Erreur modification heureTravail :', error);
//     res.status(500).send('Erreur serveur lors de la modification');
//   }
// });



