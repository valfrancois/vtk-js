import md5 from 'blueimp-md5';

import macro from 'vtk.js/Sources/macro';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/WebGPU/ShaderProgram';

// ----------------------------------------------------------------------------

const SET_GET_FIELDS = ['lastShaderBound', 'context', 'webGPURenderWindow'];

// ----------------------------------------------------------------------------
// vtkShaderCache methods
// ----------------------------------------------------------------------------

function vtkShaderCache(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkShaderCache');

  // return NULL if there is an issue
  publicAPI.readyShaderProgramArray = (vertexCode, fragmentCode) => {
    const shader = publicAPI.getShaderProgram(vertexCode, fragmentCode);

    return publicAPI.readyShaderProgram(shader);
  };

  publicAPI.readyShaderProgram = (shader) => {
    if (!shader) {
      return null;
    }

    // compile if needed
    if (!shader.getCompiled() && !shader.compileShader()) {
      return null;
    }

    // bind if needed
    if (!publicAPI.bindShader(shader)) {
      return null;
    }

    return shader;
  };

  publicAPI.getShaderProgram = (vertexCode, fragmentCode) => {
    // compute the MD5 and the check the map
    const hashInput = `${vertexCode}${fragmentCode}`;
    const result = md5(hashInput);

    // does it already exist?
    const loc = Object.keys(model.shaderPrograms).indexOf(result);

    if (loc === -1) {
      // create one
      const sps = vtkShaderProgram.newInstance();
      sps.setContext(model.context);
      sps.getVertexShader().setSource(vertexCode);
      sps.getFragmentShader().setSource(fragmentCode);
      sps.setMd5Hash(result);
      model.shaderPrograms[result] = sps;
      return sps;
    }

    return model.shaderPrograms[result];
  };

  publicAPI.releaseGraphicsResources = (win) => {
    // NOTE:
    // In the current implementation as of October 26th, if a shader
    // program is created by ShaderCache then it should make sure
    // that it releases the graphics resouces used by these programs.
    // It is not wisely for callers to do that since then they would
    // have to loop over all the programs were in use and invoke
    // release graphics resources individually.

    publicAPI.releaseCurrentShader();

    Object.keys(model.shaderPrograms)
      .map((key) => model.shaderPrograms[key])
      .forEach((sp) => sp.releaseGraphicsResources(win));
  };

  publicAPI.releaseGraphicsResources = () => {
    // release prior shader
    if (model.astShaderBound) {
      model.lastShaderBound.release();
      model.lastShaderBound = null;
    }
  };

  publicAPI.bindShader = (shader) => {
    if (model.lastShaderBound === shader) {
      return 1;
    }

    // release prior shader
    if (model.lastShaderBound) {
      model.lastShaderBound.release();
    }
    shader.bind();
    model.lastShaderBound = shader;
    return 1;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  lastShaderBound: null,
  shaderPrograms: null,
  context: null,
  webGPURenderWindow: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Internal objects
  model.shaderPrograms = {};

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, SET_GET_FIELDS);

  // Object methods
  vtkShaderCache(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkShaderCache');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
