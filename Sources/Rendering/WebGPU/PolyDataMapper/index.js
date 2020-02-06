import { mat3, mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';
// import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
// import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
// import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkWebGPUCellArrayBufferObject from 'vtk.js/Sources/Rendering/WebGPU/CellArrayBufferObject';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

/* eslint-disable no-lonely-if */

const primTypes = {
  Start: 0,
  Points: 0,
  Lines: 1,
  Tris: 2,
  TriStrips: 3,
  TrisEdges: 4,
  TriStripsEdges: 5,
  End: 6,
};

// ----------------------------------------------------------------------------
// vtkWebGPUPolyDataMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUPolyDataMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPolyDataMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.webGPUActor = publicAPI.getFirstAncestorOfType('vtkWebGPUActor');
      model.webGPURenderer = model.webGPUActor.getFirstAncestorOfType(
        'vtkWebGPURenderer'
      );
      model.webGPURenderer.registerPipeline('surface', publicAPI);
      model.webGPURenderWindow = model.webGPURenderer.getParent();

      model.webGPUCamera = model.webGPURenderer.getViewNodeFor(
        model.webGPURenderer.getRenderable().getActiveCamera()
      );

      if (!model.VBO) {
        const representation = model.webGPUActor
          .getRenderable()
          .getProperty()
          .getRepresentation();
        const poly = model.renderable.getInputData();
        const points = poly.getPoints();

        const options = {
          points,
        };
        model.cabo = vtkWebGPUCellArrayBufferObject.newInstance();
        model.cabo.createVBO(poly.getPolys(), 'polys', representation, options);

        /* eslint-disable */
        model.VBO = model.webGPURenderWindow.getDevice().createBuffer({
          size: model.cabo.getElementCount() * model.cabo.getStride(),
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        /* eslint-enable */
        model.VBO.setSubData(0, model.cabo.getPackedVBO());
      }
    }
  };

  publicAPI.renderPipeline = (ren) => {
    ren.getPassEncoder().setVertexBuffer(0, model.VBO);
    ren.getPassEncoder().draw(model.cabo.getElementCount(), 1, 0, 0);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  VBOBuildTime: 0,
  VBOBuildString: null,
  primitives: null,
  primTypes: null,
  shaderRebuildString: null,
  tmpMat4: null,
  ambientColor: [], // used internally
  diffuseColor: [], // used internally
  specularColor: [], // used internally
  lightColor: [], // used internally
  lightHalfAngle: [], // used internally
  lightDirection: [], // used internally
  lastHaveSeenDepthRequest: false,
  haveSeenDepthRequest: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.primitives = [];
  model.primTypes = primTypes;

  model.tmpMat3 = mat3.create();
  model.tmpMat4 = mat4.create();

  // Build VTK API
  macro.setGet(publicAPI, model, ['context']);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime, { mtime: 0 });

  // Object methods
  vtkWebGPUPolyDataMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUPolyDataMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
