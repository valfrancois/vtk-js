import macro from 'vtk.js/Sources/macro';
import vtkPolyDataVS from 'vtk.js/Sources/Rendering/WebGPU/glsl/vtkPolyDataVS.glsl';
import vtkPolyDataFS from 'vtk.js/Sources/Rendering/WebGPU/glsl/vtkPolyDataFS.glsl';

// ----------------------------------------------------------------------------
// vtkPipeline methods
// ----------------------------------------------------------------------------

function vtkWebGPUPipeline(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPipeline');

  publicAPI.updateRendererUBO = (ren) => {
    const webgpucam = ren.getViewNodeFor(ren.getRenderable().getActiveCamera());

    const keyMats = webgpucam.getKeyMatrices(ren.getRenderable());
    model.rendererUBOData.set(keyMats.wcdc, 0);
    model.rendererUBOData.set(keyMats.wcvc, 16);
    model.rendererUBOData.set(keyMats.vcdc, 32);
    model.uniformBuffer.setSubData(0, model.rendererUBOData);
  };

  publicAPI.assignRendererUBO = (ren) => {
    ren.getPassEncoder().setBindGroup(0, model.uniformBindGroup);
  };

  publicAPI.initialize = (windowNode) => {
    model.webGPUWindowNode = windowNode;
    const device = model.webGPUWindowNode.getDevice();
    const glslang = model.webGPUWindowNode.getGlslang();

    /* eslint-disable */
    model.rendererUBOLayout = device.createBindGroupLayout({
      bindings: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          type: 'uniform-buffer',
        },
      ],
    });
    /* eslint-enable */

    const uniformLayouts = [model.rendererUBOLayout];

    if (!model.UBO) {
      const uniformBufferSize = 3 * 4 * 16; // 3 4x4 matricies
      model.rendererUBOData = new Float32Array(3 * 16);

      /* eslint-disable */
      model.uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      /* eslint-enable */

      model.uniformBindGroup = device.createBindGroup({
        layout: model.rendererUBOLayout,
        bindings: [
          {
            binding: 0,
            resource: {
              buffer: model.uniformBuffer,
            },
          },
        ],
      });
    }

    model.pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: uniformLayouts,
    });
    model.pipeline = device.createRenderPipeline({
      layout: model.pipelineLayout,

      vertexStage: {
        module: device.createShaderModule({
          code: glslang.compileGLSL(vtkPolyDataVS, 'vertex'),
          source: vtkPolyDataVS,
          transform: (source) => glslang.compileGLSL(source, 'vertex'),
        }),
        entryPoint: 'main',
      },
      fragmentStage: {
        module: device.createShaderModule({
          code: glslang.compileGLSL(vtkPolyDataFS, 'fragment'),
          source: vtkPolyDataFS,
          transform: (source) => glslang.compileGLSL(source, 'fragment'),
        }),
        entryPoint: 'main',
      },

      primitiveTopology: 'triangle-list',
      depthStencilState: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus-stencil8',
      },
      vertexState: {
        vertexBuffers: [
          {
            arrayStride: 12,
            attributes: [
              {
                // position
                shaderLocation: 0,
                offset: 0,
                format: 'float3',
              },
            ],
          },
        ],
      },

      rasterizationState: {
        cullMode: 'back',
      },

      colorStates: [
        {
          format: 'bgra8unorm',
        },
      ],
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  pipeline: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['pipeline']);

  // Object methods
  vtkWebGPUPipeline(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUPipeline');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
