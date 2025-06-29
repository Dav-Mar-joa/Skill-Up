document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("toggleHistorique");
    const historique = document.getElementById("historique");

    if (btn && historique) {
      btn.addEventListener("click", () => {
        historique.style.display = (historique.style.display === "none" || historique.style.display === "") ? "block" : "none";
      });
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("toggleTache");
    const tache= document.getElementById("tache");

    if (btn && tache) {
      btn.addEventListener("click", () => {
        tache.style.display = (tache.style.display === "none" || tache.style.display === "") ? "block" : "none";
      });
    }
  });

function affichageHeure(){
    let jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    let mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    let date = new Date()
    let hour = date.getHours()
    let min = date.getMinutes()
    let sec = date.getSeconds()
    let day = date.getDay()
    let numberDay = date.getDate()
    let month = date.getMonth()

    // console.log("date "+date)
    // console.log("heure "+hour)
    // console.log("min "+min)
    // console.log("sec "+sec)
    // console.log("day "+jours[day])
    // console.log("month "+month)
    // console.log("number Day "+numberDay)


    hour = hour < 10 ? '0' + hour : hour;
    min = min < 10 ? '0'+min : min;
    sec = sec < 10 ? '0' + sec : sec

    const clock = hour + ":" +min + ":" + sec
    const dateDay = jours[day] + " "+ numberDay + " " + mois[month]

    // console.log("clock"+ clock)
    const heure = document.getElementById("heure")
    heure.innerText = clock

    const dateJour = document.getElementById("dateJour")
    dateJour.innerText = dateDay
}

setInterval(() => {affichageHeure(); }, 1000)

// affichageHeure()

// function deleteTask(button) {
//     const taskElement = button.closest('.task');
//     const taskId = taskElement.getAttribute('data-task-id');
    
//     fetch(`/delete-task/${taskId}`, {
//         method: 'DELETE'
//     }).then(response => {
//         if (response.ok) {
//             taskElement.remove();  // Suppression de l'élément DOM après suppression réussie
//         }
//     }).catch(error => console.error('Erreur lors de la suppression de la tâche :', error));
// }



// function deleteTask(button) {
//     const taskElement = button.closest('.task');
//     const taskId = taskElement.getAttribute('data-task-id');
//     const montantElement = taskElement.querySelector('.heureTravail .test');

//     // Récupère le montant (en €) de la tâche supprimée
//     const montantMatch = montantElement?.innerText.match(/(\d+)\s?€/);
//     const montant = montantMatch ? parseInt(montantMatch[1]) : 0;

//     fetch(`/delete-task/${taskId}`, {
//         method: 'DELETE'
//     }).then(response => {
//         if (response.ok) {
//             taskElement.remove();

//             // Mettre à jour le salaire affiché
//             const salaireText = document.querySelector('.formDate p');
//             if (salaireText && montant) {
//                 const salaireMatch = salaireText.innerText.match(/(\d+)\s?€/);
//                 if (salaireMatch) {
//                     let currentSalaire = parseInt(salaireMatch[1]);
//                     let nouveauSalaire = currentSalaire - montant;
//                     salaireText.innerText = `Salaire : ${nouveauSalaire} €`;
//                 }
//             }
//         }
//     }).catch(error => console.error('Erreur lors de la suppression de la tâche :', error));
// }

// async function deleteTask(button) {
//   // Récupérer l'élément task parent qui contient l'attribut data-task-id
//   const taskElement = button.closest('.task');
//   const taskId = taskElement.getAttribute('data-task-id');

//   if (!taskId) {
//     alert("ID de la tâche introuvable !");
//     return;
//   }

//   // // Confirmation avant suppression
//   // if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
//   //   return;
//   // }

//   try {
//     const response = await fetch(`/delete-task/${taskId}`, {
//       method: 'DELETE',
//     });

//     if (response.ok) {
//       // Supprimer l'élément de la page sans recharger
//       taskElement.remove();
//       // alert("Tâche supprimée avec succès");
//     } else {
//       const text = await response.text();
//       // alert("Erreur lors de la suppression : " + text);
//     }
//   } catch (error) {
//     alert("Erreur réseau ou serveur : " + error.message);
//   }
// }

async function deleteTask(button) {
  // Récupérer l'élément task parent qui contient l'attribut data-task-id
  const taskElement = button.closest('.task');
  const taskId = taskElement.getAttribute('data-task-id');

  if (!taskId) {
    alert("ID de la tâche introuvable !");
    return;
  }

  // Récupérer le montant (en €) de la tâche supprimée
  // On part du principe que ton montant est dans .heureTravail .test au format "123€"
  const montantElement = taskElement.querySelector('.heureTravail .test');
  const montantMatch = montantElement?.innerText.match(/(\d+)\s?€/);
  const montant = montantMatch ? parseInt(montantMatch[1], 10) : 0;

  try {
    const response = await fetch(`/delete-task/${taskId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      // 1) Supprimer la tâche du DOM
      taskElement.remove();

      // 2) Mettre à jour le salaire affiché
      // On suppose que le salaire est dans un paragraphe par exemple <p class="salaire">Salaire : 400 €</p>
      const salaireTextElement = document.querySelector('.salaire');
      if (salaireTextElement && montant) {
        const salaireMatch = salaireTextElement.innerText.match(/(\d+)\s?€/);
        if (salaireMatch) {
          let currentSalaire = parseInt(salaireMatch[1], 10);
          const nouveauSalaire = currentSalaire - montant;
          salaireTextElement.innerText = `Salaire : ${nouveauSalaire} €`;
        }
      }

    } else {
      const text = await response.text();
      alert("Erreur lors de la suppression : " + text);
    }
  } catch (error) {
    alert("Erreur réseau ou serveur : " + error.message);
  }
}



function deleteCourse(button) {
    const courseElement = button.closest('.purchase-item');
    const courseId = courseElement.getAttribute('data-course-id');
    
    fetch(`/delete-course/${courseId}`, {
        method: 'DELETE'
    }).then(response => {
        if (response.ok) {
            courseElement.remove();
        }
    }).catch(error => console.error('Erreur lors de la suppression de la course :', error));
}