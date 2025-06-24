const express = require('express');
const path = require('path');
require('dotenv').config();
const bodyParser = require('body-parser');
const moment = require('moment-timezone')
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

// Connexion à MongoDB
// const connectionString = `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`;
const connectionString = process.env.MONGODB_URI;
const client = new MongoClient(connectionString);
const dbName = process.env.MONGODB_DBNAME;

let db;

// async function connectDB() {
//     try {
//         await client.connect();
//         db = client.db(dbName);
//         console.log('Connecté à la base de données MongoDB');
//     } catch (err) {
//         console.error('Erreur de connexion à la base de données :', err);
//     }
// }

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

// Route pour soumettre des tâches
app.post('/', async (req, res) => {
    const dateJ = req.body.date 
        ? moment.tz(req.body.date, "Europe/Paris").toDate() 
        : moment.tz(new Date(), "Europe/Paris").toDate();
    const dateF = req.body.datef
        ? moment.tz(req.body.datef, "Europe/Paris").toDate() 
        : moment.tz(new Date(), "Europe/Paris").toDate(); 
        const dateSimple= moment.tz(dateJ, "Europe/Paris").format('YYYY-MM-DD'); 
        console.log("dateSimple:", dateSimple); 
        const dateSimpleFin= moment.tz(dateF, "Europe/Paris").format('YYYY-MM-DD'); 
        console.log("dateSimpleFin:", dateSimpleFin); 
        let heureTravail = 0; // Initialiser heureTravail à 0
    // Vérifier si la date de fin est le même jour que la date de début
        if(dateSimpleFin === dateSimple) {
        //    const heureTravail=req.body.heuref - req.body.heure; 
           const heureDebut=req.body.heure.split(':');
           const heureFin=req.body.heuref.split(':');
           heureTravail = (heureFin[0] - heureDebut[0]);
        //    console.log("type of heure debut:", typeof (req.body.heure));
        //    console.log("heure fin:", req.body.heuref);
           console.log("Heures de travail:", heureTravail);
        }
        else{
           const heureDebut=req.body.heure.split(':');
           const heureFin=req.body.heuref.split(':');
           heureTravail = (24 - parseInt(heureDebut[0])) + parseInt(heureFin[0]);
           console.log("Heures de travail:", heureTravail);
        }
        const taux = parseInt(req.body.taux) 
        const montant = heureTravail * taux; // Calcul du montant total
        console.log("montant",montant)
    const task = {
        name: req.body.task,
        date: dateJ,
        datef: dateF,
        heure: req.body.heure,
        montant: montant, // Ajouter le montant au document
        taux: req.body.taux,
        heuref: req.body.heuref,
        heureTravail: heureTravail,
        description: req.body.description,
        priority: req.body.priority,
        qui: req.body.qui
    };

    try {
        const collection = db.collection(process.env.MONGODB_COLLECTION);
        await collection.insertOne(task);
        res.redirect('/?success=true'); // Redirection avec un paramètre de succès
    } catch (err) {
        console.error('Erreur lors de l\'ajout de la tâche :', err);
        res.status(500).send('Erreur lors de l\'ajout de la tâche');
    }
});

app.post('/Courses', async (req, res) => {
    const course = {
        name: req.body.buy,
        priority2: req.body.priority2
    };

    try {
        const collection = db.collection('Courses'); // Utiliser la collection "courses"
        await collection.insertOne(course);
        res.redirect('/?successCourse=true'); // Redirection avec un paramètre de succès pour les courses
    } catch (err) {
        console.error('Erreur lors de l\'ajout de la course :', err);
        res.status(500).send('Erreur lors de l\'ajout de la course');
    }
});

// Route pour la page d'accueil
app.get('/', async (req, res) => {
    const success = req.query.success === 'true'; // Vérification du paramètre de succès
    const successCourse = req.query.successCourse === 'true';
     

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // console.log('Today:', today);
        // console.log('Tomorrow:', tomorrow);
        let salaire = 0;
        const collection = db.collection(process.env.MONGODB_COLLECTION);
        const collectionCourses = db.collection('Courses');
        const tasks = await collection.find({}).sort({ date: 1 }).toArray();
        const courses = await collectionCourses.find({}).toArray();
        tasks.forEach(task => {
        //   console.log('Original Date:', task.date.toString().slice(0, 10));
          salaire = salaire + task.montant; // Calcul du salaire total
        });

        res.render('index', { 
            title: 'Mon site', 
            message: 'Bienvenue sur ma montre digitale', 
            tasks: tasks || [], 
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
app.delete('/delete-course/:id', async (req, res) => {
    const courseId = req.params.id;
    try {
        const collection = db.collection('Courses');
        await collection.deleteOne({ _id: new ObjectId(courseId) });
        res.status(200).send('Course supprimée avec succès');
    } catch (err) {
        console.error('Erreur lors de la suppression de la course :', err);
        res.status(500).send('Erreur lors de la suppression de la course');
    }
})
// Démarrer le serveur sur le port spécifié dans .env ou sur 4000 par défaut
// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//     console.log(`Serveur démarré sur le port ${PORT}`);
// });
