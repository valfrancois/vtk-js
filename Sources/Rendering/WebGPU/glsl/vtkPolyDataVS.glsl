#version 450

layout (std140, binding = 0) uniform rendererVals
{
  mat4 WCDCMatrix;
  mat4 WCVCMatrix;
  mat4 VCDCMatrix;
}  rendererUBO;

// layout (std140, set = 1, binding = 0) uniform mapperVals
// {
//   vec4 AmbientColor;
//   vec4 DiffuseColor;
//   float AmbientIntensity;
//   float DiffuseIntensity;
//   float Opacity;
//   float Metallic;
//   float Roughness;
//   float EmissiveFactor;
// }  mapperUBO;

layout (location = 0) in vec4 pos;

void main()
{
  gl_Position = rendererUBO.WCDCMatrix * pos;
}
