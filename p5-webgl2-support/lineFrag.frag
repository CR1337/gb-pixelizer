#version 300 es

precision mediump float;
precision mediump int;

uniform vec4 uMaterialColor;
out vec4 fragColor;

void main() {
  fragColor = uMaterialColor;
}