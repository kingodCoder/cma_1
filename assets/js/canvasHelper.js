/*
This is a canvas helper module made to help with laborious canvas function for
drawing different kind of shapes.

Author : MBMOS Victor
*/

//Shapes

/*
Drawing a stroke square shape, this takes in parameters are
( color, linewidth, squarewidth, squareheight, x position, y position, context)
*/

function strokeRect(color, w, h, x, y, lw, c) {
  c.lineWidth = lw;
  c.strokeStyle = color;
  c.strokeRect(x, y, w, h);
}

/*
Drawing a full square shape, this takes in parameters are
( color, squarewidth, squareheight, x position, y position, context)
*/

function fullRect(color, w, h, x, y, c) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

/*
Drawing a full rounded corner square shape, parameters are
(color, squarewidth, squareheight, x position, y position, radius, context)
*/

function drawRCFullR(color, width, height, xr, yr, radius, c) {
  c.beginPath();
  c.moveTo(xr + radius, yr);
  c.lineTo(xr + width - radius, yr);
  c.arcTo(xr + width, yr, xr + width, yr + radius, radius);
  c.lineTo(xr + width, yr + height - radius);
  c.arcTo(xr + width, yr + height, xr + radius - radius, yr + height, radius);
  c.lineTo(xr + radius, yr + height);
  c.arcTo(xr, yr + height, xr, yr + height - radius, radius);
  c.lineTo(xr, yr + radius);
  c.arcTo(xr, yr, xr + radius, yr, radius);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

/*
Drawing a stroke rounded corner square shape, parameters are
(color, squarewidth, squareheight, x position, y position, radius, linewidth, context)
*/

function drawRCStrokeR(color, width, height, xr, yr, radius, lw, c) {
  c.beginPath();
  c.moveTo(xr + radius, yr);
  c.lineTo(xr + width - radius, yr);
  c.arcTo(xr + width, yr, xr + width, yr + radius, radius);
  c.lineTo(xr + width, yr + height - radius);
  c.arcTo(xr + width, yr + height, xr + radius - radius, yr + height, radius);
  c.lineTo(xr + radius, yr + height);
  c.arcTo(xr, yr + height, xr, yr + height - radius, radius);
  c.lineTo(xr, yr + radius);
  c.arcTo(xr, yr, xr + radius, yr, radius);
  c.closePath();
  c.lineWidth = lw;
  c.strokeStyle = color;
  c.stroke();
}

//Text

/*
Drawing stroke text, parameters are
(textcolor, textfont, linewidth, textcontent, x position, y position, width, context)
*/

function strokeText(color, font = '16px Arial bold', lw, text, x, y, w, c) {
  c.lineWidth = lw;
  c.strokeStyle = color;
  c.font = font;
  c.strokeText(text, x, y, w);
}

/*
Drawing full Text, parameters are
(textcolor, textfont, textcontent, x position, y position, width, context)
*/

function fullText(color, font = '16px Arial bold', text, x, y, w, c) {
  c.fillStyle = color;
  c.font = font;
  c.fillText(text, x, y, w);
}

// Image

/*
Drawing an image, parameters are
(source , x position, y position, width, height, context)
*/

function drawImage(src, x, y, w, h, c, imgName = 'N/A') {
  const img = new Image();
  img.crossOrigin = "anonymous"; // Indiquer que l'image est sûre
  img.src = src;
  img.addEventListener('load', ()=> {
    c.drawImage(img, x, y, w, h);
  }, false);
  img.addEventListener('error', ()=> {
    console.log(`Image non disponible : ${imgName}`);
    //throw new StudentPhotoError('Erreur lors du dessin de l\'image sur le canvas.');
  }, false);
}

// Fonction pour redimensionner un canvas
function resizeCanvas(canvas, maxWidth, maxHeight) {
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = maxWidth;
  resizedCanvas.height = maxHeight;
  const ctx = resizedCanvas.getContext('2d');
  ctx.drawImage(canvas,
    0,
    0,
    maxWidth,
    maxHeight);
  return resizedCanvas;
}