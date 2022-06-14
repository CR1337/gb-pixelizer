#version 300 es
precision mediump float;

in vec3 aPosition;
in vec2 aTexCoord;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec4 uGlyphRect;
uniform float uGlyphOffset;

out vec2 vTexCoord;
out float w;

void main() {
  vec4 positionVec4 = vec4(aPosition, 1.0);

  // scale by the size of the glyph's rectangle
  positionVec4.xy *= uGlyphRect.zw - uGlyphRect.xy;

  // move to the corner of the glyph
  positionVec4.xy += uGlyphRect.xy;

  // move to the letter's line offset
  positionVec4.x += uGlyphOffset;

  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
  vTexCoord = aTexCoord;
  w = gl_Position.w;
}
