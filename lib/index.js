// Import helper functions from outside files
import {
  buildTextureFromText,
  sampleData
} from './utils';

// Required for the rollup to export our functionality
let componentConstructor = (() => {
  /**
   * Construct the component and return exposed functions and objects
   * @param  {String} id that identifies instance of constructed component
   * @return {Object} THREE.js Group, Draw fn, id
   */
  function construct(id) {
    let opt = {
      radius: 2,
      vSize: 0.8,
      hSize: 1,
      hCutOff: 0.7,
      vCutOff: 1,
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
    let material  = new THREE.MeshBasicMaterial({
      color: '#eeeeee',
      map: buildTextureFromText(sampleData.main),
      side: THREE.BackSide
    })
    let object    = new THREE.Mesh(geometry, material);
    let component = new THREE.Group();

    component.add(object);
    component.add(frame);

    var drawables = {
      main: () => {
        return;
      }
    };

    /**
     * Draw data point value onto drawable.
     * @param  {Object} value: '', drawableId: String, draw_type: String
     * @return {void}
     */
    function draw(data) {
      if (data.drawableId && drawables[data.drawableId]) {
        drawables[data.drawableId](data);
      }
    }

    function activate() {
      
    }

    return {
      draw,
      activate,
      component,
      id,
      frame
    };
  }

  return construct;
}) ();