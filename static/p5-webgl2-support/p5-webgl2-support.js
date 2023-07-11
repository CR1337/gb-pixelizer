function createDefaultShaders() {
  function load_shader(url) {
      return fetch(url)
          .then(response => response.text())
          .then((data) => { return data; })
  };

  let lightingShader;
  let defaultShaders = {};
  const defaultShaderFilenames = [
      "basicFrag.frag",
      "fontFrag.frag",
      "fontVert.vert",
      "immediateVert.vert",
      "lightTextureFrag.frag",
      "lightVert.vert",
      "lineFrag.frag",
      "lineVert.vert",
      "normalFrag.frag",
      "normalVert.vert",
      "phongFrag.frag",
      "phongVert.vert",
      "pointFrag.frag",
      "pointVert.vert",
      "vertexColorFrag.frag",
      "vertexColorVert.vert"
  ];

  load_shader("p5-webgl2-support/_lightingShader.glsl")
      .then((data) => {
        lightingShader = data;

        for (let i = 0; i < defaultShaderFilenames.length; ++i) {
          const key = defaultShaderFilenames[i].split(".")[0];
          load_shader("p5-webgl2-support/" + defaultShaderFilenames[i])
              .then((data) => {
                if (key == 'lightVert' || key == 'phongFrag') {
                  defaultShaders[key] = lightingShader + "\n\n" + data;
                } else {
                  defaultShaders[key] = data;
                }
              });
        }
      });
}

