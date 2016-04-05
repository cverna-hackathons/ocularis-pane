export const sampleData = [
  { 
    drawableId: 'main',
    content: 'Video/Text/Image',
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
    resolution: 20,
    invertTexture: true
  },
  leftSide: {
    radius: 2,
    hCutOff: 1.5,
    vCutOff: 1.5,
    resolution: 20,
    invertTexture: true
  },
  rightSide: {
    width: .4,
    height: .3,
    invertTexture: false
  }
};

let _webCamVideoMaterial = null;

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
 * Instantiate a plane object, a drawable element
 * @param  {Object: options} Options for size
 * @return {THREE.Mesh} Drawable object
 */
function createPlane(opt) {

  let geometry  = new THREE.PlaneGeometry(opt.width, opt.height);
  let material  = new THREE.MeshBasicMaterial();

  return new THREE.Mesh(geometry, material);
}


/**
 * Instantiate a drawable, an element within the component, 
    where data or other informtion can be rendered/played
 * @param  {String: name} Drawable name, serves to connect with the data source
 * @param  {Object: options} Options for instantiation
 * @return {THREE.Mesh} Resulting object that will be assigned to scene
 */
export function createDrawable(name, options) {
  let _options = (options || elementOptions[name]);
  let definitions = {
    main      : createPane,
    leftSide  : createPane,
    rightSide : createPlane
  };
  let drawable = (
    typeof(definitions[name]) === 'function' ? definitions[name](_options) : null
  );

  if (drawable) {
    drawable.name = name;
    drawable.userData = _options;
  }

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

/**
 * Create texture from image
 * @param  {Object} options - textColor, maxWidth, background
 * @param  {Object} object - THREE.js object to apply material to
 * @return {THREE.Texture} Can be assigned as a material.map
 */
export function applyMaterialImage(options, object) {
  loadImageToTexture(options, (loadedTexture) => {
    console.log('loadedTexture:', loadedTexture);
    object.material = createMaterialWithTexture(loadedTexture, {
      invert: object.userData.invertTexture,
      transparent: false
    });
  });
}


/**
 * Create texture from video
 * @param  {Object} options - textColor, maxWidth, background
 * @param  {Object} object - THREE.js object to apply material to
 * @return {THREE.Texture} Can be assigned as a material.map
 */
export function applyMaterialVideo(options, object) {
  let texture = new THREE.Texture(
    getCanvasWithTextWrap('Loading...', options)
  );
  
  object.material = createMaterialWithTexture(texture, {
    invert: object.userData.invertTexture,
    transparent: true
  });

  if (_webCamVideoMaterial) {
    finalize();
  } else {
    loadVideoToTexture(texture, options, (loadedVideoTx, video) => {
      if (loadedVideoTx) {
        loadedVideoTx.minFilter = THREE.LinearFilter;
        _webCamVideoMaterial = {
          texture: loadedVideoTx,
          video: video
        };
        finalize();
      } else {
        object.material = createMaterialWithTexture(
          getCanvasWithTextWrap('Unable to load video.', options)
        );
        object.userData.update = null;
      }
    });    
  }

  function finalize() {
    object.material = createMaterialWithTexture(_webCamVideoMaterial.texture, {
      invert: object.userData.invertTexture,
      transparent: false
    });

    object.userData.update = () => {
      if (
        _webCamVideoMaterial.video.readyState ===
        _webCamVideoMaterial.video.HAVE_ENOUGH_DATA
      ) _webCamVideoMaterial.texture.needsUpdate = true;
    };
  }
}

function invertTexture(texture) {
  let isVideo = (texture.image && texture.image.nodeName === 'VIDEO');
  if (isVideo) {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  } else {
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = - 1;
  }
  texture.needsUpdate  = true;

  return texture;
}


/**
 * Take texture and create a new material with it
 * @param  {Object: THREE.Texture} Texture to be inverted and used for material build
 * @param  {Object} options - if to make transparent, or inverted
 * @return {Object: THREE.Material} Can be assigned to mesh object
 */
function createMaterialWithTexture(texture, options) {
  options = _.defaults(options || {}, {
    invert: true,
    transparent: true
  });
  let textureOpts = {
    map: (options.invert ? invertTexture(texture) : texture),
    side: (options.invert ? THREE.BackSide : THREE.FrontSide),
    transparent: options.transparent
  };

  console.log('createMaterialWithTexture | textureOpts:', textureOpts, options)
  return new THREE.MeshBasicMaterial(textureOpts);
}

/**
 * Create tecture from image
 * @param  {Object} options - with content pointing to image
 * @param  {Function} done - call when done loading the image to texture
 * @return {void}
 */
function loadImageToTexture(options, done) {
  new THREE.TextureLoader().load(options.content, done);
}

function loadVideoToTexture(texture, options, done) {
  let userMedia  = navigator.mediaDevices.getUserMedia({
    video: true 
  });

  if (userMedia) {
    userMedia.then((stream) => {
      let video      = document.createElement('video');
      // video.width    = 320;
      // video.height   = 240;
      video.autoplay = true;
      video.src      = window.URL.createObjectURL(stream);
      return done(new THREE.Texture(video), video);
    }).catch(error => {
      console.log("Failed to get a stream due to", error);
      return done();
    });
  } else return done();
    

}

export function applyMaterialText(options, object) {
  object.material = createMaterialWithTexture(buildTextureFromText(options));
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
