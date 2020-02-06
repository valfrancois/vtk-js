import macro from 'vtk.js/Sources/macro';
import vtkWebGPUActor from 'vtk.js/Sources/Rendering/WebGPU/Actor';
import vtkWebGPUCamera from 'vtk.js/Sources/Rendering/WebGPU/Camera';
import vtkWebGPUPolyDataMapper from 'vtk.js/Sources/Rendering/WebGPU/PolyDataMapper';
import vtkWebGPURenderer from 'vtk.js/Sources/Rendering/WebGPU/Renderer';
import vtkViewNodeFactory from 'vtk.js/Sources/Rendering/SceneGraph/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkWebGPUViewNodeFactory methods
// ----------------------------------------------------------------------------

function vtkWebGPUViewNodeFactory(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUViewNodeFactory');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNodeFactory.extend(publicAPI, model, initialValues);

  // Object methods
  vtkWebGPUViewNodeFactory(publicAPI, model);

  // Initialization
  publicAPI.registerOverride('vtkActor', vtkWebGPUActor.newInstance);
  publicAPI.registerOverride('vtkCamera', vtkWebGPUCamera.newInstance);
  publicAPI.registerOverride('vtkMapper', vtkWebGPUPolyDataMapper.newInstance);
  publicAPI.registerOverride('vtkRenderer', vtkWebGPURenderer.newInstance);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUViewNodeFactory'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
