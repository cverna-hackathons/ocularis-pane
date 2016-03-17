
export const sampleData = [
  { 
    drawableId: 'main',
    content: 'Sample main text that goes into this pane.',
    type: 'text',
    bgColor: 'rgba(255, 255, 255, 0.5)',
    textColor: '#ffffff'
  }
];

export function applyInverseMaterial(options) {
  let texture = buildTextureFromText(options);

  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = - 1;
  texture.needsUpdate  = true;
  
  return new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    transparent: true
  });
}

/**
 * Create texture from canvas with text wrap
 * @param  {String} Text to render into texture
 * @param  {Number} Size for texture (has to be power of 2)
 * @return {THREE.Texture} Can be assigned as a material.map
 */
export function buildTextureFromText(options) {
  return new THREE.Texture(
    getCanvasWithTextWrap(options.content, options)
  );
}

/**
 * Create canvas with text filled within width / height boundaries
 * @param  {String} Text to render into texture
 * @param  {Object} fontSize, textColor, maxWidth, background
 * @return {Canvas element} Can be assigned as a material.map
 */
function getCanvasWithTextWrap(text, options) {
  let i, j, lines, lineSpacing, projectedHeight;
  let fontSize    = (options.fontSize || 50);
  let fontFace    = (options.fontFace || 'Arial');
  let maxWidth    = (options.maxWidth || 512);
  let fontColor   = (options.textColor || '#000000');
  let background  = (options.bgColor || '#eeeeee');
  let canvas      = document.createElement('canvas');
  let ctx         = canvas.getContext('2d');
  let width       = 0;

  ctx.canvas.width  = maxWidth;
  ctx.canvas.height = maxWidth;

  do {
    // Calculate canvas size, add margin
    adjustToFontSize();
    fontSize -= 2;
  } while (fontSize > 0 && projectedHeight > maxWidth);

  // since we are in a cube, we use the same height and width
  ctx.font   = fontSize + 'px Arial';

  // Render


  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = fontColor;
  j = lines.length;

  for (i=0; i < j; i++) {
    ctx.fillText(
      lines[i], lineSpacing, ((fontSize + lineSpacing) * (i + 1))
    );
  }

  return canvas;

  function adjustToFontSize() {
    var textCopy = '' + text;
    var len = textCopy.length;
    var result;

    lineSpacing = parseInt(fontSize / 2);
    projectedHeight = lineSpacing * 2;
    lines = new Array();

    // Measure text and calculate width
    // Font and size is required for ctx.measureText()
    ctx.font   = (fontSize + 'px ' + fontFace);

    while (textCopy.length) {
      for(
        i = textCopy.length; 
        (ctx.measureText(textCopy.substr(0, i)).width + lineSpacing) > maxWidth; 
        i--
      );
      result = textCopy.substr(0,i);

      if (i !== textCopy.length)
        for( j=0; result.indexOf(" ",j) !== -1; j=result.indexOf(" ",j)+1 );

      lines.push(result.substr(0, j || result.length));
      width = Math.max(width, ctx.measureText(lines[ lines.length-1 ]).width);
      textCopy = textCopy.substr(lines[ lines.length-1 ].length, textCopy.length);
      projectedHeight += (fontSize + lineSpacing);
    }
  }
}
