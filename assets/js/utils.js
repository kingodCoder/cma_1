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
  requestAnimationFrame(() => {
    const progressContainer = document.getElementById("globalProgressContainer");
    const progressBar = document.getElementById("globalProgressBar");
    if (percent > 0) {
      progressContainer.style.display = "block";
      progressBar.style.width = `${percent}%`;
    }
    if (percent >= 100) {
      setTimeout(() => progressContainer.style.display = "none", 500);
    }
  });
}

// Fonction pour retirer le fond et redimensionner l'image
async function removeBackgroundAndResize(imageUrl, width, height) {

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5s

    const erasedImage = await eraseBgRemove(imageUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (erasedImage) {
      return await resizeImage(erasedImage, width, height);
    }
  } catch (error) {
    console.warn("Erreur Erase.bg, tentative avec Remove.bg...", error);
  }

  try {
    const removedImage = await removeBgRemove(imageUrl);
    if (removedImage) {
      return await resizeImage(removedImage, width, height);
    }
  } catch (error) {
    console.warn("Erreur Remove.bg, redimensionnement sans suppression du fond...", error);
  }

  return await resizeImage(imageUrl,
    width,
    height); // 🔴 Utilisation de l’image originale
}

// 🟢 Fonction pour utiliser Erase.bg
async function eraseBgRemove(imageUrl) {
  const formData = new FormData();
  formData.append("image_url",
    imageUrl);
  formData.append("output_format",
    "png");

  const response = await fetch("https://api.erase.bg/v1/remove-background",
    {
      method: "POST",
      headers: {
        "X-API-Key": "VOTRE_CLE_API_ERASEBG"
      },
      body: formData,
    });

  const data = await response.json();
  if (!data || !data.output_url) throw new Error("Échec Erase.bg");
  return data.output_url;
}

// 🟡 Fonction pour utiliser Remove.bg
async function removeBgRemove(imageUrl) {
  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": "ZkMNpyvrhnvBYwa2Houp3pwB",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageUrl, size: "auto"
    }),
  });

  const data = await response.json();
  if (!data || !data.data.result_url) throw new Error("Échec Remove.bg");
  return data.data.result_url;
}

// 🔵 Fonction pour redimensionner une image
async function resizeImage(imageUrl, width, height) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL());
    };
  });
}

// Fonction pour abréger le nom de la classe
function abbreviateClass(className) {
  return className.substring(0,
    2).toUpperCase();
}

// Fonction pour retarder l'exécution d'une autre fonction.
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Classe d'erreur personnalisée pour les photos d'élèves non dispd'élèves
class StudentPhotoError extends Error {
  constructor(message){
    super(message);
    this.name = 'StudentPhotoError';
  }
}

// Fonction pour charger une image.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Indiquer que l'image est sûre
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Erreur lors du chargement de l'image : ${src}`));
  });
}