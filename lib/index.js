// Import helper functions from outside files
import {
  applyInverseMaterial,
  sampleData
} from './utils';

// Required for the rollup to export our functionality
function getConstructor() {
  /**
   * Construct the component and return exposed functions and objects
   * @param  {String} id that identifies instance of constructed component
   * @return {Object} THREE.js Group, Draw fn, id
   */
  function construct(id) {

    let opt = {
      radius: 2,
      vSize: 1,
      hSize: 1.6,
      hCutOff: 1.1,
      vCutOff: 1.3,
      resolution: 20
    };
    let geometry  = new THREE.SphereGeometry(
      opt.radius, opt.resolution, opt.resolution, 
      (Math.PI + opt.hCutOff), (Math.PI - (2 * opt.hCutOff)), opt.vCutOff,
      (Math.PI - (2 * opt.vCutOff))
    );
    // We create a frame to capture the position and size of our display
    // This will be reused for moving the instance to camera focus
    var frame     = new THREE.Mesh(
      new THREE.PlaneGeometry(opt.hSize, opt.vSize), 
      new THREE.MeshBasicMaterial({ color: 'green', wireframe: true })
    );
    let material  = new THREE.MeshBasicMaterial();
    let object    = new THREE.Mesh(geometry, material);
    let component = new THREE.Group();
    let drawables = {
      main: data => {
        switch (data.type) {
          case 'text': object.material = applyInverseMaterial(data); break;
          case 'image': object.material = applyMaterialImage(data); break;
        }
      }
    };

    component.add(object);
    component.add(frame);
    object.position.set(0,0,(opt.radius / 2.5));
    draw(sampleData);

    /**
     * Draw data point value onto drawable.
     * @param  {Object} value: '', drawableId: String, draw_type: String
     * @return {void}
     */
    function draw(data) {
      if (data instanceof Array) {
        data.forEach(renderDrawable);
      } else renderDrawable(data);
    }

    function renderDrawable(data) {
      if (data.drawableId && drawables[data.drawableId]) {
        drawables[data.drawableId](data);
      }
    }

    function deactivate() {
      draw(sampleData);
    }

    return {
      draw,
      deactivate,
      component,
      id,
      frame,
      timeStamp: Date.now(),
    };
  }

  console.log('timeStamp:', Date.now());

  return construct;
}

// Required for the rollup to export our functionality
let componentConstructor = getConstructor();