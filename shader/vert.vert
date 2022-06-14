#version 300 es
#extension GL_OES_standard_derivatives : enable

in vec3 aPosition;
in vec2 aTexCoord;

out vec2 v_uv;

void main() {
    v_uv = aTexCoord;
    v_uv.y = 1.0 - v_uv.y;

    vec4 pos = vec4(aPosition, 1.0);
    pos.xy = pos.xy * 2.0 - 1.0;
    gl_Position = pos;
}