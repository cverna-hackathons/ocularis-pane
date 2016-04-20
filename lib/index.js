// Import helper functions from outside files
import {
  applyMaterialText,
  applyMaterialImage,
  applyMaterialVideo,
  sampleData,
  elementOptions,
  createDrawable,
  createFrame
} from './utils';

// Required for the rollup to export our functionality
function getConstructor() {
  /**
   * Construct the component and return exposed functions and objects
   * @param  {String} id that identifies instance of constructed component
   * @return {Object} THREE.js Group, Draw fn, id
   */
  function construct(id, debug) {

    const _debug            = (debug === true);
    const selectedColor     = '#ff0000';
    const unselectedColor   = '#eeeeee';

    // Array of element names to update on each frame
    let toUpdate = [];
    let toUpdateTypes = ['video'];
    let drawPerType = {
      image: applyMaterialImage,
      text: applyMaterialText,
      video: applyMaterialVideo
    };
    let elements = {
      main: { 
        name: 'main',
        position: new THREE.Vector3(0, 0, 1),
        type: 'drawable',
        object: createDrawable('main')
      },
      leftSide: { 
        name: 'leftSide',
        position: new THREE.Vector3(-1, .5, 1.2),
        type: 'drawable',
        object: createDrawable('leftSide')
      },
      rightSide: { 
        name: 'rightSide',
        position: new THREE.Vector3(.8, .8, -1),
        type: 'drawable',
        object: createDrawable('rightSide')
      },
      frame: {
        name: 'frame',
        position: new THREE.Vector3(0, 0, 0),
        type: 'helper',
        object: createFrame(elementOptions.frame, debug)     
      }
    };

    let component = new THREE.Group();
    let elementNames = Object.keys(elements);

    component.name = 'componentGroup';

    elementNames.forEach(elementName => {
      let element = elements[elementName];

      component.add(element.object);
      element.object.position.copy(element.position);
    });
    // mainObject.position.set(0,0,opt.radius/opt.vCutOff);
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
      let element = elements[data.drawableId] || {};
      let object  = element.object;
      let drawFn  = drawPerType[data.type];

      if (
        data.drawableId && object && element.type === 'drawable' &&
        typeof(drawFn) === 'function'
      ) {
        drawFn(data, object);
        object.visible = true;

        if (~toUpdateTypes.indexOf(data.type) && !~toUpdate.indexOf(element.name)) {
          toUpdate.push(element.name);
        }
      }
    }

    function deactivate() {
      draw(sampleData);
      elements.leftSide.object.visible = false;
    }

    function highlight(inView) {
      if (_debug && elements.frame.object.material) {
        elements.frame.material.color.set(
          inView ? selectedColor : unselectedColor
        );
      }
    }

    /**
     * Update data on any element that is marked for keeping updated.
     * @param  {Object} value: '', drawableId: String, draw_type: String
     * @return {void}
     */

    function update() {
      toUpdate.forEach(elementName => {
        let element = elements[elementName];

        if (
          element && element.object && element.object.userData && 
          typeof(element.object.userData.update) === 'function'
        ) element.object.userData.update();
      });
    }

    return {
      draw,
      update,
      highlight,
      deactivate,
      component,
      id,
      frame: elements.frame.object,
      timeStamp: Date.now(),
    };
  }

  console.log('timeStamp:', Date.now());

  return construct;
}

// Required for the rollup to export our functionality
let componentConstructor = getConstructor();