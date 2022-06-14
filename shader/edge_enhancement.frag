#version 300 es
#extension GL_OES_standard_derivatives : enable

precision mediump float;

in vec2 v_uv;

uniform sampler2D u_tex;
uniform sampler2D u_edge_tex;
uniform float u_edge_intensity;
uniform int u_edge_color;

out vec4 fragColor;

float enhanced_edge_black(float luminance, float edge) {
    return mix(1.0, 1.0 - edge, u_edge_intensity) * luminance;
}

float enhanced_edge_white(float luminance, float edge) {
    return 1.0 - (mix(1.0, 1.0 - edge, u_edge_intensity) * (1.0 - luminance));
}

float enhanced_edge_nearest(float luminance, float edge) {
    return mix(
        enhanced_edge_white(luminance, edge),
        enhanced_edge_black(luminance, edge),
        step(luminance, 0.5)
    );
}

void main() {
    float luminance = texture(u_tex, v_uv).r;
    float edge = texture(u_edge_tex, v_uv).r;
    float enhanced_edge;
    switch (u_edge_color) {
        case 0:
            enhanced_edge = enhanced_edge_black(luminance, edge);
            break;
        case 1:
            enhanced_edge = enhanced_edge_white(luminance, edge);
            break;
        case 2:
            enhanced_edge = enhanced_edge_nearest(luminance, edge);
            break;
    }
    fragColor = vec4(vec3(enhanced_edge), 1.0);
}
