#version 300 es
#extension GL_OES_standard_derivatives : enable

precision mediump float;

in vec2 v_uv;

uniform sampler2D u_tex;

out vec4 fragColor;

vec4 nearest(sampler2D tex, vec2 uv) {
    vec2 texel_size = vec2(1.0) / vec2(textureSize(u_tex, 0));
    vec2 sample_uv = (floor(uv * vec2(textureSize(u_tex, 0))) / vec2(textureSize(u_tex, 0)));
    return texture(tex, sample_uv + texel_size / vec2(2.0));
}

void main() {
    fragColor = vec4(nearest(u_tex, v_uv));
}