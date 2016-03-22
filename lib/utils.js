export const sampleData = [
  { 
    drawableId: 'main',
    content: 'Sample main text that goes into this pane.',
    type: 'text',
    bgColor: 'rgba(255, 255, 255, 0.5)',
    textColor: '#ffffff'
  }
];

export const elementOptions = {
  frame: {
    height: 1.1,
    width: 1.3
  },
  main: {
    radius: 2,
    hCutOff: 1.2,
    vCutOff: 1.3,
    resolution: 20
  },
  leftSide: {
    radius: 2,
    hCutOff: 1.5,
    vCutOff: 1.5,
    resolution: 20
  }
}

/**
 * Instantiate a reading pane object, a drawable element
 * @param  {Object: options} Options for size, radius, resolution of the base sphere
 * @return {THREE.Mesh} Drawable object
 */
function createPane(opt) {

  let geometry  = new THREE.SphereGeometry(
    opt.radius, opt.resolution, opt.resolution, 
    (Math.PI + opt.hCutOff), (Math.PI - (2 * opt.hCutOff)), opt.vCutOff,
    (Math.PI - (2 * opt.vCutOff))
  );
  let material  = new THREE.MeshBasicMaterial();

  return new THREE.Mesh(geometry, material);
}

/**
 * Instantiate a drawable, an element within the component, 
    where data or other informtion can be rendered/played
 * @param  {String: name} Drawable name, serves to connect with the data source
 * @param  {Object: options} Options for instantiation
 * @return {THREE.Mesh} Can be assigned as a material.map
 */
export function createDrawable(name, options) {
  let definitions = {
    main: () => createPane(options || elementOptions.main),
    leftSide: () => createPane(options || elementOptions.leftSide)
  };

  let drawable = (
    typeof(definitions[name]) === 'function' ? definitions[name]() : null
  );

  drawable.name = name;

  return drawable;
}

export function createFrame(opt, debug) {

  // We create a frame to capture the position and size of our display
  // This will be reused for moving the instance to camera focus
  let frameMat  = new THREE.MeshBasicMaterial(debug ? { 
    color: 'green', 
    wireframe: true 
  } : { 
    color: 'black', 
    wireframe: true, 
    transparent: true,
    opacity: 0
  });
  let frame     = new THREE.Mesh(
    new THREE.PlaneGeometry(opt.width, opt.height), 
    frameMat
  );
  
  frame.name    = 'componentFrame';

  return frame;
}

export function applyMaterialImage(options, object) {
  let texture = new THREE.Texture(
    getCanvasWithTextWrap('Loading...', options)
  );
  
  object.material = applyInverseTexture(texture);

  loadImageToTexture(texture, options, (loadedTexture) => {
    console.log('loadedTexture:', loadedTexture);
    object.material = applyInverseTexture(loadedTexture);
  });
}

function invertTexture(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = - 1;
  texture.needsUpdate  = true;
}


/**
 * Invert texture and create a new material with it
 * @param  {Object: THREE.Texture} Texture to be inverted and used for material build
 * @return {Object: THREE.Material} Can be assigned to mesh object
 */
function applyInverseTexture(texture) {
  invertTexture(texture);
  
  return new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    transparent: true
  });
}

/**
 * Create tecture from image
 * @return {Canvas element} Can be assigned as a material.map
 */
function loadImageToTexture(texture, options, done) {
  new THREE.TextureLoader().load(options.content, done);
}

export function applyMaterialText(options, object) {
  object.material = applyInverseTexture(buildTextureFromText(options));
}

/**
 * Create texture from canvas with text wrap
 * @param  {Object} content, textColor, maxWidth, background
 * @return {THREE.Texture} Can be assigned as a material.map
 */
function buildTextureFromText(options) {
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

  console.log('getCanvasWithTextWrap')
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
