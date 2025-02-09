const $ = el => document.querySelector(el);
let data = [];
const SITE_URL = 'https://sg.com';

// Lancement de la production des cartes
$('#loadCards').addEventListener("click", async () => {
  showToast("Chargement des cartes en cours...", "warning");
  document.getElementById("globalProgressContainer").style.display = "block";
  // ✅ Afficher la barre globale
  updateGlobalProgress(0); // ✅ Réinitialiser la barre à 0%

  await fetchStudentData(); // ✅ Attendre le chargement des données
  await generateStudentCards(data);

  updateGlobalProgress(100); // ✅ Finaliser la barre de progression
  setTimeout(() =>
    document.getElementById("globalProgressContainer").style.display = "none",
    1000); // ✅ Cacher après 1s*
  showToast("Toutes les cartes sont chargées !", "success");
});

// Function to fetch student data
async function fetchStudentData() {
  showToast("Fetching student data...");
  return new Promise((resolve, reject) => {
    Papa.parse('./files/eleves_kisangani_parite.csv', {
      download: true,
      header: true,
      complete: function(results) {
        console.log("Data loaded successfully:", results.data);
        data = results.data;
        resolve(); // ✅ Indiquer que les données sont prêtes
      },
      error: function(error) {
        showToast("Error loading CSV file", "danger");
        console.error("Error loading CSV file :", error);
        reject(error); // ✅ Permettre la gestion d'erreur
      }
    });
  });
}

//Function to generate multiple cards
async function generateStudentCards(data) {
  document.getElementById("cards-container").innerHTML = ""; // Nettoyer avant la boucle

  let total = data.length;
  let completed = 0;

  // 📌 Générer les cartes une par une
  for (let i = 0; i < total; i++) {
    try {
      await generateStudentCard(data[i]);
      completed++;
      updateGlobalProgress((completed / total) * 100); // Mise à jour après chaque carte
    } catch (error) {
      showToast(`Erreur lors du chargement de la carte ${i + 1}`, "danger");
    }
  }

  updateGlobalProgress(100); // Finaliser la barre de progression
  showToast("Toutes les cartes sont chargées !", "success");
}

// Function to generate a student card
async function generateStudentCard(student) {
  return new Promise(async (resolve, reject) => {

    try {
      const {
        qrText,
        formattedText
      } = generateQRCodeText(student);

      let colors = {
        lb: 'lightblue',
        b: 'blue',
        db: 'darkblue',
        w: 'white',
        bk: 'black',
        r: 'red',
        y: 'yellow',
        o: 'orange',
        br: 'brown',
        g: 'grey'
      };

      const cardContainer = document.createElement("div");
      cardContainer.className = "position-relative col-6 col-md-4 d-flex justify-content-center align-items-center";

      // Barre de progression
      const progressBar = document.createElement("div");
      progressBar.className = "progress position-absolute top-50 start-50 translate-middle";
      progressBar.style.width = "80%";
      progressBar.innerHTML = `<div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>`;
      cardContainer.appendChild(progressBar);

      // Création du canvas
      const canvas = document.createElement("canvas");
      canvas.classList.add("img-thumbnail");
      canvas.width = 400;
      canvas.height = 250;
      const c = canvas.getContext("2d");

      cardContainer.appendChild(canvas);
      document.getElementById("cards-container").appendChild(cardContainer);

      // Mettre à jour la barre de progression
      for (let progress = 10; progress <= 100; progress += 20) {
        progressBar.firstChild.style.width = `${progress}%`;
        await new Promise(res => setTimeout(res, 200));
      }

      //🎉 Styliser la carte et y ajouter les données de l'élève
      // 🎨 L'image de fond

      await drawBg(canvas.height, canvas.width, c).then(async ()=> {
        setTimeout(async ()=> {
          await cardCP(canvas.height, canvas.width, canvas.width/2, canvas.height/2, colors, 0, 25, 25, 12.5, 12.5, c);
          await studentId(student, canvas.height, canvas.width, canvas.width/2, canvas.height/2, colors, 0, 25, 25, 12.5, 12.5, qrText, formattedText, c);
        }, 200);
      });

      setTimeout(() => progressBar.remove(), 500);
      resolve();
    } catch (error) {
      reject(error);
    }

  });
}

