#version 300 es
#extension GL_OES_standard_derivatives : enable

precision mediump float;

in vec2 v_uv;

uniform sampler2D u_tex;
uniform float u_edge_threshold;
uniform int u_edge_algo;

out vec4 fragColor;

const mat3 sobel_x = mat3(
    1.0,  2.0,  1.0,
    0.0,  0.0,  0.0,
    -1.0, -2.0, -1.0
);

const mat3 sobel_y = mat3(
    1.0,  0.0, -1.0,
    2.0,  0.0, -2.0,
    1.0,  0.0, -1.0
);

const mat3 scharr_x = mat3(
    3.0, 10.0, 3.0,
    0.0, 0.0, 0.0,
    -3.0, -10.0, -3.0
);

const mat3 scharr_y = mat3(
    3.0, 0.0, -3.0,
    10.0, 0.0, -10.0,
    3.0, 0.0, -3.0
);

const mat3 prewitt_x = mat3(
    1.0, 1.0, 1.0,
    0.0, 0.0, 0.0,
    -1.0, -1.0, -1.0
);

const mat3 prewitt_y = mat3(
    1.0, 0.0, -1.0,
    1.0, 0.0, -1.0,
    1.0, 0.0, -1.0
);

float edge_detection(sampler2D tex, vec2 uv) {
    mat3 sx;
    mat3 sy;

    switch (u_edge_algo) {
        case 0:  // Sobel
            sx = sobel_x;
            sy = sobel_y;
            break;
        case 1:  // Scharr
            sx = scharr_x;
            sy = scharr_y;
            break;
        case 2:  // Prewitt
            sx = prewitt_x;
            sy = prewitt_y;
            break;
    }

    mat3 I;
    for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j) {
            I[i][j] = texelFetch(
              tex, ivec2(vec2(textureSize(u_tex, 0)) * uv) + ivec2(i - 1, j - 1), 0
            ).r;
        }
    float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]) + dot(sx[2], I[2]);
    float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]) + dot(sy[2], I[2]);
    float g = sqrt(pow(gx, 2.0) + pow(gy, 2.0));
    return (g <= u_edge_threshold) ? 0.0 : g;
}

void main() {
    fragColor = vec4(vec3(edge_detection(u_tex, v_uv)), 1.0);
}
