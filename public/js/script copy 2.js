const { timeout } = require("puppeteer");

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

async function modifyTaskHours(button) {
  const taskElement = button.closest('.item');
  const selectElement = taskElement.querySelector('.select-hours');

  // Toggle d'affichage
  if (selectElement.style.display === 'inline') {
    selectElement.style.display = 'none';
    return;
  } else {
    selectElement.style.display = 'inline';
  }

  // Si le listener n'est pas déjà ajouté
  if (!selectElement.dataset.listenerAdded) {
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
    });

    // Marquer que le listener est ajouté
    selectElement.dataset.listenerAdded = 'true';
  }
}

// function salairePaye(button) {
//   if (!button) return;
//   const parent = button.closest('.user-item'); // ou .salaireEtPaye si tu wraps chaque bloc
//   const salaireTextElement = parent.querySelector('.salaire');
//   const salaireButton = parent.querySelector('.buttonSalairePaye');
//   if (salaireTextElement) {
//     salaireTextElement.classList.toggle('paye');
//     salaireButton.classList.toggle('paye');
//     if (salaireTextElement.classList.contains('paye')) {
//       salaireButton.innerText = "Payé";
//     } else {
//       salaireButton.innerText = "A Payer";
//     }
//   }
// }

// function salairePaye(button, userId) {
//   if (!button) return;

//   const parent = button.closest('.user-item');
//   const salaireTextElement = parent.querySelector('.salaire');

//   fetch('/payementOuvrier', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ userId })
//   })
//   .then(res => res.json())
//   .then(data => {
//     if (data.success) {
//       salaireTextElement.classList.add('paye');
//       button.classList.add('paye');
//       button.innerText = "Payé";
//     } else {
//       alert("Erreur lors de la mise à jour du salaire");
//     }
//   })
//   .catch(err => console.error(err));
// }

// function salairePaye(button, userId) {
//   if (!button || !userId) return;

//   const parent = button.closest('.user-item');
//   const salaireTextElement = parent.querySelector('.salaire');

//   fetch('/payementOuvrier', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ userId })
//   })
//     .then(res => res.json())
//     .then(data => {
//       if (data.success) {
//         // Ajouter la classe "paye" côté visuel
//         if (salaireTextElement) salaireTextElement.classList.add('paye');
//         button.classList.add('paye');
//         button.innerText = "Payé";

//         // Facultatif : désactiver le bouton pour éviter plusieurs clics
//         button.disabled = true;
//       } else {
//         alert("Erreur lors de la mise à jour du salaire");
//       }
//     })
//     .catch(err => {
//       console.error(err);
//       alert("Erreur serveur lors de la mise à jour du salaire");
//     });
// }

// function salairePaye(button, userId) {
//   if (!button || !userId) return;

//   const parent = button.closest('.user-item');
//   const salaireTextElement = parent.querySelector('.salaire');

//   fetch('/payementOuvrier', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ userId })
//   })
//     .then(res => res.json())
//     .then(data => {
//       if (data.success) {
//         if (salaireTextElement) salaireTextElement.classList.add('paye');
//         button.classList.add('paye');
//         button.innerText = "Payé";
//         button.disabled = true; // empêcher de recliquer
//       } else {
//         alert("Erreur lors de la mise à jour du salaire");
//       }
//     })
//     .catch(err => {
//       console.error("Erreur fetch:", err);
//       alert("Erreur serveur");
//     });
// }
// function salairePaye(button, userId) {
//   if (!button || !userId) return;

//   const parent = button.closest('.user-item');
//   const salaireTextElement = parent.querySelector('.salaire');

//   fetch('/payementOuvrier', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ userId })
//   })
//     .then(res => res.json())
//     .then(data => {
//       if (data.success) {
//         // Ajouter la classe "paye" côté visuel
//         if (salaireTextElement) salaireTextElement.classList.add('paye');
//         button.classList.add('paye');
//         button.innerText = "Payé";
//         button.disabled = true; // empêcher plusieurs clics
//       } else {
//         alert("Erreur lors de la mise à jour du salaire");
//       }
//     })
//     .catch(err => {
//       console.error("Erreur fetch:", err);
//       alert("Erreur serveur");
//     });
// }
// async function salairePaye(button, userId) {
//   if (!button || !userId) return;

//   try {
//     const response = await fetch('/payementOuvrier', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ userId })
//     });
//     const data = await response.json();

//     if (data.success) {
//       const salaireText = button.closest('.SalaireEtValidationPaye').querySelector('.salaire');
      
//       // Toggle visuel
//       salaireText.classList.toggle('paye');
//       button.classList.toggle('paye');
//       // setTimeout(() => {
//       //   location.reload();
//       // }, 800);
      
//       button.innerText = data.newPayedState === 'y' ? 'Payé ' : 'A payer';
      

//     } else {
//       console.error('Erreur serveur:', data.message);
//     }
//   } catch (err) {
//     console.error('Erreur fetch:', err);
//   }
// }


async function modifyTaxiRefund(button) {
  const taskElement = button.closest('.item');
  const inputElement = taskElement.querySelector('.input-taxi-price');

  // Toggle affichage
  if (inputElement.style.display === 'inline') {
    inputElement.style.display = 'none';
    return;
  } else {
    inputElement.style.display = 'inline';
    inputElement.focus();
  }

  // Si le listener n'est pas déjà ajouté
  if (!inputElement.dataset.listenerAdded) {
    inputElement.addEventListener('change', async function () {
      const taskId = taskElement.getAttribute('data-task-id');
      const taxiPrice = parseFloat(inputElement.value);

      if (isNaN(taxiPrice)) {
        alert("Prix invalide !");
        return;
      }

      try {
        const response = await fetch(`/add-taxi-refund/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taxiRefund: taxiPrice }),
        });

        if (response.ok) {
          window.location.reload();
        } else {
          const text = await response.text();
          alert("Erreur lors du remboursement taxi : " + text);
        }
      } catch (error) {
        alert("Erreur réseau ou serveur : " + error.message);
      } finally {
        inputElement.style.display = 'none';
      }
    });

    inputElement.dataset.listenerAdded = 'true';
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