// Function to generate QR code text
function generateQRCodeText(student) {
  const classeAbregee = abbreviateClass(student['Classe et Option']);
  const formattedText = `${student.Numéro ? String(student.Numéro).padStart(3,
    '0'): '000'}-Okapi-${classeAbregee}`;
  const qrContent = `${SITE_URL} [${formattedText}]`;
  return {
    qrText: qrContent,
    formattedText
  };
}

// Function to abbreviate class name
function abbreviateClass(className) {
  return className.substring(0,
    2).toUpperCase();
}

// Function for toast messages
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer");

  const toastId = `toast-${Date.now()}`;
  const toastHtml = `
  <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
  <div class="d-flex">
  <div class="toast-body">${message}</div>
  <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"
  aria-label="Close"></button>
  </div>
  </div>`;

  toastContainer.innerHTML += toastHtml;

  const toastElement = new bootstrap.Toast(document.getElementById(toastId));
  toastElement.show();
}

// Function for a global progress bar
function updateGlobalProgress(percent) {
  const progressContainer = document.getElementById("globalProgressContainer");
  const progressBar = document.getElementById("globalProgressBar");

  if (percent > 0) {
    progressContainer.style.display = "block";
    progressBar.style.width = `${percent}%`;
  }
  if (percent >= 100) {
    setTimeout(() => progressContainer.style.display = "none", 500);
  }
}

// Fonction pour télécharger toutes les cartes au format PDF
function downloadAllAsPDF() {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      throw new Error("La bibliothèque jsPDF n'est pas chargée.");
    }

    const cards = document.querySelectorAll('#cards-container canvas');

    // Vérifier s'il y a des canvas à télécharger
    if (cards.length === 0) {
      showToast("Aucune carte à télécharger.", "warning");
      return;
    }

    // Vérifier que chaque canvas contient des données
    cards.forEach((canvas, index) => {
      if (!canvas || !canvas.toDataURL) {
        throw new Error(`Le canvas ${index + 1} est invalide ou vide.`);
      }
    });

    // Créer le PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    cards.forEach((canvas, index) => {
      const imgData = canvas.toDataURL('image/png');
      if (index > 0) doc.addPage();
      doc.addImage(imgData, 'PNG', 10, 10, 190, 120);
    });

    // Télécharger le PDF
    doc.save('cartes_eleves.pdf');
    showToast('Démarrage du téléchargement...', 'success');
  } catch (error) {
    showToast(`Erreur lors du téléchargement du PDF : ${error.message}`, 'danger');
    console.error('Erreur lors du téléchargement du PDF :', error);
  }
}

// Fonction pour télécharger un canvas individuel
async function downloadCanvas(canvas, filename) {
  return new Promise((resolve, reject) => {
    try {
      // Vérifier que le canvas existe et est valide
      if (!canvas || !canvas.toBlob) {
        throw new Error("Le canvas est invalide ou non supporté par le navigateur.");
      }

      // Convertir le canvas en Blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Erreur lors de la conversion du canvas en Blob.");
        }

        // Créer un lien de téléchargement
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        // Libérer la mémoire
        URL.revokeObjectURL(url);

        // Afficher un message de succès
        showToast('Téléchargement démarré...', 'success');
        resolve();
      }, 'image/png');
    } catch (error) {
      // Afficher un message d'erreur détaillé
      showToast(`Erreur lors du téléchargement du canvas : ${error.message}`, 'danger');
      console.error('Erreur lors du téléchargement du canvas :', error);
      reject(error);
    }
  });
}

// Choisir le format de téléchargement
$("#downloadAs").addEventListener("change", function() {
  const selectedValue = this.value;

  // Liste des fonctions disponibles
  const actions = {
    // Télécharger toutes les cartes au format img
    asImg: function() {
      downloadAllAsPDF();
    },
    // Télécharger en tant que PDF
    asPdf: function() {
      const cards = document.querySelectorAll('#cards-container canvas');
      cards.forEach((canvas, index) => {
        downloadCanvas(canvas, `carte_${index + 1}.png`);
      });
    },
  };

  // Exécuter la fonction correspondante
  if (actions[selectedValue]) {
    actions[selectedValue]();
  } else {
    console.log("Erreur de sélection !!!");
  }
});