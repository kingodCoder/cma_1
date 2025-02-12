// Variables globales
const $ = el => document.querySelector(el);
let data = [];
const SITE_URL = 'https://sg.com';

// Événements
$('#loadCards').addEventListener("click", async () => {
  showToast("Chargement des cartes en cours...", "warning");
  document.getElementById("globalProgressContainer").style.display = "block";
  updateGlobalProgress(0);

  await fetchStudentData();
  await preloadImages();
  await generateStudentCards(data);

  updateGlobalProgress(100);
  setTimeout(() => document.getElementById("globalProgressContainer").style.display = "none", 1000);
  showToast("Toutes les cartes sont chargées !", "success");
});

$("#downloadAs").addEventListener("change", function() {
  const selectedValue = this.value;
  const actions = {
    all_png: downloadAllAsPNG,
    all_pdf: downloadAllAsPDF,
    single_png: downloadSingleAsPNG,
    single_pdf: downloadSingleAsPDF
  };
  if (actions[selectedValue]) actions[selectedValue]();
});

// Fonction pour charger les données des élèves
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

// Fonction pour générer toutes les cartes
async function generateStudentCards(data) {
  document.getElementById("cards-container").innerHTML = ""; // Nettoyer avant la boucle

  let total = data.length;
  let completed = 0;

  // 📌 Générer toutes les cartes en parallèle
  await Promise.all(data.map(async (student, index) => {
    try {
      await generateStudentCard(student);
      completed++;
      updateGlobalProgress((completed / total) * 100); // Mise à jour après chaque carte
    } catch (error) {
      showToast(`Erreur lors du chargement de la carte ${index + 1}`, "danger");
    }
  }));

  updateGlobalProgress(100); // Finaliser la barre de progression
  showToast("Toutes les cartes sont chargées !",
    "success");
}

// Fonction pour générer une carte individuelle
async function generateStudentCard(student) {
  try {
    const card = new StudentCard(student),
    canvas = await card.generateCard();

    const cardContainer = document.createElement("div");
    cardContainer.className = "position-relative col-6 col-md-4 d-flex justify-content-center align-items-center";

    // Barre de progression
    const progressBar = document.createElement("div");
    progressBar.className = "progress position-absolute top-50 start-50 translate-middle";
    progressBar.style.width = "80%";
    progressBar.innerHTML = `<div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>`;
    cardContainer.appendChild(progressBar);

    cardContainer.appendChild(canvas);
    document.getElementById("cards-container").appendChild(cardContainer);

    // Mettre à jour la barre de progression
    for (let progress = 10; progress <= 100; progress += 20) {
      progressBar.firstChild.style.width = `${progress}%`;
      await new Promise(res => setTimeout(res, 200));
    }

    setTimeout(() => progressBar.remove(), 500);
  } catch (error) {
    console.error('Erreur lors de la génération de la carte :', error);
    showToast('Erreur lors de la génération de la carte !', 'danger');
  }
}

// Sauvegarder les cartes générées
async function saveCards(cards) {
  const response = await fetch('/api/save-cards',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cards),
    });

  if (!response.ok) {
    throw new Error("Erreur lors de la sauvegarde des cartes");
  }
}

// Fonction pour télécharger toutes les cartes en PDF
function downloadAllAsPDF() {
  try {
    const {
      jsPDF
    } = window.jspdf;
    if (!jsPDF) {
      throw new Error("La bibliothèque jsPDF n'est pas chargée.");
    }

    const cards = document.querySelectorAll('#cards-container canvas');

    // Vérifier s'il y a des canvas à télécharger
    if (cards.length === 0) {
      showToast("Aucune carte à télécharger.", "warning");
      return;
    }

    // Paramètres du PDF
    const doc = new jsPDF('p', 'mm', 'a4'); // Format A4, orientation portrait
    const pageWidth = doc.internal.pageSize.getWidth(); // Largeur de la page (210 mm pour A4)
    const pageHeight = doc.internal.pageSize.getHeight(); // Hauteur de la page (297 mm pour A4)
    const margin = 5; // Marge de 5 mm
    const spacing = 5; // Espacement de 5 micromètres entre les cartes
    const cardsPerRow = 3; // Nombre de cartes par ligne

    // Calculer la taille maximale d'une carte pour qu'elle tienne sur une ligne
    const maxCardWidth = (pageWidth - 2 * margin - (cardsPerRow - 1) * spacing) / cardsPerRow;
    const cardHeight = (maxCardWidth * 250) / 400; // Conserver le ratio hauteur/largeur (400x250)

    let x = margin; // Position X initiale
    let y = margin; // Position Y initiale

    // Ajouter chaque carte au PDF
    cards.forEach((canvas, index) => {
      if (index > 0 && index % cardsPerRow === 0) {
        // Passer à une nouvelle ligne
        x = margin;
        y += cardHeight + spacing;

        // Vérifier si on dépasse la hauteur de la page
        if (y + cardHeight > pageHeight - margin) {
          doc.addPage(); // Ajouter une nouvelle page
          y = margin; // Réinitialiser la position Y
        }
      }

      // Redimensionner le canvas si nécessaire
      const resizedCanvas = resizeCanvas(canvas, maxCardWidth, cardHeight);

      // Convertir le canvas redimensionné en image PNG
      const imgData = resizedCanvas.toDataURL('image/png');

      // Ajouter l'image au PDF
      doc.addImage(imgData, 'PNG', x, y, maxCardWidth, cardHeight);

      // Mettre à jour la position X pour la prochaine carte
      x += maxCardWidth + spacing;
    });

    // Télécharger le PDF
    doc.save('cartes_eleves.pdf');
    showToast('Téléchargement du PDF démarré...',
      'success');
  } catch (error) {
    showToast(`Erreur lors du téléchargement du PDF : ${error.message}`,
      'danger');
    console.error('Erreur lors du téléchargement du PDF :',
      error);
  }
}

