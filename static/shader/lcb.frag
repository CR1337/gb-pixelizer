#version 300 es
#extension GL_OES_standard_derivatives : enable

precision mediump float;

in vec2 v_uv;

uniform sampler2D u_tex;
uniform int u_sv_depth;
uniform int u_luminance_standard;
uniform float u_contrast;
uniform float u_brightness;
uniform float u_gamma;

const float c_pi = 3.1415926;
const float c_epsilon = 0.000001;

out vec4 fragColor;

vec3 rgb_to_hsv(vec3 rgb_color) {
    vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(
        vec4(rgb_color.b, rgb_color.g, k.w, k.z),
        vec4(rgb_color.gb, k.xy),
        step(rgb_color.g, rgb_color.b)
    );
    vec4 q = mix(
        vec4(p.x, p.y, p.w, rgb_color.r),
        vec4(rgb_color.r, p.yzx),
        step(rgb_color.r, p.x)
    );
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv_to_rgb(vec3 hsv_color) {
    vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv_color.xxx + k.xyz) * 6.0 - k.www);
    return hsv_color.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), hsv_color.y);
}

vec3 reduce_sv_depth(vec3 color) {
    vec3 hsv_color = rgb_to_hsv(color.rgb);
    float resolution = pow(2.0, float(u_sv_depth)) - 1.0;

    vec2 reduced_sv = floor(hsv_color.gb * resolution) / resolution;
    vec3 reduced_rgb_color = hsv_to_rgb(vec3(hsv_color.r, reduced_sv));

    return reduced_rgb_color;
}

float get_luminance(vec3 color) {
    switch (u_luminance_standard) {
        case 0:
            return (color.r + color.g + color.b) / 3.0;
            break;
        case 1:
            return dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
            break;
        case 2:
            return dot(color.rgb, vec3(0.299, 0.587, 0.114));
            break;
        case 3:
            return (max(color.r, max(color.g, color.b)) + min(color.r, min(color.g, color.b))) / 2.0;
            break;
        case 4:
            return max(color.r, max(color.g, color.b));
            break;
        case 5:
            return min(color.r, min(color.g, color.b));
            break;
        case 6:
            return color.r;
            break;
        case 7:
            return color.g;
            break;
        case 8:
            return color.b;
            break;
    }
}

float apply_contrast(float luminance) {
    float contrast = tan(0.5 * (c_pi - c_epsilon) * u_contrast);
    return ((luminance - 0.5) * max(contrast, 0.0)) + 0.5;
}

float apply_brightness(float luminance) {
    float brightness = u_brightness * 2.0 - 1.0;
    return max(min(luminance + brightness, 1.0), 0.0);
}

vec3 apply_gamma(vec3 color) {
    return vec3(
        pow(color.r, u_gamma),
        pow(color.g, u_gamma),
        pow(color.b, u_gamma)
    );
}

void main() {
    vec4 tex_color = texture(u_tex, v_uv);
    vec3 gamma_color = apply_gamma(tex_color.rgb);
    vec3 reduced_color = reduce_sv_depth(gamma_color);
    float luminance = get_luminance(reduced_color);
    luminance = apply_contrast(luminance);
    luminance = apply_brightness(luminance);
    fragColor = vec4(vec3(luminance), 1.0);
}