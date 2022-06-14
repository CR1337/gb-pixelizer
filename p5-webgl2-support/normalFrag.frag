#version 300 es

precision mediump float;
in vec3 vVertexNormal;
out vec4 fragColor;
void main(void) {
  fragColor = vec4(vVertexNormal, 1.0);
}