// Fonction pour télécharger toutes les cartes en PNG
function downloadAllAsPNG() {
  try {
    const cards = document.querySelectorAll('#cards-container canvas');

    // Vérifier s'il y a des canvas à télécharger
    if (cards.length === 0) {
      showToast("Aucune carte à télécharger.", "warning");
      return;
    }

    // Paramètres de l'image combinée
    const cardsPerRow = 3; // Nombre de cartes par ligne
    const spacing = 5; // Espacement de 5 pixels entre les cartes
    const cardWidth = 400; // Largeur d'une carte
    const cardHeight = 250; // Hauteur d'une carte

    // Calculer la taille de l'image combinée
    const rows = Math.ceil(cards.length / cardsPerRow);
    const combinedWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing;
    const combinedHeight = rows * cardHeight + (rows - 1) * spacing;

    // Créer un canvas combiné
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = combinedWidth;
    combinedCanvas.height = combinedHeight;
    const ctx = combinedCanvas.getContext('2d');

    // Position initiale
    let x = 0;
    let y = 0;

    // Dessiner chaque carte sur le canvas combiné
    cards.forEach((canvas, index) => {
      if (index > 0 && index % cardsPerRow === 0) {
        // Passer à une nouvelle ligne
        x = 0;
        y += cardHeight + spacing;
      }

      // Dessiner la carte
      ctx.drawImage(canvas, x, y, cardWidth, cardHeight);

      // Mettre à jour la position X pour la prochaine carte
      x += cardWidth + spacing;
    });

    // Convertir le canvas combiné en image PNG
    const imgData = combinedCanvas.toDataURL('image/png');

    // Créer un lien de téléchargement
    const a = document.createElement('a');
    a.href = imgData;
    a.download = 'cartes_eleves.png';
    a.click();

    showToast('Téléchargement du PNG démarré...',
      'success');
  } catch (error) {
    showToast(`Erreur lors du téléchargement du PNG : ${error.message}`,
      'danger');
    console.error('Erreur lors du téléchargement du PNG :',
      error);
  }
}

// Fonction pour télécharger une carte individuelle en PNG
function downloadSingleAsPNG(canvas, index) {
  try {
    // Convertir le canvas en image PNG
    const imgData = canvas.toDataURL('image/png');

    // Créer un lien de téléchargement
    const a = document.createElement('a');
    a.href = imgData;
    a.download = `carte_${index + 1}.png`;
    a.click();

    showToast(`Téléchargement de la carte ${index + 1} en PNG démarré...`,
      'success');
  } catch (error) {
    showToast(`Erreur lors du téléchargement de la carte ${index + 1} en PNG : ${error.message}`,
      'danger');
    console.error('Erreur lors du téléchargement de la carte en PNG :',
      error);
  }
}

// Fonction pour télécharger une carte individuelle en PDF
function downloadSingleAsPDF(canvas, index) {
  try {
    const {
      jsPDF
    } = window.jspdf;
    if (!jsPDF) {
      throw new Error("La bibliothèque jsPDF n'est pas chargée.");
    }

    // Créer un nouveau document PDF
    const doc = new jsPDF('p', 'mm', 'a4'); // Format A4, orientation portrait

    // Convertir le canvas en image PNG
    const imgData = canvas.toDataURL('image/png');

    // Ajouter l'image au PDF
    doc.addImage(imgData, 'PNG', 10, 10, 190, 120); // Ajuster les dimensions si nécessaire

    // Télécharger le PDF
    doc.save(`carte_${index + 1}.pdf`);
    showToast(`Téléchargement de la carte ${index + 1} en PDF démarré...`, 'success');
  } catch (error) {
    showToast(`Erreur lors du téléchargement de la carte ${index + 1} en PDF : ${error.message}`, 'danger');
    console.error('Erreur lors du téléchargement de la carte en PDF :', error);
  }
}


/*
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


//Function to generate multiple cards


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
      await drawBg(canvas.height, canvas.width, c);

      // Les contours de la carte
      await cardCP(canvas.height, canvas.width, canvas.width/2, canvas.height/2, colors, 0, 25, 25, 12.5, 12.5, c);

      // Les données de l'élève
      await studentId(student, canvas.height, canvas.width, canvas.width/2, canvas.height/2, colors, 0, 25, 25, 12.5, 12.5, qrText, formattedText, c);

      setTimeout(() => progressBar.remove(), 500);
      resolve();
    } catch (error) {
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
*/