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
  const taskElement = button.closest('.item');
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
      window.location.href = '/historiqueOuvrier';
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

// async function modifyTask(button) {
//   const taskElement = button.closest('.item');
//   const taskId = taskElement.getAttribute('data-task-id');

//   if (!taskId) {
//     alert("ID de la tâche introuvable !");
//     return;
//   }

//   // Exemple : On récupère le montant ou les heures affichées
//   const montantElement = taskElement.querySelector('.heureTravail .test');
//   const montantText = montantElement?.innerText || "";
//   const montantMatch = montantText.match(/(\d+)\s?€/);
//   const montant = montantMatch ? parseInt(montantMatch[1], 10) : 0;

//   // Demander un nouveau montant à l'utilisateur
//   const nouveauMontant = prompt("Entrez le nouveau montant en € :", montant);
//   if (nouveauMontant === null) return; // Annulé

//   const nouveauMontantInt = parseInt(nouveauMontant, 10);
//   if (isNaN(nouveauMontantInt) || nouveauMontantInt < 0) {
//     alert("Montant invalide !");
//     return;
//   }

//   try {
//     const response = await fetch(`/modify-task/${taskId}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ nouveauMontant: nouveauMontantInt }),
//     });

//     if (response.ok) {
//       // Mettre à jour le montant affiché dans le DOM
//       montantElement.innerText = `${nouveauMontantInt}€`;
//       alert("Tâche mise à jour !");
//     } else {
//       const text = await response.text();
//       alert("Erreur lors de la modification : " + text);
//     }
//   } catch (error) {
//     alert("Erreur réseau ou serveur : " + error.message);
//   }
// }

// async function modifyTaskHours(button) {
//   const taskElement = button.closest('.item');
//   const selectElement = taskElement.querySelector('.select-hours');

//   // Affiche le select
//   selectElement.style.display = 'inline';

//   // Quand on change la valeur, on envoie direct
//   selectElement.addEventListener('change', async function () {
//     const taskId = taskElement.getAttribute('data-task-id');
//     const nouvelleHeureTravailInt = parseInt(selectElement.value, 10);

//     if (isNaN(nouvelleHeureTravailInt) || nouvelleHeureTravailInt < 0) {
//       alert("Nombre d'heures invalide !");
//       return;
//     }

//     try {
//       const response = await fetch(`/modify-task-hours/${taskId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ nouvelleHeureTravail: nouvelleHeureTravailInt }),
//       });

//       if (response.ok) {
//         const data = await response.json();

//         // Met à jour heureTravail
//         const heureTravailElement = taskElement.querySelector('.heureTravail .heures');
//         heureTravailElement.innerText = `${data.nouvelleHeureTravail}h`;

//         // Met à jour montant
//         const montantElement = taskElement.querySelector('.montant .item-text');
//         montantElement.innerText = `${data.nouveauMontant} €`;

//         alert("Heures et montant mis à jour !");
//       } else {
//         const text = await response.text();
//         alert("Erreur lors de la modification : " + text);
//       }
//     } catch (error) {
//       alert("Erreur réseau ou serveur : " + error.message);
//     } finally {
//       // Cache à nouveau le select
//       selectElement.style.display = 'none';
//     }
//   }, { once: true }); // Pour éviter plusieurs handlers
// }

// async function modifyTaskHours(button) {
//   const taskElement = button.closest('.item');
//   const selectElement = taskElement.querySelector('.select-hours');

//   selectElement.style.display = 'inline';

//   selectElement.addEventListener('change', async function () {
//     const taskId = taskElement.getAttribute('data-task-id');
//     const nouvelleHeureTravailInt = parseInt(selectElement.value, 10);

//     if (isNaN(nouvelleHeureTravailInt) || nouvelleHeureTravailInt < 0) {
//       alert("Nombre d'heures invalide !");
//       return;
//     }

//     try {
//       const response = await fetch(`/modify-task-hours/${taskId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ nouvelleHeureTravail: nouvelleHeureTravailInt }),
//       });

//       if (response.ok) {
//         const data = await response.json();

//         const heureTravailElement = taskElement.querySelector('.heureTravail .heures');
//         heureTravailElement.innerText = `${data.nouvelleHeureTravail}h`;

//         const montantElement = taskElement.querySelector('.montant .item-text');
//         montantElement.innerText = `${data.nouveauMontant} €`;

//         // recalculerTotal(); // <= Appelle le recalcul du total si besoin
//         window.location.reload();

//       } else {
//         const text = await response.text();
//         alert("Erreur lors de la modification : " + text);
//       }
//     } catch (error) {
//       alert("Erreur réseau ou serveur : " + error.message);
//     } finally {
//       selectElement.style.display = 'none';
//     }
//   }, { once: true });
// }

async function modifyTaskHours(button) {
  const taskElement = button.closest('.item');
  const selectElement = taskElement.querySelector('.select-hours');

  selectElement.style.display = 'inline';

  selectElement.addEventListener('change', async function () {
    const taskId = taskElement.getAttribute('data-task-id');
    const nouvelleHeureTravailInt = parseInt(selectElement.value, 10);

    if (isNaN(nouvelleHeureTravailInt) || nouvelleHeureTravailInt < 0) {
      alert("Nombre d'heures invalide !");
      return;
    }

    try {
      const response = await fetch(`/modify-task-hours/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nouvelleHeureTravail: nouvelleHeureTravailInt }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const text = await response.text();
        alert("Erreur lors de la modification : " + text);
      }
    } catch (error) {
      alert("Erreur réseau ou serveur : " + error.message);
    } finally {
      selectElement.style.display = 'none';
    }
  }, { once: true });
}


// function recalculerTotal() {
//   let total = 0;
//   document.querySelectorAll('.montant .item-text').forEach(el => {
//     const montant = parseFloat(el.innerText.replace('€', '').trim());
//     if (!isNaN(montant)) total += montant;
//   });
//   document.querySelector('#total-global').innerText = `${total} €`;
// }


async function confirmDelete(button) {
  const isConfirmed = confirm("Veux-tu vraiment supprimer cette tâche ?");
  if (isConfirmed) {
    try {
      await deleteTask(button);
      alert("Tâche supprimée ✅");
    } catch (error) {
      alert("Une erreur est survenue : " + error.message);
    }
  } else {
    alert("Suppression annulée ❌");
  }
}
document.getElementById('btnReset').addEventListener('click', () => {
    window.location.href = '/historiqueUserAll';
}); 

document.getElementById('btnMois').addEventListener('click', () => {
    window.location.href = '/';
});

document.getElementById('btnMoisOuvriers').addEventListener('click', () => {
    console.log('click !');
    window.location.href = '/historiqueOuvrier';
});

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

document.addEventListener("DOMContentLoaded", function() {
  // On cible le bouton et le bloc à masquer/afficher
  const toggleButton = document.getElementById("toggleHistorique");
  const historique = document.getElementById("historique");

  // Masquer le bloc au départ
  historique.style.display = "none";
  historique.style.marginBottom = "20px";

  // Quand on clique sur le bouton...
  toggleButton.addEventListener("click", function() {
    if (historique.style.display === "none") {
      historique.style.display = "block";
    } else {
      historique.style.display = "none";
    }
  });
});