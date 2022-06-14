#version 300 es
precision highp float;

uniform vec4 uMaterialColor;
uniform vec4 uTint;
uniform sampler2D uSampler;
uniform bool isTexture;
uniform bool uEmissive;

in highp vec2 vVertTexCoord;
in vec3 vDiffuseColor;
in vec3 vSpecularColor;

out vec4 fragColor;

void main(void) {
  if(uEmissive && !isTexture) {
    fragColor = uMaterialColor;
  }
  else {
    fragColor = isTexture ? texture(uSampler, vVertTexCoord) * (uTint / vec4(255, 255, 255, 255)) : uMaterialColor;
    fragColor.rgb = fragColor.rgb * vDiffuseColor + vSpecularColor;
  }
}