#version 300 es
#extension GL_OES_standard_derivatives : enable

precision mediump float;

in vec2 v_uv;

uniform sampler2D u_tex;
uniform int u_dither_algo;
uniform vec3 u_colors[4];

out vec4 fragColor;

float matrix_2x2[64] = float[](
        0.0, 2.0,
        3.0, 1.0,

        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    );
    float matrix_4x4[64] = float[](
        0.0, 8.0, 2.0, 10.0,
        12.0, 4.0, 14.0, 6.0,
        3.0, 11.0, 1.0, 9.0,
        15.0, 7.0, 13.0, 5.0,

        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    );
    float matrix_8x8[64] = float[](
        0.0, 32.0, 8.0, 40.0, 2.0, 34.0, 10.0, 42.0,
        48.0, 16.0, 56.0, 24.0, 50.0, 18.0, 58.0, 26.0,
        12.0, 44.0, 4.0, 36.0, 14.0, 46.0, 6.0, 38.0,
        60.0, 28.0, 52.0, 20.0, 62.0, 30.0, 54.0, 22.0,
        3.0, 35.0, 11.0, 43.0, 1.0, 33.0, 9.0, 41.0,
        51.0, 19.0, 59.0, 27.0, 49.0, 17.0, 57.0, 25.0,
        15.0, 47.0, 7.0, 39.0, 13.0, 45.0, 5.0, 37.0,
        63.0, 31.0, 55.0, 23.0, 61.0, 29.0, 53.0, 21.0
    );

int mod(int a, int b) {
    return a - (b * int(floor(float(a) / float(b))));
}

vec3 closest_color(vec3 color) {
    return u_colors[int(color * 3.0 + 0.5)];
}

vec3 dither(vec3 color, vec2 uv) {
    ivec2 coord = ivec2(uv * vec2(textureSize(u_tex, 0)));
    const float r = 1.0 / 4.0;
    int matrix_index = u_dither_algo - 9;
    int matrix_size = int(pow(2.0, float(matrix_index + 1)));
    float matrix[64];

    switch (matrix_index) {
        case 0:
            matrix = matrix_2x2;
            break;
        case 1:
            matrix = matrix_4x4;
            break;
        case 2:
            matrix = matrix_8x8;
            break;
    }

    coord = ivec2(mod(coord.x, matrix_size), mod(coord.y, matrix_size));
    int i = coord.y * matrix_size + coord.x;
    return closest_color(
        color + r * (1.0 / float(matrix_size * matrix_size)
    ) * (matrix[i] - 0.5));
}

void main() {
    vec4 tex_color = texture(u_tex, v_uv);
    vec3 dithered = dither(tex_color.rgb, v_uv);
    fragColor = vec4(dithered, 1.0);
}