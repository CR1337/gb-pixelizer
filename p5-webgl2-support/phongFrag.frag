// include lighting.glsl
precision highp float;
precision highp int;

uniform vec4 uMaterialColor;
uniform vec4 uTint;
uniform sampler2D uSampler;
uniform bool isTexture;
uniform bool uEmissive;

in vec3 vNormal;
in vec2 vTexCoord;
in vec3 vViewPosition;
in vec3 vAmbientColor;

out vec4 fragColor;

void main(void) {

  vec3 diffuse;
  vec3 specular;
  totalLight(vViewPosition, normalize(vNormal), diffuse, specular);

  if(uEmissive && !isTexture) {
    fragColor = uMaterialColor;
  }
  else {
    fragColor = isTexture ? texture(uSampler, vTexCoord) * (uTint / vec4(255, 255, 255, 255)) : uMaterialColor;
    fragColor.rgb = fragColor.rgb * (diffuse + vAmbientColor) + specular;
  }
}