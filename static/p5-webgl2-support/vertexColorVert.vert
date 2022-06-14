#version 300 es
in vec3 aPosition;
in vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

out vec4 vColor;

void main(void) {
  vec4 positionVec4 = vec4(aPosition, 1.0);
  gl_position = uProjectionMatrix * uModelViewMatrix * positionVec4;
  vColor = aVertexColor;
}
