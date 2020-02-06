let glslang = undefined;
export default async function() {
  if (glslang !== undefined) return glslang;
    import(`@webgpu/glslang`).then((res) => {
      glslang = res.default();
      return glslang;
    });
  }
}