function activateP5WebGL2Support() {


  defaultShaders = {
    "basicFrag": "#version 300 es\r\n\r\nprecision mediump float;\r\nuniform vec4 uMaterialColor;\r\nout vec4 fragColor;\r\nvoid main(void) {\r\n  fragColor = uMaterialColor;\r\n}",
    "fontVert": "#version 300 es\r\nprecision mediump float;\r\n\r\nin vec3 aPosition;\r\nin vec2 aTexCoord;\r\nuniform mat4 uModelViewMatrix;\r\nuniform mat4 uProjectionMatrix;\r\n\r\nuniform vec4 uGlyphRect;\r\nuniform float uGlyphOffset;\r\n\r\nout vec2 vTexCoord;\r\nout float w;\r\n\r\nvoid main() {\r\n  vec4 positionVec4 = vec4(aPosition, 1.0);\r\n\r\n  // scale by the size of the glyph's rectangle\r\n  positionVec4.xy *= uGlyphRect.zw - uGlyphRect.xy;\r\n\r\n  // move to the corner of the glyph\r\n  positionVec4.xy += uGlyphRect.xy;\r\n\r\n  // move to the letter's line offset\r\n  positionVec4.x += uGlyphOffset;\r\n\r\n  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;\r\n  vTexCoord = aTexCoord;\r\n  w = gl_Position.w;\r\n}\r\n",
    "fontFrag": "#version 300 es\r\n#extension GL_OES_standard_derivatives : enable\r\nprecision mediump float;\r\n\r\n#if 0\r\n  // simulate integer math using floats\r\n\t#define int float\r\n\t#define ivec2 vec2\r\n\t#define INT(x) float(x)\r\n\r\n\tint ifloor(float v) { return floor(v); }\r\n\tivec2 ifloor(vec2 v) { return floor(v); }\r\n\r\n#else\r\n  // use native integer math\r\n\tprecision highp int;\r\n\t#define INT(x) x\r\n\r\n\tint ifloor(float v) { return int(v); }\r\n\tint ifloor(int v) { return v; }\r\n\tivec2 ifloor(vec2 v) { return ivec2(v); }\r\n\r\n#endif\r\n\r\nuniform sampler2D uSamplerStrokes;\r\nuniform sampler2D uSamplerRowStrokes;\r\nuniform sampler2D uSamplerRows;\r\nuniform sampler2D uSamplerColStrokes;\r\nuniform sampler2D uSamplerCols;\r\n\r\nuniform ivec2 uStrokeImageSize;\r\nuniform ivec2 uCellsImageSize;\r\nuniform ivec2 uGridImageSize;\r\n\r\nuniform ivec2 uGridOffset;\r\nuniform ivec2 uGridSize;\r\nuniform vec4 uMaterialColor;\r\n\r\nin vec2 vTexCoord;\r\nout vec4 fragColor;\r\n\r\n// some helper functions\r\nint round_(float v) { return ifloor(v + 0.5); }\r\nivec2 round_(vec2 v) { return ifloor(v + 0.5); }\r\nfloat saturate(float v) { return clamp(v, 0.0, 1.0); }\r\nvec2 saturate(vec2 v) { return clamp(v, 0.0, 1.0); }\r\n\r\nint mul(float v1, int v2) {\r\n  return ifloor(v1 * float(v2));\r\n}\r\n\r\nivec2 mul(vec2 v1, ivec2 v2) {\r\n  return ifloor(v1 * vec2(v2) + 0.5);\r\n}\r\n\r\n// unpack a 16-bit integer from a float vec2\r\nint getInt16(vec2 v) {\r\n  ivec2 iv = round_(v * 255.0);\r\n  return iv.x * INT(128) + iv.y;\r\n}\r\n\r\nvec2 pixelScale;\r\nvec2 coverage = vec2(0.0);\r\nvec2 weight = vec2(0.5);\r\nconst float minDistance = 1.0/8192.0;\r\nconst float hardness = 1.05; // amount of antialias\r\n\r\n// the maximum number of curves in a glyph\r\nconst int N = INT(250);\r\n\r\n// retrieves an indexed pixel from a sampler\r\nvec4 getTexel(sampler2D sampler, int pos, ivec2 size) {\r\n  int width = size.x;\r\n  int y = ifloor(pos / width);\r\n  int x = pos - y * width;  // pos % width\r\n\r\n  return texture(sampler, (vec2(x, y) + 0.5) / vec2(size));\r\n}\r\n\r\nvoid calulateCrossings(vec2 p0, vec2 p1, vec2 p2, out vec2 C1, out vec2 C2) {\r\n\r\n  // get the coefficients of the quadratic in t\r\n  vec2 a = p0 - p1 * 2.0 + p2;\r\n  vec2 b = p0 - p1;\r\n  vec2 c = p0 - vTexCoord;\r\n\r\n  // found out which values of 't' it crosses the axes\r\n  vec2 surd = sqrt(max(vec2(0.0), b * b - a * c));\r\n  vec2 t1 = ((b - surd) / a).yx;\r\n  vec2 t2 = ((b + surd) / a).yx;\r\n\r\n  // approximate straight lines to avoid rounding errors\r\n  if (abs(a.y) < 0.001)\r\n    t1.x = t2.x = c.y / (2.0 * b.y);\r\n\r\n  if (abs(a.x) < 0.001)\r\n    t1.y = t2.y = c.x / (2.0 * b.x);\r\n\r\n  // plug into quadratic formula to find the corrdinates of the crossings\r\n  C1 = ((a * t1 - b * 2.0) * t1 + c) * pixelScale;\r\n  C2 = ((a * t2 - b * 2.0) * t2 + c) * pixelScale;\r\n}\r\n\r\nvoid coverageX(vec2 p0, vec2 p1, vec2 p2) {\r\n\r\n  vec2 C1, C2;\r\n  calulateCrossings(p0, p1, p2, C1, C2);\r\n\r\n  // determine on which side of the x-axis the points lie\r\n  bool y0 = p0.y > vTexCoord.y;\r\n  bool y1 = p1.y > vTexCoord.y;\r\n  bool y2 = p2.y > vTexCoord.y;\r\n\r\n  // could web be under the curve (after t1)?\r\n  if (y1 ? !y2 : y0) {\r\n    // add the coverage for t1\r\n    coverage.x += saturate(C1.x + 0.5);\r\n    // calculate the anti-aliasing for t1\r\n    weight.x = min(weight.x, abs(C1.x));\r\n  }\r\n\r\n  // are we outside the curve (after t2)?\r\n  if (y1 ? !y0 : y2) {\r\n    // subtract the coverage for t2\r\n    coverage.x -= saturate(C2.x + 0.5);\r\n    // calculate the anti-aliasing for t2\r\n    weight.x = min(weight.x, abs(C2.x));\r\n  }\r\n}\r\n\r\n// this is essentially the same as coverageX, but with the axes swapped\r\nvoid coverageY(vec2 p0, vec2 p1, vec2 p2) {\r\n\r\n  vec2 C1, C2;\r\n  calulateCrossings(p0, p1, p2, C1, C2);\r\n\r\n  bool x0 = p0.x > vTexCoord.x;\r\n  bool x1 = p1.x > vTexCoord.x;\r\n  bool x2 = p2.x > vTexCoord.x;\r\n\r\n  if (x1 ? !x2 : x0) {\r\n    coverage.y -= saturate(C1.y + 0.5);\r\n    weight.y = min(weight.y, abs(C1.y));\r\n  }\r\n\r\n  if (x1 ? !x0 : x2) {\r\n    coverage.y += saturate(C2.y + 0.5);\r\n    weight.y = min(weight.y, abs(C2.y));\r\n  }\r\n}\r\n\r\nvoid main() {\r\n\r\n  // calculate the pixel scale based on screen-coordinates\r\n  pixelScale = hardness / fwidth(vTexCoord);\r\n\r\n  // which grid cell is this pixel in?\r\n  ivec2 gridCoord = ifloor(vTexCoord * vec2(uGridSize));\r\n\r\n  // intersect curves in this row\r\n  {\r\n    // the index into the row info bitmap\r\n    int rowIndex = gridCoord.y + uGridOffset.y;\r\n    // fetch the info texel\r\n    vec4 rowInfo = getTexel(uSamplerRows, rowIndex, uGridImageSize);\r\n    // unpack the rowInfo\r\n    int rowStrokeIndex = getInt16(rowInfo.xy);\r\n    int rowStrokeCount = getInt16(rowInfo.zw);\r\n\r\n    for (int iRowStroke = INT(0); iRowStroke < N; iRowStroke++) {\r\n      if (iRowStroke >= rowStrokeCount)\r\n        break;\r\n\r\n      // each stroke is made up of 3 points: the start and control point\r\n      // and the start of the next curve.\r\n      // fetch the indices of this pair of strokes:\r\n      vec4 strokeIndices = getTexel(uSamplerRowStrokes, rowStrokeIndex++, uCellsImageSize);\r\n\r\n      // unpack the stroke index\r\n      int strokePos = getInt16(strokeIndices.xy);\r\n\r\n      // fetch the two strokes\r\n      vec4 stroke0 = getTexel(uSamplerStrokes, strokePos + INT(0), uStrokeImageSize);\r\n      vec4 stroke1 = getTexel(uSamplerStrokes, strokePos + INT(1), uStrokeImageSize);\r\n\r\n      // calculate the coverage\r\n      coverageX(stroke0.xy, stroke0.zw, stroke1.xy);\r\n    }\r\n  }\r\n\r\n  // intersect curves in this column\r\n  {\r\n    int colIndex = gridCoord.x + uGridOffset.x;\r\n    vec4 colInfo = getTexel(uSamplerCols, colIndex, uGridImageSize);\r\n    int colStrokeIndex = getInt16(colInfo.xy);\r\n    int colStrokeCount = getInt16(colInfo.zw);\r\n\r\n    for (int iColStroke = INT(0); iColStroke < N; iColStroke++) {\r\n      if (iColStroke >= colStrokeCount)\r\n        break;\r\n\r\n      vec4 strokeIndices = getTexel(uSamplerColStrokes, colStrokeIndex++, uCellsImageSize);\r\n\r\n      int strokePos = getInt16(strokeIndices.xy);\r\n      vec4 stroke0 = getTexel(uSamplerStrokes, strokePos + INT(0), uStrokeImageSize);\r\n      vec4 stroke1 = getTexel(uSamplerStrokes, strokePos + INT(1), uStrokeImageSize);\r\n      coverageY(stroke0.xy, stroke0.zw, stroke1.xy);\r\n    }\r\n  }\r\n\r\n  weight = saturate(1.0 - weight * 2.0);\r\n  float distance = max(weight.x + weight.y, minDistance); // manhattan approx.\r\n  float antialias = abs(dot(coverage, weight) / distance);\r\n  float cover = min(abs(coverage.x), abs(coverage.y));\r\n  fragColor = uMaterialColor;\r\n  fragColor.a *= saturate(max(antialias, cover));\r\n}",
    "immediateVert": "#version 300 es\r\nin vec3 aPosition;\r\nin vec4 aVertexColor;\r\n\r\nuniform mat4 uModelViewMatrix;\r\nuniform mat4 uProjectionMatrix;\r\nuniform float uResolution;\r\nuniform float uPointSize;\r\n\r\nvarying vec4 vColor;\r\nvoid main(void) {\r\n  vec4 positionVec4 = vec4(aPosition, 1.0);\r\n  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;\r\n  vColor = aVertexColor;\r\n  gl_PointSize = uPointSize;\r\n}\r\n",
    "lightTextureFrag": "#version 300 es\r\nprecision highp float;\r\n\r\nuniform vec4 uMaterialColor;\r\nuniform vec4 uTint;\r\nuniform sampler2D uSampler;\r\nuniform bool isTexture;\r\nuniform bool uEmissive;\r\n\r\nin highp vec2 vVertTexCoord;\r\nin vec3 vDiffuseColor;\r\nin vec3 vSpecularColor;\r\n\r\nout vec4 fragColor;\r\n\r\nvoid main(void) {\r\n  if(uEmissive && !isTexture) {\r\n    fragColor = uMaterialColor;\r\n  }\r\n  else {\r\n    fragColor = isTexture ? texture(uSampler, vVertTexCoord) * (uTint / vec4(255, 255, 255, 255)) : uMaterialColor;\r\n    fragColor.rgb = fragColor.rgb * vDiffuseColor + vSpecularColor;\r\n  }\r\n}",
    "lightVert": "#version 300 es\r\n\r\nprecision highp float;\r\nprecision highp int;\r\n\r\nuniform mat4 uViewMatrix;\r\n\r\nuniform bool uUseLighting;\r\n\r\nuniform int uAmbientLightCount;\r\nuniform vec3 uAmbientColor[5];\r\n\r\nuniform int uDirectionalLightCount;\r\nuniform vec3 uLightingDirection[5];\r\nuniform vec3 uDirectionalDiffuseColors[5];\r\nuniform vec3 uDirectionalSpecularColors[5];\r\n\r\nuniform int uPointLightCount;\r\nuniform vec3 uPointLightLocation[5];\r\nuniform vec3 uPointLightDiffuseColors[5];\r\nuniform vec3 uPointLightSpecularColors[5];\r\n\r\nuniform int uSpotLightCount;\r\nuniform float uSpotLightAngle[5];\r\nuniform float uSpotLightConc[5];\r\nuniform vec3 uSpotLightDiffuseColors[5];\r\nuniform vec3 uSpotLightSpecularColors[5];\r\nuniform vec3 uSpotLightLocation[5];\r\nuniform vec3 uSpotLightDirection[5];\r\n\r\nuniform bool uSpecular;\r\nuniform float uShininess;\r\n\r\nuniform float uConstantAttenuation;\r\nuniform float uLinearAttenuation;\r\nuniform float uQuadraticAttenuation;\r\n\r\nconst float specularFactor = 2.0;\r\nconst float diffuseFactor = 0.73;\r\n\r\nstruct LightResult {\r\n  float specular;\r\n  float diffuse;\r\n};\r\n\r\nfloat _phongSpecular(\r\n  vec3 lightDirection,\r\n  vec3 viewDirection,\r\n  vec3 surfaceNormal,\r\n  float shininess) {\r\n\r\n  vec3 R = reflect(lightDirection, surfaceNormal);\r\n  return pow(max(0.0, dot(R, viewDirection)), shininess);\r\n}\r\n\r\nfloat _lambertDiffuse(vec3 lightDirection, vec3 surfaceNormal) {\r\n  return max(0.0, dot(-lightDirection, surfaceNormal));\r\n}\r\n\r\nLightResult _light(vec3 viewDirection, vec3 normal, vec3 lightVector) {\r\n\r\n  vec3 lightDir = normalize(lightVector);\r\n\r\n  //compute our diffuse & specular terms\r\n  LightResult lr;\r\n  if (uSpecular)\r\n    lr.specular = _phongSpecular(lightDir, viewDirection, normal, uShininess);\r\n  lr.diffuse = _lambertDiffuse(lightDir, normal);\r\n  return lr;\r\n}\r\n\r\nvoid totalLight(\r\n  vec3 modelPosition,\r\n  vec3 normal,\r\n  out vec3 totalDiffuse,\r\n  out vec3 totalSpecular\r\n) {\r\n\r\n  totalSpecular = vec3(0.0);\r\n\r\n  if (!uUseLighting) {\r\n    totalDiffuse = vec3(1.0);\r\n    return;\r\n  }\r\n\r\n  totalDiffuse = vec3(0.0);\r\n\r\n  vec3 viewDirection = normalize(-modelPosition);\r\n\r\n  for (int j = 0; j < 5; j++) {\r\n    if (j < uDirectionalLightCount) {\r\n      vec3 lightVector = (uViewMatrix * vec4(uLightingDirection[j], 0.0)).xyz;\r\n      vec3 lightColor = uDirectionalDiffuseColors[j];\r\n      vec3 specularColor = uDirectionalSpecularColors[j];\r\n      LightResult result = _light(viewDirection, normal, lightVector);\r\n      totalDiffuse += result.diffuse * lightColor;\r\n      totalSpecular += result.specular * lightColor * specularColor;\r\n    }\r\n\r\n    if (j < uPointLightCount) {\r\n      vec3 lightPosition = (uViewMatrix * vec4(uPointLightLocation[j], 1.0)).xyz;\r\n      vec3 lightVector = modelPosition - lightPosition;\r\n\r\n      //calculate attenuation\r\n      float lightDistance = length(lightVector);\r\n      float lightFalloff = 1.0 / (uConstantAttenuation + lightDistance * uLinearAttenuation + (lightDistance * lightDistance) * uQuadraticAttenuation);\r\n      vec3 lightColor = lightFalloff * uPointLightDiffuseColors[j];\r\n      vec3 specularColor = lightFalloff * uPointLightSpecularColors[j];\r\n\r\n      LightResult result = _light(viewDirection, normal, lightVector);\r\n      totalDiffuse += result.diffuse * lightColor;\r\n      totalSpecular += result.specular * lightColor * specularColor;\r\n    }\r\n\r\n    if(j < uSpotLightCount) {\r\n      vec3 lightPosition = (uViewMatrix * vec4(uSpotLightLocation[j], 1.0)).xyz;\r\n      vec3 lightVector = modelPosition - lightPosition;\r\n\r\n      float lightDistance = length(lightVector);\r\n      float lightFalloff = 1.0 / (uConstantAttenuation + lightDistance * uLinearAttenuation + (lightDistance * lightDistance) * uQuadraticAttenuation);\r\n\r\n      vec3 lightDirection = (uViewMatrix * vec4(uSpotLightDirection[j], 0.0)).xyz;\r\n      float spotDot = dot(normalize(lightVector), normalize(lightDirection));\r\n      float spotFalloff;\r\n      if(spotDot < uSpotLightAngle[j]) {\r\n        spotFalloff = 0.0;\r\n      }\r\n      else {\r\n        spotFalloff = pow(spotDot, uSpotLightConc[j]);\r\n      }\r\n      lightFalloff *= spotFalloff;\r\n\r\n      vec3 lightColor = uSpotLightDiffuseColors[j];\r\n      vec3 specularColor = uSpotLightSpecularColors[j];\r\n\r\n      LightResult result = _light(viewDirection, normal, lightVector);\r\n\r\n      totalDiffuse += result.diffuse * lightColor * lightFalloff;\r\n      totalSpecular += result.specular * lightColor * specularColor * lightFalloff;\r\n    }\r\n  }\r\n\r\n  totalDiffuse *= diffuseFactor;\r\n  totalSpecular *= specularFactor;\r\n}\r\n\n\n// include lighting.glgl\r\n\r\nin vec3 aPosition;\r\nin vec3 aNormal;\r\nin vec2 aTexCoord;\r\n\r\nuniform mat4 uModelViewMatrix;\r\nuniform mat4 uProjectionMatrix;\r\nuniform mat3 uNormalMatrix;\r\n\r\nout highp vec2 vVertTexCoord;\r\nout vec3 vDiffuseColor;\r\nout vec3 vSpecularColor;\r\n\r\nvoid main(void) {\r\n\r\n  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);\r\n  gl_Position = uProjectionMatrix * viewModelPosition;\r\n\r\n  vec3 vertexNormal = normalize(uNormalMatrix * aNormal);\r\n  vVertTexCoord = aTexCoord;\r\n\r\n  totalLight(viewModelPosition.xyz, vertexNormal, vDiffuseColor, vSpecularColor);\r\n\r\n  for (int i = 0; i < 8; i++) {\r\n    if (i < uAmbientLightCount) {\r\n      vDiffuseColor += uAmbientColor[i];\r\n    }\r\n  }\r\n}\r\n",
    "lineFrag": "#version 300 es\r\n\r\nprecision mediump float;\r\nprecision mediump int;\r\n\r\nuniform vec4 uMaterialColor;\r\nout vec4 fragColor;\r\n\r\nvoid main() {\r\n  fragColor = uMaterialColor;\r\n}",
    "normalFrag": "#version 300 es\r\n\r\nprecision mediump float;\r\nin vec3 vVertexNormal;\r\nout vec4 fragColor;\r\nvoid main(void) {\r\n  fragColor = vec4(vVertexNormal, 1.0);\r\n}",
    "normalVert": "#version 300 es\r\nin vec3 aPosition;\r\nin vec3 aNormal;\r\nin vec2 aTexCoord;\r\n\r\nuniform mat4 uModelViewMatrix;\r\nuniform mat4 uProjectionMatrix;\r\nuniform mat3 uNormalMatrix;\r\n\r\nout vec3 vVertexNormal;\r\nout highp vec2 vVertTexCoord;\r\n\r\n\r\nvoid main(void) {\r\n  vec4 positionVec4 = vec4(aPosition, 1.0);\r\n  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;\r\n  vVertexNormal = normalize(vec3( uNormalMatrix * aNormal ));\r\n  vVertTexCoord = aTexCoord;\r\n}\r\n",
    "lineVert": "#version 300 es\r\n/*\r\n  Part of the Processing project - http://processing.org\r\n  Copyright (c) 2012-15 The Processing Foundation\r\n  Copyright (c) 2004-12 Ben Fry and Casey Reas\r\n  Copyright (c) 2001-04 Massachusetts Institute of Technology\r\n  This library is free software; you can redistribute it and/or\r\n  modify it under the terms of the GNU Lesser General Public\r\n  License as published by the Free Software Foundation, version 2.1.\r\n  This library is distributed in the hope that it will be useful,\r\n  but WITHOUT ANY WARRANTY; without even the implied warranty of\r\n  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU\r\n  Lesser General Public License for more details.\r\n  You should have received a copy of the GNU Lesser General\r\n  Public License along with this library; if not, write to the\r\n  Free Software Foundation, Inc., 59 Temple Place, Suite 330,\r\n  Boston, MA  02111-1307  USA\r\n*/\r\n#define PROCESSING_LINE_SHADER\r\n\r\nuniform mat4 uModelViewMatrix;\r\nuniform mat4 uProjectionMatrix;\r\nuniform float uStrokeWeight;\r\n\r\nuniform vec4 uViewport;\r\nuniform int uPerspective;\r\n\r\nin vec4 aPosition;\r\nin vec4 aDirection;\r\n\r\nvoid main() {\r\n  // using a scale <1 moves the lines towards the camera\r\n  // in order to prevent popping effects due to half of\r\n  // the line disappearing behind the geometry faces.\r\n  vec3 scale = vec3(0.9995);\r\n\r\n  vec4 posp = uModelViewMatrix * aPosition;\r\n  vec4 posq = uModelViewMatrix * (aPosition + vec4(aDirection.xyz, 0));\r\n\r\n  // Moving vertices slightly toward the camera\r\n  // to avoid depth-fighting with the fill triangles.\r\n  // Discussed here:\r\n  // http://www.opengl.org/discussion_boards/ubbthreads.php?ubb=showflat&Number=252848\r\n  posp.xyz = posp.xyz * scale;\r\n  posq.xyz = posq.xyz * scale;\r\n\r\n  vec4 p = uProjectionMatrix * posp;\r\n  vec4 q = uProjectionMatrix * posq;\r\n\r\n  // formula to convert from clip space (range -1..1) to screen space (range 0..[width or height])\r\n  // screen_p = (p.xy/p.w + <1,1>) * 0.5 * uViewport.zw\r\n\r\n  // prevent division by W by transforming the tangent formula (div by 0 causes\r\n  // the line to disappear, see https://github.com/processing/processing/issues/5183)\r\n  // t = screen_q - screen_p\r\n  //\r\n  // tangent is normalized and we don't care which aDirection it points to (+-)\r\n  // t = +- normalize( screen_q - screen_p )\r\n  // t = +- normalize( (q.xy/q.w+<1,1>)*0.5*uViewport.zw - (p.xy/p.w+<1,1>)*0.5*uViewport.zw )\r\n  //\r\n  // extract common factor, <1,1> - <1,1> cancels out\r\n  // t = +- normalize( (q.xy/q.w - p.xy/p.w) * 0.5 * uViewport.zw )\r\n  //\r\n  // convert to common divisor\r\n  // t = +- normalize( ((q.xy*p.w - p.xy*q.w) / (p.w*q.w)) * 0.5 * uViewport.zw )\r\n  //\r\n  // remove the common scalar divisor/factor, not needed due to normalize and +-\r\n  // (keep uViewport - can't remove because it has different components for x and y\r\n  //  and corrects for aspect ratio, see https://github.com/processing/processing/issues/5181)\r\n  // t = +- normalize( (q.xy*p.w - p.xy*q.w) * uViewport.zw )\r\n\r\n  vec2 tangent = normalize((q.xy*p.w - p.xy*q.w) * uViewport.zw);\r\n\r\n  // flip tangent to normal (it's already normalized)\r\n  vec2 normal = vec2(-tangent.y, tangent.x);\r\n\r\n  float thickness = aDirection.w * uStrokeWeight;\r\n  vec2 offset = normal * thickness / 2.0;\r\n\r\n  vec2 curPerspScale;\r\n\r\n  if(uPerspective == 1) {\r\n    // Perspective ---\r\n    // convert from world to clip by multiplying with projection scaling factor\r\n    // to get the right thickness (see https://github.com/processing/processing/issues/5182)\r\n    // invert Y, projections in Processing invert Y\r\n    curPerspScale = (uProjectionMatrix * vec4(1, -1, 0, 0)).xy;\r\n  } else {\r\n    // No Perspective ---\r\n    // multiply by W (to cancel out division by W later in the pipeline) and\r\n    // convert from screen to clip (derived from clip to screen above)\r\n    curPerspScale = p.w / (0.5 * uViewport.zw);\r\n  }\r\n\r\n  gl_Position.xy = p.xy + offset.xy * curPerspScale;\r\n  gl_Position.zw = p.zw;\r\n}\r\n",
    "phongFrag": "#version 300 es\r\n\r\nprecision highp float;\r\nprecision highp int;\r\n\r\nuniform mat4 uViewMatrix;\r\n\r\nuniform bool uUseLighting;\r\n\r\nuniform int uAmbientLightCount;\r\nuniform vec3 uAmbientColor[5];\r\n\r\nuniform int uDirectionalLightCount;\r\nuniform vec3 uLightingDirection[5];\r\nuniform vec3 uDirectionalDiffuseColors[5];\r\nuniform vec3 uDirectionalSpecularColors[5];\r\n\r\nuniform int uPointLightCount;\r\nuniform vec3 uPointLightLocation[5];\r\nuniform vec3 uPointLightDiffuseColors[5];\r\nuniform vec3 uPointLightSpecularColors[5];\r\n\r\nuniform int uSpotLightCount;\r\nuniform float uSpotLightAngle[5];\r\nuniform float uSpotLightConc[5];\r\nuniform vec3 uSpotLightDiffuseColors[5];\r\nuniform vec3 uSpotLightSpecularColors[5];\r\nuniform vec3 uSpotLightLocation[5];\r\nuniform vec3 uSpotLightDirection[5];\r\n\r\nuniform bool uSpecular;\r\nuniform float uShininess;\r\n\r\nuniform float uConstantAttenuation;\r\nuniform float uLinearAttenuation;\r\nuniform float uQuadraticAttenuation;\r\n\r\nconst float specularFactor = 2.0;\r\nconst float diffuseFactor = 0.73;\r\n\r\nstruct LightResult {\r\n  float specular;\r\n  float diffuse;\r\n};\r\n\r\nfloat _phongSpecular(\r\n  vec3 lightDirection,\r\n  vec3 viewDirection,\r\n  vec3 surfaceNormal,\r\n  float shininess) {\r\n\r\n  vec3 R = reflect(lightDirection, surfaceNormal);\r\n  return pow(max(0.0, dot(R, viewDirection)), shininess);\r\n}\r\n\r\nfloat _lambertDiffuse(vec3 lightDirection, vec3 surfaceNormal) {\r\n  return max(0.0, dot(-lightDirection, surfaceNormal));\r\n}\r\n\r\nLightResult _light(vec3 viewDirection, vec3 normal, vec3 lightVector) {\r\n\r\n  vec3 lightDir = normalize(lightVector);\r\n\r\n  //compute our diffuse & specular terms\r\n  LightResult lr;\r\n  if (uSpecular)\r\n    lr.specular = _phongSpecular(lightDir, viewDirection, normal, uShininess);\r\n  lr.diffuse = _lambertDiffuse(lightDir, normal);\r\n  return lr;\r\n}\r\n\r\nvoid totalLight(\r\n  vec3 modelPosition,\r\n  vec3 normal,\r\n  out vec3 totalDiffuse,\r\n  out vec3 totalSpecular\r\n) {\r\n\r\n  totalSpecular = vec3(0.0);\r\n\r\n  if (!uUseLighting) {\r\n    totalDiffuse = vec3(1.0);\r\n    return;\r\n  }\r\n\r\n  totalDiffuse = vec3(0.0);\r\n\r\n  vec3 viewDirection = normalize(-modelPosition);\r\n\r\n  for (int j = 0; j < 5; j++) {\r\n    if (j < uDirectionalLightCount) {\r\n      vec3 lightVector = (uViewMatrix * vec4(uLightingDirection[j], 0.0)).xyz;\r\n      vec3 lightColor = uDirectionalDiffuseColors[j];\r\n      vec3 specularColor = uDirectionalSpecularColors[j];\r\n      LightResult result = _light(viewDirection, normal, lightVector);\r\n      totalDiffuse += result.diffuse * lightColor;\r\n      totalSpecular += result.specular * lightColor * specularColor;\r\n    }\r\n\r\n    if (j < uPointLightCount) {\r\n      vec3 lightPosition = (uViewMatrix * vec4(uPointLightLocation[j], 1.0)).xyz;\r\n      vec3 lightVector = modelPosition - lightPosition;\r\n\r\n      //calculate attenuation\r\n      float lightDistance = length(lightVector);\r\n      float lightFalloff = 1.0 / (uConstantAttenuation + lightDistance * uLinearAttenuation + (lightDistance * lightDistance) * uQuadraticAttenuation);\r\n      vec3 lightColor = lightFalloff * uPointLightDiffuseColors[j];\r\n      vec3 specularColor = lightFalloff * uPointLightSpecularColors[j];\r\n\r\n      LightResult result = _light(viewDirection, normal, lightVector);\r\n      totalDiffuse += result.diffuse * lightColor;\r\n      totalSpecular += result.specular * lightColor * specularColor;\r\n    }\r\n\r\n    if(j < uSpotLightCount) {\r\n      vec3 lightPosition = (uViewMatrix * vec4(uSpotLightLocation[j], 1.0)).xyz;\r\n      vec3 lightVector = modelPosition - lightPosition;\r\n\r\n      float lightDistance = length(lightVector);\r\n      float lightFalloff = 1.0 / (uConstantAttenuation + lightDistance * uLinearAttenuation + (lightDistance * lightDistance) * uQuadraticAttenuation);\r\n\r\n      vec3 lightDirection = (uViewMatrix * vec4(uSpotLightDirection[j], 0.0)).xyz;\r\n      float spotDot = dot(normalize(lightVector), normalize(lightDirection));\r\n      float spotFalloff;\r\n      if(spotDot < uSpotLightAngle[j]) {\r\n        spotFalloff = 0.0;\r\n      }\r\n      else {\r\n        spotFalloff = pow(spotDot, uSpotLightConc[j]);\r\n      }\r\n      lightFalloff *= spotFalloff;\r\n\r\n      vec3 lightColor = uSpotLightDiffuseColors[j];\r\n      vec3 specularColor = uSpotLightSpecularColors[j];\r\n\r\n      LightResult result = _light(viewDirection, normal, lightVector);\r\n\r\n      totalDiffuse += result.diffuse * lightColor * lightFalloff;\r\n      totalSpecular += result.specular * lightColor * specularColor * lightFalloff;\r\n    }\r\n  }\r\n\r\n  totalDiffuse *= diffuseFactor;\r\n  totalSpecular *= specularFactor;\r\n}\r\n\n\n// include lighting.glsl\r\nprecision highp float;\r\nprecision highp int;\r\n\r\nuniform vec4 uMaterialColor;\r\nuniform vec4 uTint;\r\nuniform sampler2D uSampler;\r\nuniform bool isTexture;\r\nuniform bool uEmissive;\r\n\r\nin vec3 vNormal;\r\nin vec2 vTexCoord;\r\nin vec3 vViewPosition;\r\nin vec3 vAmbientColor;\r\n\r\nout vec4 fragColor;\r\n\r\nvoid main(void) {\r\n\r\n  vec3 diffuse;\r\n  vec3 specular;\r\n  totalLight(vViewPosition, normalize(vNormal), diffuse, specular);\r\n\r\n  if(uEmissive && !isTexture) {\r\n    fragColor = uMaterialColor;\r\n  }\r\n  else {\r\n    fragColor = isTexture ? texture(uSampler, vTexCoord) * (uTint / vec4(255, 255, 255, 255)) : uMaterialColor;\r\n    fragColor.rgb = fragColor.rgb * (diffuse + vAmbientColor) + specular;\r\n  }\r\n}",
    "phongVert": "#version 300 es\r\nprecision highp float;\r\nprecision highp int;\r\n\r\nin vec3 aPosition;\r\nin vec3 aNormal;\r\nin vec2 aTexCoord;\r\n\r\nuniform vec3 uAmbientColor[5];\r\n\r\nuniform mat4 uModelViewMatrix;\r\nuniform mat4 uProjectionMatrix;\r\nuniform mat3 uNormalMatrix;\r\nuniform int uAmbientLightCount;\r\n\r\nout vec3 vNormal;\r\nout vec2 vTexCoord;\r\nout vec3 vViewPosition;\r\nout vec3 vAmbientColor;\r\n\r\n\r\nvoid main(void) {\r\n\r\n  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);\r\n\r\n  // Pass varyings to fragment shader\r\n  vViewPosition = viewModelPosition.xyz;\r\n  gl_Position = uProjectionMatrix * viewModelPosition;\r\n\r\n  vNormal = uNormalMatrix * aNormal;\r\n  vTexCoord = aTexCoord;\r\n\r\n  // TODO: this should be a uniform\r\n  vAmbientColor = vec3(0.0);\r\n  for (int i = 0; i < 5; i++) {\r\n    if (i < uAmbientLightCount) {\r\n      vAmbientColor += uAmbientColor[i];\r\n    }\r\n  }\r\n}\r\n",
    "pointFrag": "#version 300 es\r\nprecision mediump float;\r\nprecision mediump int;\r\nuniform vec4 uMaterialColor;\r\nin float vStrokeWeight;\r\n\r\nout vec4 fragColor;\r\n\r\nvoid main(){\r\n\tfloat mask = 0.0;\r\n\r\n\t// make a circular mask using the gl_PointCoord (goes from 0 - 1 on a point)\r\n    // might be able to get a nicer edge on big strokeweights with smoothstep but slightly less performant\r\n\r\n\tmask = step(0.98, length(gl_PointCoord * 2.0 - 1.0));\r\n\r\n\t// if strokeWeight is 1 or less lets just draw a square\r\n\t// this prevents weird artifacting from carving circles when our points are really small\r\n\t// if strokeWeight is larger than 1, we just use it as is\r\n\r\n\tmask = mix(0.0, mask, clamp(floor(vStrokeWeight - 0.5),0.0,1.0));\r\n\r\n\t// throw away the borders of the mask\r\n    // otherwise we get weird alpha blending issues\r\n\r\n\tif(mask > 0.98){\r\n      discard;\r\n  \t}\r\n\r\n  \tfragColor = vec4(uMaterialColor.rgb * (1.0 - mask), uMaterialColor.a) ;\r\n}",
    "pointVert": "#version 300 es\r\nin vec3 aPosition;\r\nuniform float uPointSize;\r\nout float vStrokeWeight;\r\nuniform mat4 uModelViewMatrix;\r\nuniform mat4 uProjectionMatrix;\r\nvoid main() {\r\n\tvec4 positionVec4 =  vec4(aPosition, 1.0);\r\n\tgl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;\r\n\tgl_PointSize = uPointSize;\r\n\tvStrokeWeight = uPointSize;\r\n}",
    "vertexColorFrag": "#version 300 es\r\nprecision mediump float;\r\nin vec4 vColor;\r\nout vec4 fragColor;\r\nvoid main(void) {\r\n  fragColor = vColor;\r\n}",
    "vertexColorVert": "#version 300 es\r\nin vec3 aPosition;\r\nin vec4 aVertexColor;\r\n\r\nuniform mat4 uModelViewMatrix;\r\nuniform mat4 uProjectionMatrix;\r\n\r\nout vec4 vColor;\r\n\r\nvoid main(void) {\r\n  vec4 positionVec4 = vec4(aPosition, 1.0);\r\n  gl_position = uProjectionMatrix * uModelViewMatrix * positionVec4;\r\n  vColor = aVertexColor;\r\n}\r\n"
  };




  p5.RendererGL.prototype._initContext = function() {
      try {
        this.drawingContext = this.canvas.getContext('webgl2', this._pInst._glAttributes);
        if (this.drawingContext === null) {
          throw new Error('Error creating webgl context');
        } else {
          const gl = this.drawingContext;
          gl.enable(gl.DEPTH_TEST);
          gl.depthFunc(gl.LEQUAL);
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          this._viewport = this.drawingContext.getParameter(
            this.drawingContext.VIEWPORT
          );
        }
      } catch (er) {
        throw er;
      }
    };

    p5.RendererGL.prototype._getLightShader = function() {
      if (!this._defaultLightShader) {
        if (this._pInst._glAttributes.perPixelLighting) {
          this._defaultLightShader = new p5.Shader(
            this,
            defaultShaders.phongVert,
            defaultShaders.phongFrag
          );
        } else {
          this._defaultLightShader = new p5.Shader(
            this,
            defaultShaders.lightVert,
            defaultShaders.lightTextureFrag
          );
        }
      }

      return this._defaultLightShader;
    };

    p5.RendererGL.prototype._getImmediateModeShader = function() {
      if (!this._defaultImmediateModeShader) {
        this._defaultImmediateModeShader = new p5.Shader(
          this,
          defaultShaders.immediateVert,
          defaultShaders.vertexColorFrag
        );
      }

      return this._defaultImmediateModeShader;
    };

    p5.RendererGL.prototype._getNormalShader = function() {
      if (!this._defaultNormalShader) {
        this._defaultNormalShader = new p5.Shader(
          this,
          defaultShaders.normalVert,
          defaultShaders.normalFrag
        );
      }

      return this._defaultNormalShader;
    };

    p5.RendererGL.prototype._getColorShader = function() {
      if (!this._defaultColorShader) {
        this._defaultColorShader = new p5.Shader(
          this,
          defaultShaders.normalVert,
          defaultShaders.basicFrag
        );
      }

      return this._defaultColorShader;
    };

    p5.RendererGL.prototype._getPointShader = function() {
      if (!this._defaultPointShader) {
        this._defaultPointShader = new p5.Shader(
          this,
          defaultShaders.pointVert,
          defaultShaders.pointFrag
        );
      }
      return this._defaultPointShader;
    };

    p5.RendererGL.prototype._getLineShader = function() {
      if (!this._defaultLineShader) {
        this._defaultLineShader = new p5.Shader(
          this,
          defaultShaders.lineVert,
          defaultShaders.lineFrag
        );
      }

      return this._defaultLineShader;
    };

    p5.RendererGL.prototype._getFontShader = function() {
      if (!this._defaultFontShader) {
        this.GL.getExtension('OES_standard_derivatives');
        this._defaultFontShader = new p5.Shader(
          this,
          defaultShaders.fontVert,
          defaultShaders.fontFrag
        );
      }
      return this._defaultFontShader;
    };
}

activateP5WebGL2Support();