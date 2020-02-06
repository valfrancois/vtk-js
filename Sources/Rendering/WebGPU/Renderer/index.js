import macro from 'vtk.js/Sources/macro';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { vtkDebugMacro } = macro;

// ----------------------------------------------------------------------------
// vtkWebGPURenderer methods
// ----------------------------------------------------------------------------
/* eslint-disable no-bitwise */

function vtkWebGPURenderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPURenderer');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      model.webGPURenderWindow = publicAPI.getParent();

      // make sure we have a camera
      if (!model.renderable.isActiveCameraCreated()) {
        model.renderable.resetCamera();
      }
      publicAPI.updateLights();
      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.renderable.getActiveCamera());
      publicAPI.addMissingNodes(model.renderable.getViewPropsWithNestedProps());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      if (!model.renderPassDescriptor) {
        model.renderPassDescriptor = {
          colorAttachments: [
            {
              attachment: undefined,
            },
          ],
          depthStencilAttachment: {
            attachment: model.webGPURenderWindow.getDepthTexture().createView(),
            depthLoadValue: 1.0,
            depthStoreOp: 'store',
            stencilLoadValue: 0,
            stencilStoreOp: 'store',
          },
        };
      }

      model.renderPassDescriptor.colorAttachments[0].attachment = model.webGPURenderWindow
        .getSwapChain()
        .getCurrentTexture()
        .createView();
      const ren = publicAPI.getRenderable();
      const background = ren.getBackground();
      model.renderPassDescriptor.colorAttachments[0].loadValue = {
        r: background[0],
        g: background[1],
        b: background[2],
        a: 1.0,
      };

      model.passEncoder = model.webGPURenderWindow
        .getCommandEncoder()
        .beginRenderPass(model.renderPassDescriptor);

      model.usedPipelines.forEach((value, key) => {
        const pipeline = model.webGPURenderWindow.getPipeline(key);
        pipeline.updateRendererUBO(publicAPI);
        model.passEncoder.setPipeline(pipeline.getPipeline());
        pipeline.assignRendererUBO(publicAPI);
        value.forEach((mpr) => {
          mpr.renderPipeline(publicAPI);
        });
      });
      model.passEncoder.endPass();
    }
  };

  publicAPI.registerPipeline = (name, node) => {
    if (!model.usedPipelines.has(name)) {
      model.usedPipelines.set(name, []);
    }
    model.usedPipelines.get(name).push(node);
  };

  publicAPI.updateLights = () => {
    let count = 0;

    const lights = model.renderable.getLightsByReference();
    for (let index = 0; index < lights.length; ++index) {
      if (lights[index].getSwitch() > 0.0) {
        count++;
      }
    }

    if (!count) {
      vtkDebugMacro('No lights are on, creating one.');
      model.renderable.createLight();
    }

    return count;
  };

  // Renders myself
  publicAPI.cameraPass = (prepass) => {
    if (prepass) {
      publicAPI.clear();
    }
  };

  publicAPI.getAspectRatio = () => {
    const size = model.parent.getSizeByReference();
    const viewport = model.renderable.getViewportByReference();
    return (
      (size[0] * (viewport[2] - viewport[0])) /
      ((viewport[3] - viewport[1]) * size[1])
    );
  };

  publicAPI.getTiledSizeAndOrigin = () => {
    const vport = model.renderable.getViewportByReference();

    // if there is no window assume 0 1
    const tileViewPort = [0.0, 0.0, 1.0, 1.0];

    // find the lower left corner of the viewport, taking into account the
    // lower left boundary of this tile
    const vpu = vtkMath.clampValue(vport[0] - tileViewPort[0], 0.0, 1.0);
    const vpv = vtkMath.clampValue(vport[1] - tileViewPort[1], 0.0, 1.0);

    // store the result as a pixel value
    const ndvp = model.parent.normalizedDisplayToDisplay(vpu, vpv);
    const lowerLeftU = Math.round(ndvp[0]);
    const lowerLeftV = Math.round(ndvp[1]);

    // find the upper right corner of the viewport, taking into account the
    // lower left boundary of this tile
    let vpu2 = vtkMath.clampValue(vport[2] - tileViewPort[0], 0.0, 1.0);
    let vpv2 = vtkMath.clampValue(vport[3] - tileViewPort[1], 0.0, 1.0);
    // also watch for the upper right boundary of the tile
    if (vpu2 > tileViewPort[2] - tileViewPort[0]) {
      vpu2 = tileViewPort[2] - tileViewPort[0];
    }
    if (vpv2 > tileViewPort[3] - tileViewPort[1]) {
      vpv2 = tileViewPort[3] - tileViewPort[1];
    }
    const ndvp2 = model.parent.normalizedDisplayToDisplay(vpu2, vpv2);

    // now compute the size of the intersection of the viewport with the
    // current tile
    let usize = Math.round(ndvp2[0]) - lowerLeftU;
    let vsize = Math.round(ndvp2[1]) - lowerLeftV;

    if (usize < 0) {
      usize = 0;
    }
    if (vsize < 0) {
      vsize = 0;
    }

    return { usize, vsize, lowerLeftU, lowerLeftV };
  };

  publicAPI.clear = () => {};

  publicAPI.releaseGraphicsResources = () => {};

  publicAPI.setWebGPURenderWindow = (rw) => {
    if (model.webGPURenderWindow === rw) {
      return;
    }
    publicAPI.releaseGraphicsResources();
    model.webGPURenderWindow = rw;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  webGPURenderWindow: null,
  usedPipelines: null,
  renderPassDescriptor: null,
  passEncoder: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.usedPipelines = new Map();

  // Build VTK API
  macro.get(publicAPI, model, ['passEncoder']);

  macro.setGet(publicAPI, model, ['selector']);

  // Object methods
  vtkWebGPURenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPURenderer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
