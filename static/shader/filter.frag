#version 300 es
#extension GL_OES_standard_derivatives : enable

precision mediump float;

in vec2 v_uv;

uniform sampler2D u_tex;
uniform ivec2 u_final_size;
uniform int u_filter_algo;
uniform int u_kernel_radius;

out vec4 fragColor;

const float c_pi = 3.1415926;

int mod_(int a, int b) {
    return a - (b * int(floor(float(a) / float(b))));
}

float nearest(sampler2D tex, vec2 uv) {
    vec2 texel_size = vec2(1.0) / vec2(textureSize(u_tex, 0));
    vec2 sample_uv = (floor(uv * vec2(textureSize(u_tex, 0))) / vec2(textureSize(u_tex, 0)));

    return texture(tex, sample_uv + texel_size / vec2(2.0)).r;
}

float bilinear(sampler2D tex, vec2 uv) {
    vec2 texel_size = vec2(1.0) / vec2(textureSize(u_tex, 0));
    vec2 scaled_uv = uv * vec2(textureSize(u_tex, 0));
    vec2 sample_uv = floor(scaled_uv) / vec2(textureSize(u_tex, 0)) - texel_size / vec2(2.0);

    float v11 = texture(tex, sample_uv).r;
    float v21 = texture(tex, sample_uv + vec2(texel_size.x, 0.0)).r;
    float v12 = texture(tex, sample_uv + vec2(0.0, texel_size.y)).r;
    float v22 = texture(tex, sample_uv + texel_size).r;

    float v1 = mix(v11, v21, fract(scaled_uv.x));
    float v2 = mix(v12, v22, fract(scaled_uv.x));
    return mix(v1, v2, fract(scaled_uv.y));
}

float cubic(float A, float B, float C, float D, float t) {
    float a = (-A + 3.0 * B - 3.0 * C + D) / 2.0;
    float b = (2.0 * A - 5.0 * B + 4.0 * C - D) / 2.0;
    float c = (-A + C) / 2.0;
    float d = B;

    return a * (t * t * t) + b * (t * t) + c * t + d;
}

float bicubic(sampler2D tex, vec2 uv) {
    vec2 texel_size = vec2(1.0) / vec2(textureSize(u_tex, 0));
    vec2 scaled_uv = uv * vec2(textureSize(u_tex, 0));
    vec2 sample_uv = floor(scaled_uv) / vec2(textureSize(u_tex, 0)) - texel_size / vec2(2.0);

    vec2 scaled_uv_fract = fract(scaled_uv);

    float x_samples[4];
    float y_samples[4];
    for (int y = 0; y < 4; ++y) {
        for (int x = 0; x < 4; ++x) {
            vec2 rel_coord = vec2(x, y) - vec2(1.0);
            x_samples[x] = texture(
                tex, sample_uv + rel_coord * texel_size
            ).r;
        }
        y_samples[y] = cubic(
            x_samples[0], x_samples[1], x_samples[2], x_samples[3],
            scaled_uv_fract.x
        );
    }

    return cubic(
        y_samples[0], y_samples[1], y_samples[2], y_samples[3],
        scaled_uv_fract.y
    );
}

const int c_max_kernel_radius = 8;
const int c_max_kernel_size = (2 * c_max_kernel_radius + 1) * (2 * c_max_kernel_radius + 1);
float kernel[c_max_kernel_size];
float kernel_sum = 0.0;

float sinc(float x) {
    return sin(c_pi * x) / (c_pi * x);
}

float lanczos(float x, int a) {
    if (x == 0.0) {
        return 1.0;
    } else if (float(-a) < x && x < float(a) && a != 0) {
        return sinc(x) * sinc(x / float(a));
    } else {
        return 0.0;
    }
}

float lanzcos_2d(float x, float y, int a) {
    return lanczos(x, a) * lanczos(y, a);
}

float magic_sharp(float x) {
    if (x <= -5.0 / 2.0) {
        return 0.0;
    } else if (-5.0 / 2.0 <= x && x <= -3.0 / 2.0) {
        return -(1.0 / 8.0) * (x + (5.0 / 2.0)) * (x + (5.0 / 2.0));
    } else if (-3.0 / 2.0 <= x && x <= -1.0 / 2.0) {
        return (1.0 / 4.0) * (4.0 * x * x + 11.0 * x + 7.0);
    } else if (-1.0 / 2.0 <= x && x <= 1.0 / 2.0) {
        return (17.0 / 16.0) - (7.0 / 4.0) * x * x;
    } else if (1.0 / 2.0 <= x && x <= 3.0 / 2.0) {
        return (1.0 / 4.0) * (4.0 * x * x - 11.0 * x + 7.0);
    } else if (3.0 / 2.0 <= x && x <= 5.0 / 2.0) {
        return -(1.0 / 8.0) * (x - (5.0 / 2.0)) * (x - (5.0 / 2.0));
    } else if (5.0 / 2.0 <= x) {
        return 0.0;
    }
}

float magic_sharp_2d(float x, float y) {
    return magic_sharp(x) * magic_sharp(y);
}

void fill_kernel(bool is_lanczos, int lanczos_a) {
    int kernel_width = (2 * u_kernel_radius + 1);
    int max_index = kernel_width * kernel_width - 1;
    vec2 scale_factor = vec2(u_final_size) / vec2(textureSize(u_tex, 0));

    int j = 0;
    for (int i = 0; i < max_index; ++i) {
        ivec2 i_coord = ivec2(i / kernel_width, mod_(i, kernel_width)) - ivec2(u_kernel_radius);
        vec2 coord = vec2(i_coord) * scale_factor;
        kernel[i] = (is_lanczos)
            ? lanzcos_2d(coord.x, coord.y, lanczos_a)
            : magic_sharp_2d(coord.x, coord.y);
        kernel_sum += kernel[i];
    }
}

float kernel_filter(sampler2D tex, vec2 uv) {
    int kernel_width = (2 * u_kernel_radius + 1);
    int max_index = kernel_width * kernel_width - 1;

    float accu = 0.0;
    int j = 0;
    for (int i = 0; i < max_index; ++i) {
        ivec2 kernel_coord = ivec2(i / kernel_width, mod_(i, kernel_width)) - ivec2(u_kernel_radius);
        ivec2 coord = ivec2(v_uv * vec2(textureSize(u_tex, 0)));
        ivec2 shifted_coord = coord + kernel_coord;

        accu += (texelFetch(tex, shifted_coord, 0).r * kernel[i]) / kernel_sum;
    }
    return accu;
}

void main() {
    float result;
    switch (u_filter_algo) {
        case 0:
            result = nearest(u_tex, v_uv);
            break;
        case 1:
            result = bilinear(u_tex, v_uv);
            break;
        case 2:
            result = bicubic(u_tex, v_uv);
            break;
        case 3:
            fill_kernel(true, 2);
            result = kernel_filter(u_tex, v_uv);
            break;
        case 4:
            fill_kernel(true, 3);
            result = kernel_filter(u_tex, v_uv);
            break;
        case 5:
            fill_kernel(false, 0);
            result = kernel_filter(u_tex, v_uv);
            break;
    }
    fragColor = vec4(vec3(result), 1.0);
}