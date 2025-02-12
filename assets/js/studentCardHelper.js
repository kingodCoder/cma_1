// Classe pour gérer la génération des cartes
class StudentCard {
  constructor(student) {
    this.student = student;
    this.colors = {
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
  }

  async generateCard() {
    const canvas = document.createElement("canvas");
    canvas.classList.add("img-thumbnail");
    canvas.width = 400;
    canvas.height = 250;
    const c = canvas.getContext("2d");

    await this.drawBg(canvas, c);
    await this.drawCardContent(canvas, c);

    return canvas;
  }

  async drawBg(canvas, c) {
    // Dessiner l'image de fond
    await drawBg(canvas.height, canvas.width, c);
  }

  async drawCardContent(canvas, c) {
    await delay(1000); // Attend 1 seconde
    const {
      qrText,
      formattedText
    } = generateQRCodeText(this.student);

    // Dessiner le contenu de la carte (bannières, texte, QR code, etc.)
    await cardCP(canvas.height, canvas.width, canvas.width / 2, canvas.height / 2, this.colors, 0, 25, 25, 12.5, 12.5, c);
    await studentId(this.student, canvas.height, canvas.width, canvas.width / 2,
      canvas.height / 2, this.colors, 0, 25, 25, 12.5, 12.5, qrText,
      formattedText, c);
  }

  async customizeCardContent() {
    //...
    console.log("This is coming soon !!!");
  }
}

// Fonction pour dessiner l'image de fond
async function drawBg(ch, cw, c) {
  try {
    let bgx = 0,
    bgy = 0,
    bgw = cw,
    bgh = ch,
    bgr = 15,
    bglw = 5;
    drawImage('img/card/bg/bg_3.jpeg', bglw/2, bglw/2, bgw-bglw, bgh-bglw,
      c);
  }
  catch(error) {
    showToast("Background image took so much time loading...", "danger");
    console.error("Background image took so much time loading...", "danger:", error);
  }
}

// Fonction pour personnaliser la carte (cardCP)
function cardCP(ch, cw, cw2, ch2, colors, o, h, w, y, x, c) {

  // 🎨 Personnalisation de la carte

  // 🎯 Bannière gauche (Header)
  let xhl = 5,
  yhl = 5,
  whl = (cw2-(w*2)),
  hhl = x,
  rhl = 7.5;
  c.beginPath();
  c.moveTo(xhl+rhl, yhl);
  c.lineTo(whl, yhl);
  c.lineTo(whl, yhl+hhl);
  c.lineTo(xhl, yhl+hhl);
  c.arcTo(xhl, yhl, xhl+hhl, yhl, rhl);
  c.fillStyle = colors.b;
  c.fill();
  c.closePath();

  // 🎯 Bannière centrale
  let xhm = (cw2-(w*2)),
  yhm = 5,
  whm = (cw2/2),
  hhm = x;
  fullRect(colors.y, whm, hhm, xhm, yhm, c);

  // 🎯 Bannière droite
  let xhr = ((cw2-(w*2))+(cw2/2)),
  yhr = 5,
  whr = whl-5,
  hhr = hhl,
  rhr = 7.5;
  c.beginPath();
  c.moveTo(xhr, yhr);
  c.lineTo(xhr+whr-rhr, yhr);
  c.arcTo(xhr+whr, yhr, xhr+whr, yhr+rhr, rhr);
  c.lineTo(xhr+whr, yhr+hhr);
  c.lineTo(xhr, yhr+hhr);
  c.fillStyle = colors.r;
  c.fill();
  c.closePath();

  // 🎯 Zone Logo
  let bx = ((w*3)-(x-5))+5,
  by = h+5,
  bh = (h+(x/2)),
  bw = ((cw-((w*3)-(x-5)))-12.5);
  fullRect(colors.db, bw, bh, bx, by, c);

  // 🎯 Image principale
  let xil = -16+30,
  yil = (h-(x-8))+5,
  hil = 60,
  wil = 60,
  clw = h*1.5,
  clh = clw;
  c.fillStyle = colors.db;
  c.beginPath();
  c.arc(xil+(clw/1.25), yil+(clh/1.25), clh, 0, (Math.PI * 2));
  c.fill();
  drawImage('img/card/logo/okapi_3.png', xil-((wil/2)-(clw/1.15)),
    yil-((hil/2)-(clh/1.05)), wil, hil, c);

  // 🎯 Texte principal
  let xtl = ((w*3)-(x-5))+20,
  ytl = ((h+(h+(x/2)))-(16/2))+6,
  mwtl = 200;
  fullText(colors.w, '25px Arial', 'C.S OKAPI', xtl, ytl, mwtl, c);

  // 🎯 Pied de carte (Footer)
  let fw = cw-h,
  fh = h,
  fx = 6+(h/4),
  fy = ch-(fh+6),
  fr = 10,
  ftx = fx+(h/2.65),
  fty = fy+(h/2.5)+(18/2),
  ftw = 200,
  ftf = 'bold 18px Roboto',
  ftc = colors.w;
  drawRCFullR(colors.b, fw, fh, fx, fy, fr, c);
  fullText(ftc, ftf, 'ANNEE SCOLAIRE : 2023-2024', ftx, fty, ftw, c);
}

// Fonction pour personnaliser les informations de l'élève (studentId)
async function studentId(student, ch, cw, cw2, ch2, colors, o, h, w, y, x, qrText, formattedText, c) {
  try {
    // 🎨 Personnalisation de l'élève

    // 🎯 Photo de l'élève
    let xp = (cw/4.35),
    yp = ((cw/8)*2.175),
    hp = (cw-(cw/4)),
    wp = (cw/5.25),
    rp = 5,
    lwp = (5/2);
    drawRCStrokeR(colors.db, xp, yp, hp, wp, rp, lwp, c);
    drawRCFullR(colors.lb, ((xp+lwp)-(rp*2)), ((yp+lwp)-(rp*2)), (hp-(lwp/2)+rp),
      (wp-(lwp/2)+rp), (rp/2), c);
    drawImage(student.Photo || "img/card/pic/pic_2.png", (hp-(lwp/2)+rp),
      (wp-(lwp/2)+rp), ((xp+lwp)-(rp*2)), ((yp+lwp)-(rp*2)), c, student.Photo);

    // 🎯 Génération du QR Code
    let qrh = 50 + (x / 2),
    qrw = qrh,
    qrx = (6 * 2),
    qry = (ch - (qrh + (h * 2))),
    qrs = 4,
    qrr = 5;
    const qrDiv = document.createElement("div");
    new QRCode(qrDiv, {
      text: qrText,
      width: qrw - (qrs * 2),
      height: qrh - (qrs * 2),
      correctLevel: QRCode.CorrectLevel.L // 🔥 Réduction du niveau d'erreur
    });
    drawRCStrokeR(colors.db, qrh, qrw, qrx, qry, qrr, 2, c);
    setTimeout(() => {
      const qrImage = qrDiv.querySelector("canvas");
      if (qrImage) {
        c.drawImage(qrImage, qrx + qrs, qry + qrs, qrw - (qrs * 2), qrh - (qrs * 2));
      }
    },
      500);

    // 🎯 Matricule élève
    let emat = 'Matricule',
    mat = formattedText || '001-Okapi-EB',
    ml = emat.length, eml = mat.length, ftx = (6+(h/4))+(h/2.65), ftw = 200, my = 240, emx = ftx+ftw+(ml*8)+eml, mx = ftx+ftw+(ml*8)+eml;
    fullText(colors.bk,
      'bold 10px Roboto',
      emat.toUpperCase(),
      emx-3,
      my-9,
      130,
      c);
    fullText(colors.w,
      'normal 9px Arial',
      mat.toUpperCase(),
      mx,
      my+2,
      130,
      c);

    // 🎯 Identité de l'élève
    let xil = -16+30,
    hx = (xil+75),
    hy = (75+(x/3)),
    hvstep = (h+x),
    hhstep = x,
    hcw = 130,
    hcolor = colors.bk,
    hfont = 'bold 13px Arial';
    // Name
    let ename = 'Nom';
    fullText(hcolor,
      hfont,
      ename,
      hx,
      hy,
      hcw,
      c);
    // Family Name & First-Name
    let effname = 'Post-nom/Prénom';
    fullText(hcolor,
      hfont,
      effname,
      hx,
      (hy+hvstep),
      hcw,
      c);
    // Birth
    let ebirth = 'Lieu & Date de Naissance';
    fullText(hcolor,
      hfont,
      ebirth,
      hx,
      (hy+(hvstep*2)),
      hcw,
      c);
    // Class
    let eclass = 'Classe';
    fullText(hcolor,
      hfont,
      eclass,
      ((hx+hcw)+(hhstep*1.5)),
      (hy+(hvstep*2)),
      hcw,
      c);
    // Address
    let eaddress = 'Adresse';
    fullText(hcolor,
      hfont,
      eaddress,
      hx,
      (hy+(hvstep*2.8)),
      hcw,
      c);

    // 🎯 Données de l'élève
    let cx = (xil+75),
    cy = (75+(x/2))+13,
    cvstep = (h+x),
    chstep = x,
    ccw = 130,
    ccolor = colors.w,
    cfont = 'bold 15px Roboto';
    // Nom
    let name = student.Nom || 'MABOTA';
    fullText(ccolor,
      cfont,
      name,
      cx,
      cy+2.5,
      ccw,
      c);
    // Post-nom
    let famname = student['Post-Nom'] || 'TABITA';
    fullText(ccolor,
      cfont,
      famname,
      cx,
      (cy+cvstep+2.5),
      ccw,
      c);
    // Prénom
    let fisrtname = student.Prénom || 'Jane',
    fml = famname.length;
    fullText(ccolor,
      cfont,
      fisrtname,
      (cx+(fml*10)+(x/2)),
      (cy+cvstep+2.5),
      ccw,
      c);
    // Lieu & Date de Naissance
    let cfont2 = 'bold 12px Arial',
    birth = student['Lieu et Date de Naissance'] || 'Kisangani, le 30/06/2015';
    fullText(ccolor,
      cfont2,
      birth,
      cx,
      (cy+(cvstep*2)),
      ccw,
      c);
    // Classe et Option
    let bl = birth.length,
    classroom = student['Classe et Option'] || '8 ème EB';
    fullText(ccolor,
      cfont2,
      classroom,
      ((hx+hcw)+(hhstep*1.5)),
      (cy+(cvstep*2)),
      ccw,
      c);
    // Adresse Domiciliaire
    let address = student.Adresse || 'Kisangani, RDC';
    fullText(ccolor,
      cfont2,
      address,
      cx,
      (cy+(cvstep*2.8)),
      ccw,
      c);

  } catch (error) {
    console.error("Erreur lors du chargement de l'image ou du QR code :",
      error);
    showToast("Erreur lors du chargement de l'image ou du QR code",
      "danger");
  }
}

// Fonction pour précharger les images

async function preloadImages() {
  const images = [
    'img/card/bg/bg_3.jpeg',
    'img/card/logo/okapi_3.png',
    'img/card/pic/pic_2.png'
  ];

  await Promise.all(images.map(src => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = resolve;
      img.onerror = reject;
    });
  }));
}

// Coming soon ...
function customizeCard(colors, logo, background) {
  // Mettre à jour les couleurs, le logo et l'image de fond
}