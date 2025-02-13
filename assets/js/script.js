// Variables globales
const $ = el => document.querySelector(el);
let data = [];
const SITE_URL = 'https://sg.com';

// Événements
$('#loadCards').addEventListener("click", async () => {
  showToast("Chargement des cartes en cours...", "warning");
  document.getElementById("globalProgressContainer").style.display = "block";
  updateGlobalProgress(0);

  await fetchStudentData()
  await preloadImages(data, 10)
  await generateStudentCards(data)

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

$("#csvFileInput").addEventListener("change",
  handleCSVFileUpload);

$("#connectToKobo").addEventListener("dblclick", async () => {
  const apiUrl = document.getElementById("koboApiUrl").value;
  if (apiUrl) {
    data = await fetchDataFromKoboCollect(apiUrl);
    showToast("Données récupérées avec succès depuis KoboCollect !", "success");
  } else {
    showToast("Veuillez entrer une URL valide pour l'API KoboCollect.", "warning");
  }
});

$("#cards-container").addEventListener("click", (event) => {
  if (event.target.tagName === "CANVAS") {
    const canvas = event.target;
    const zoomedCanvas = document.createElement("canvas");
    zoomedCanvas.className = 'img-thumbnail border border-primary border-2';
    zoomedCanvas.width = canvas.width-75;
    zoomedCanvas.height = canvas.height;
    const ctx = zoomedCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, 0, zoomedCanvas.width, zoomedCanvas.height);

    // Afficher le canvas zoomé dans une modale
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.right = "0";
    modal.style.bottom = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 1)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.appendChild(zoomedCanvas);
    document.body.appendChild(modal);

    // Fermer la modale en cliquant à l'extérieur
    modal.addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  }
});

$("#cards-container").addEventListener("click", (event) => {
  if (event.target.tagName === "CANVAS") {
    const canvas = event.target;
    const imgData = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = imgData;
    a.download = "carte_eleve.png";
    a.click();
  }
});

// Fonction pour charger les données des élèves
async function fetchDataFromKoboCollect(apiUrl) {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des données depuis KoboCollect");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    showToast(`Erreur : ${error.message}`, "danger");
    console.error(error);
  }
}

function handleCSVFileUpload(event) {
  const file = event.target.files[0];
  if (file && file.type === "text/csv") {
    Papa.parse(file, {
      header: true,
      complete: function(results) {
        data = results.data;
        showToast("Fichier CSV chargé avec succès !", "success");
      },
      error: function(error) {
        showToast("Erreur lors du chargement du fichier CSV", "danger");
      }
    });
  } else {
    showToast("Veuillez sélectionner un fichier CSV valide.", "warning");
  }
}

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
  const validStudents = data.filter(student => student.Photo && student.Photo.trim() !== "");

  document.getElementById("cards-container").innerHTML = ""; // Nettoyer avant la boucle


  if (validStudents.length === 0) {
    showToast("Aucune donnée valide trouvée dans le fichier CSV.", "warning");
    return;
  }

  console.log(`Nombre d'étudiants valides : ${validStudents.length}`);

  let total = validStudents.length,
  completed = 0;

  // 📌 Générer toutes les cartes en parallèle
  await Promise.all(validStudents.map(async (student, index) => {
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
async function downloadAllAsPDF() {
  try {
    const {
      jsPDF
    } = window.jspdf;
    if (!jsPDF) {
      throw new Error("La bibliothèque jsPDF n'est pas chargée.");
    }

    const cards = document.querySelectorAll('#cards-container canvas');
    if (cards.length === 0) {
      showToast("Aucune carte à télécharger.", "warning");
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 5;
    const spacing = 5;
    const cardsPerRow = 3;

    const maxCardWidth = (pageWidth - 2 * margin - (cardsPerRow - 1) * spacing) / cardsPerRow;
    const cardHeight = (maxCardWidth * 250) / 400; // Ratio 400x250

    let x = margin;
    let y = margin;

    cards.forEach((canvas, index) => {
      if (index > 0 && index % cardsPerRow === 0) {
        x = margin;
        y += cardHeight + spacing;

        if (y + cardHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      }

      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', x, y, maxCardWidth, cardHeight);

      x += maxCardWidth + spacing;
    });

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
    if (cards.length === 0) {
      showToast("Aucune carte à télécharger.", "warning");
      return;
    }

    const cardsPerRow = 3;
    const spacing = 5;
    const cardWidth = 400;
    const cardHeight = 250;

    const rows = Math.ceil(cards.length / cardsPerRow);
    const combinedWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing;
    const combinedHeight = rows * cardHeight + (rows - 1) * spacing;

    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = combinedWidth;
    combinedCanvas.height = combinedHeight;
    const ctx = combinedCanvas.getContext('2d');

    let x = 0;
    let y = 0;

    cards.forEach((canvas, index) => {
      if (index > 0 && index % cardsPerRow === 0) {
        x = 0;
        y += cardHeight + spacing;
      }

      ctx.drawImage(canvas, x, y, cardWidth, cardHeight);
      x += cardWidth + spacing;
    });

    const imgData = combinedCanvas.toDataURL('image/png');
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
function downloadSingleAsPNG() {
  try {
    const cards = document.querySelectorAll('#cards-container canvas');
    if (cards.length === 0) {
      showToast("Aucune carte à télécharger.", "warning");
      return;
    }

    cards.forEach((canvas, index) => {
      const imgData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgData;
      a.download = `carte_${index + 1}.png`;
      a.click();
    });

    showToast('Téléchargement des cartes en PNG démarré...', 'success');
  } catch (error) {
    showToast(`Erreur lors du téléchargement des cartes en PNG : ${error.message}`, 'danger');
    console.error('Erreur lors du téléchargement des cartes en PNG :', error);
  }
}

// Fonction pour télécharger une carte individuelle en PDF
function downloadSingleAsPDF() {
  try {
    const {
      jsPDF
    } = window.jspdf;
    if (!jsPDF) {
      throw new Error("La bibliothèque jsPDF n'est pas chargée.");
    }

    const cards = document.querySelectorAll('#cards-container canvas');
    if (cards.length === 0) {
      showToast("Aucune carte à télécharger.", "warning");
      return;
    }

    // const totalCards = cards.length;
    // let completedCards = 0;
    cards.forEach((canvas, index) => {
      // Exporter le canvas
      // completedCards++;
      // updateProgressBar((completedCards / totalCards) * 100);

      // Vérifier que le canvas est valide
      if (!canvas || !canvas.toDataURL) {
        throw new Error(`Le canvas ${index + 1} est invalide.`);
      }

      // Vérifier que le canvas n'est pas "souillé"
      try {
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.addImage(imgData, 'PNG', 10, 10, 190, 120); // Ajuster les dimensions si nécessaire
        doc.save(`carte_${index + 1}.pdf`);
      } catch (error) {
        console.error(`Erreur lors de l'exportation du canvas ${index + 1} :`, error);
        showToast(`Erreur lors de l'exportation de la carte ${index + 1}.`, 'danger');
      }
    });

    showToast('Téléchargement des cartes en PDF démarré...',
      'success');
  } catch (error) {
    showToast(`Erreur lors du téléchargement des cartes en PDF : ${error.message}`,
      'danger');
    console.error('Erreur lors du téléchargement des cartes en PDF :',
      error);
  }
}