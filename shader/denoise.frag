#version 300 es

precision mediump float;

in vec2 v_uv;

uniform sampler2D u_tex;
uniform int u_kernel_radius;

const int c_resolution = 256;
const float c_max_value = float(c_resolution - 1);
const float c_pi = 3.1415926;

out vec4 fragColor;

float neighbor_median(sampler2D tex, vec2 uv, int kernel_radius) {
    float squared_kernel_radius = float(kernel_radius * kernel_radius);
    ivec2 tex_coord = ivec2(uv * vec2(textureSize(u_tex, 0)));
    int counter[c_resolution];

    for (int x = -kernel_radius; x <= kernel_radius; ++x) {
        for (int y = -kernel_radius; y <= kernel_radius; ++y) {
            vec2 f_xy = vec2(x, y);
            if (dot(f_xy, f_xy) <= squared_kernel_radius) {
                int value = int(texelFetch(
                    tex, tex_coord + ivec2(x, y), 0
                ).r * c_max_value);
                counter[value]++;
            }
        }
    }

    int half_kernel_area = int(squared_kernel_radius * (c_pi / 2.0));
    int accu = 0;
    for (int i = 0; i < c_resolution; ++i) {
        accu += counter[i];
        if (accu > half_kernel_area) {
            return float(i) / c_max_value;
        }
    }

    return 0.0;
}

void main() {
    int kernel_radius = u_kernel_radius;
    float median = (kernel_radius > 0)
        ? neighbor_median(u_tex, v_uv, kernel_radius)
        : texture(u_tex, v_uv).r;
    fragColor = vec4(vec3(median), 1.0);
}
