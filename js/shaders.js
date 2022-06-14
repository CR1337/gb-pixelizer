// #region GLOBALS

let shader_need_to_rerender = true;

let shader_initial_img;
let shader_img;
let shader_selected_img;

let shader_img_ratio;
let shader_final_image_ratio;

let shader_final_width;
let shader_final_height;

let shader_luma_contrast_bright_shader;
let shader_denoise_shader;
let shader_edge_detection_shader;
let shader_edge_enhancement_shader;
let shader_downsampling_shader;
let shader_dither_shader;
let shader_resampling_shader;

let shader_luma_contrast_bright_buffer;
let shader_denoise_buffer;
let shader_edge_detection_buffer;
let shader_edge_enhancement_buffer;
let shader_downsampling_buffer;
let shader_dither_buffer_cpu;
let shader_dither_buffer_gpu;
let shader_resampling_buffer;

let shader_gray_palette;
let shader_green_palette;
let shader_palette;

let shader_selection_x;
let shader_selection_y;
let shader_selection_width;
let shader_selection_height;

// #endregion

// #region INIT

function shader_create_render_buffers_final_size() {
    shader_downsampling_buffer = createGraphics(shader_final_width, shader_final_height, WEBGL);
    shader_dither_buffer_cpu = createGraphics(shader_final_width, shader_final_height, WEBGL);
    shader_dither_buffer_gpu = createGraphics(shader_final_width, shader_final_height, WEBGL);

    shader_dither_buffer_cpu.pixelDensity(1);
    shader_downsampling_buffer.pixelDensity(1);
    shader_dither_buffer_gpu.pixelDensity(1);
}

function shader_create_render_buffers_selected_size() {
    shader_luma_contrast_bright_buffer = createGraphics(shader_selection_width, shader_selection_height, WEBGL);
    shader_denoise_buffer = createGraphics(shader_selection_width, shader_selection_height, WEBGL);
    shader_edge_detection_buffer = createGraphics(shader_selection_width, shader_selection_height, WEBGL);
    shader_edge_enhancement_buffer = createGraphics(shader_selection_width, shader_selection_height, WEBGL);

    shader_resampling_buffer = createGraphics(display_shaded_image_width, display_shaded_image_width, WEBGL);

    shader_luma_contrast_bright_buffer.pixelDensity(1);
    shader_denoise_buffer.pixelDensity(1);
    shader_edge_detection_buffer.pixelDensity(1);
    shader_edge_enhancement_buffer.pixelDensity(1);
    shader_resampling_buffer.pixelDensity(1);
}

function shader_load_image() {
    shader_initial_img = loadImage('assets/img.jpg');
}

function shader_load_shaders() {
    shader_luma_contrast_bright_shader = loadShader("shader/vert.vert", "shader/lcb.frag");
    shader_denoise_shader = loadShader("shader/vert.vert", "shader/denoise.frag")
    shader_edge_detection_shader = loadShader("shader/vert.vert", "shader/edge_detection.frag");
    shader_edge_enhancement_shader = loadShader("shader/vert.vert", "shader/edge_enhancement.frag");
    shader_downsampling_shader = loadShader("shader/vert.vert", "shader/filter.frag");
    shader_dither_shader = loadShader("shader/vert.vert", "shader/dither.frag")
    shader_resampling_shader = loadShader("shader/vert.vert", "shader/resampling.frag");
}

// #endregion

// #region FILE EXCHANGE

function shader_load_image_from_file(file) {
    let file_url = URL.createObjectURL(file.file);
    shader_update_img(loadImage(file_url));
    shader_update_img_ratio();
    display_update_source_image_size();
    display_update_selection(RESET);
    shader_update_selection();
    shader_update_selected_image();
    shader_update_render_buffers_selected_size();
}

function shader_download_image() {
    let dither_algo_index = control_get_selected_index(control_dithering_algo_select);
    if (dither_algo_index < 9) {
        saveCanvas(shader_dither_buffer_cpu, 'image', 'png');
    } else {
        saveCanvas(shader_dither_buffer_gpu, 'image', 'png');
    }
}

// #endregion

// #region RENDERING

function shader_render() {
    if (shader_need_to_rerender) {
        render_lcb();
        render_denoise();
        render_edge();
        render_ee();
        render_ds();
        render_dither();
        render_resampling();
        shader_need_to_rerender = false;
    }
}

function render_lcb() {
    shader_luma_contrast_bright_shader.setUniform('u_tex', shader_selected_img);
    shader_luma_contrast_bright_shader.setUniform('u_sv_depth', control_sv_depth_slider_behavior.shader_value);
    shader_luma_contrast_bright_shader.setUniform('u_luminance_standard', control_get_selected_index(control_luminance_standard_select));
    shader_luma_contrast_bright_shader.setUniform('u_contrast', control_contrast_slider_behavior.shader_value);
    shader_luma_contrast_bright_shader.setUniform('u_brightness', control_brightness_slider_behavior.shader_value);
    shader_luma_contrast_bright_shader.setUniform('u_gamma', control_gamma_slider_behavior.shader_value)
    shader_luma_contrast_bright_buffer.shader(shader_luma_contrast_bright_shader);
    shader_luma_contrast_bright_buffer.rect(0, 0, shader_selected_img.width, shader_selected_img.height);
}

function render_denoise() {
    shader_denoise_shader.setUniform('u_tex', shader_luma_contrast_bright_buffer);
    shader_denoise_shader.setUniform('u_kernel_radius', control_denoise_slider_behavior.shader_value);
    shader_denoise_buffer.shader(shader_denoise_shader);
    shader_denoise_buffer.rect(0, 0, shader_selected_img.width, shader_selected_img.height);
}

function render_edge() {
    shader_edge_detection_shader.setUniform('u_tex', shader_denoise_buffer);
    shader_edge_detection_shader.setUniform('u_edge_threshold', control_edge_threshold_slider_behavior.shader_value);
    shader_edge_detection_shader.setUniform('u_edge_algo', control_get_selected_index(control_edge_algo_select));
    shader_edge_detection_buffer.shader(shader_edge_detection_shader);
    shader_edge_detection_buffer.rect(0, 0, shader_selected_img.width, shader_selected_img.height);
}

function render_ee() {
    shader_edge_enhancement_shader.setUniform('u_tex', shader_denoise_buffer);
    shader_edge_enhancement_shader.setUniform('u_edge_tex', shader_edge_detection_buffer);
    shader_edge_enhancement_shader.setUniform('u_edge_intensity', control_edge_intensity_slider_behavior.shader_value);
    shader_edge_enhancement_shader.setUniform('u_edge_color', control_get_selected_index(control_edge_color_select));
    shader_edge_enhancement_buffer.shader(shader_edge_enhancement_shader);
    shader_edge_enhancement_buffer.rect(0, 0, shader_selected_img.width, shader_selected_img.height);
}

function render_ds() {
    shader_downsampling_shader.setUniform('u_tex', shader_edge_enhancement_buffer);
    shader_downsampling_shader.setUniform('u_filter_algo', control_get_selected_index(control_downsampling_algo_select));
    shader_downsampling_shader.setUniform('u_final_size', [
        shader_final_width, shader_final_height
    ]);
    shader_downsampling_shader.setUniform('u_kernel_radius', control_filter_kernel_radius_slider_behavior.shader_value);
    shader_downsampling_buffer.shader(shader_downsampling_shader);
    shader_downsampling_buffer.rect(0, 0, shader_final_width, shader_final_height);
}

function shaders_dither_kernel(kernel_index) {
    let dither_kernel;
    let dither_coeff;
    switch (kernel_index) {
        case 0:  // None
            dither_kernel = [
                [0]
            ];
            dither_coeff = 1;
            break;
        case 1:  // Floyd-Steinberg
            dither_kernel = [
                [0, 0, 7],
                [3, 5, 1],
                [0, 0, 0]
            ];
            dither_coeff = 1 / 16;
            break;
        case 2:  // Jarvis
            dither_kernel = [
                [0, 0, 0, 7, 5],
                [3, 5, 7, 5, 3],
                [1, 3, 5, 3, 1]
            ];
            dither_coeff = 1 / 48;
            break;
        case 3:  // Stucki
            dither_kernel = [
                [0, 0, 0, 8, 4],
                [2, 4, 8, 4, 1],
                [1, 2, 4, 2, 1]
            ];
            dither_coeff = 1 / 42;
            break;
        case 4:  // Atkinson
            dither_kernel = [
                [0, 0, 0, 1, 1],
                [0, 1, 1, 1, 0],
                [0, 0, 1, 0, 0]
            ];
            dither_coeff = 1 / 8;
            break
        case 5:  // Burkes
            dither_kernel = [
                [0, 0, 0, 8, 4],
                [2, 4, 8, 4, 2],
                [0, 0, 0, 0, 0]
            ];
            dither_coeff = 1 / 32;
            break;
        case 6:  // Sierra
            dither_kernel = [
                [0, 0, 0, 5, 3],
                [2, 4, 5, 4, 2],
                [0, 2, 3, 2, 0]
            ];
            dither_coeff = 1 / 32;
            break;
        case 7:  // Two-Row Sierra
            dither_kernel = [
                [0, 0, 0, 4, 3],
                [1, 2, 3, 2, 1],
                [0, 0, 0, 0, 0]
            ];
            dither_coeff = 1 / 16;
            break;
        case 8:  // Sierra Lite
            dither_kernel = [
                [0, 0, 2],
                [1, 1, 0],
                [0, 0, 0]
            ];
            dither_coeff = 1 / 4;
            break;
    }
    return [dither_kernel, dither_coeff];
}

function shader_closest_color(value) {
    const palette_index = Math.floor(value * (4 / 256));
    const luminance = palette_index * (256 / 4) * (255 / 192);
    let col = shader_palette[palette_index];
    return [luminance, col];

}

function render_dither() {
    let algo_index = control_get_selected_index(control_dithering_algo_select);
    if (algo_index < 9) {
        const dither_params = shaders_dither_kernel(algo_index);
        const kernel = dither_params[0];
        const dither_coeff = dither_params[1];

        const kernel_width = kernel[0].length;
        const kernel_height = kernel.length;

        const errors = new Array(shader_final_height);
        for (let y = 0; y < shader_final_height; ++y) {
            errors[y] = new Array(shader_final_width).fill(0);
        }

        const dithered_image = createImage(shader_final_width, shader_final_height);

        const kernel_max_x = Math.floor(kernel_width / 2);
        const kernel_max_y = Math.floor(kernel_height / 2);

        const error_decay = (255 - control_error_decay_slider_behavior.shader_value) / 255;

        shader_downsampling_buffer.loadPixels();
        dithered_image.loadPixels();

        for (let y = 0; y < shader_final_height; ++y) {
            for (let x = 0; x < shader_final_width; ++x) {
                const index = (shader_final_height - (y + 1)) * shader_final_width + x;
                const current_value = shader_downsampling_buffer.pixels[4 * index] + errors[y][x];
                const closest_color = shader_closest_color(current_value);
                dithered_image.set(x, y, closest_color[1]);
                const new_error = current_value - closest_color[0];
                for (let yk = -kernel_max_y; yk <= kernel_max_y; ++yk) {
                    for (let xk = -kernel_max_x; xk <= kernel_max_x; ++xk) {
                        xe = x + xk;
                        ye = y + yk;
                        if (xe < 0 || xe >= shader_final_width || ye < 0 || ye >= shader_final_height) {
                            continue;
                        }
                        errors[ye][xe] = errors[ye][xe] + (new_error * kernel[yk + kernel_max_y][xk + kernel_max_x] * dither_coeff * error_decay);
                    }
                }
            }
        }

        dithered_image.updatePixels();
        shader_dither_buffer_cpu.image(
            dithered_image,
            -shader_final_width / 2, -shader_final_height / 2, shader_final_width, shader_final_height
        );
    } else {
        shader_dither_shader.setUniform('u_tex', shader_downsampling_buffer);
        shader_dither_shader.setUniform('u_dither_algo', algo_index);
        shader_dither_shader.setUniform('u_colors', [
            red(shader_palette[0]) / 255, green(shader_palette[0]) / 255, blue(shader_palette[0]) / 255,
            red(shader_palette[1]) / 255, green(shader_palette[1]) / 255, blue(shader_palette[1]) / 255,
            red(shader_palette[2]) / 255, green(shader_palette[2]) / 255, blue(shader_palette[2]) / 255,
            red(shader_palette[3]) / 255, green(shader_palette[3]) / 255, blue(shader_palette[3]) / 255
        ]);
        shader_dither_buffer_gpu.shader(shader_dither_shader);
        shader_dither_buffer_gpu.rect(0, 0, shader_final_width, shader_final_height);
    }
}

function render_resampling() {
    let dither_algo_index = control_get_selected_index(control_dithering_algo_select);
    if (dither_algo_index < 9) {
        shader_resampling_shader.setUniform('u_tex', shader_dither_buffer_cpu);
    } else {
        shader_resampling_shader.setUniform('u_tex', shader_dither_buffer_gpu);
    }
    shader_resampling_buffer.shader(shader_resampling_shader);
    shader_resampling_buffer.rect(0, 0, display_shaded_image_width, display_shaded_image_height);
}

// #endregion

// #region UPDATE

function shader_update_img(img) {
    shader_img = img;
    setTimeout(() => { shader_need_to_rerender = true; }, 1000);
}

function shader_update_img_ratio() {
    shader_img_ratio = shader_img.width / shader_img.height;
}

function shader_update_selection() {
    const w_scale_factor = shader_img.width / display_source_image_width;
    const h_scale_factor = shader_img.height / display_source_image_height;
    shader_selection_x = (display_selection_x - display_source_image_x) * w_scale_factor;
    shader_selection_y = (display_selection_y - display_source_image_y) * h_scale_factor;
    shader_selection_width = max(display_selection_width * w_scale_factor, 1);
    shader_selection_height = max(display_selection_height * h_scale_factor, 1);
}

function shader_update_selected_image() {
    shader_selected_img = shader_img.get(
        shader_selection_x, shader_selection_y,
        shader_selection_width, shader_selection_height
    );
}

function shader_update_final_size() {
    shader_final_width = parseInt(control_final_width_input.value());
    shader_final_height = parseInt(control_final_height_input.value());
}

function shader_update_final_img_ratio() {
    shader_final_image_ratio = shader_final_width / shader_final_height;
}

function shader_update_render_buffers_selected_size() {
    shader_luma_contrast_bright_buffer.resizeCanvas(shader_selection_width, shader_selection_height);
    shader_edge_detection_buffer.resizeCanvas(shader_selection_width, shader_selection_height);
    shader_edge_enhancement_buffer.resizeCanvas(shader_selection_width, shader_selection_height);

    shader_resampling_buffer.resizeCanvas(display_shaded_image_width, display_shaded_image_height);
}

function shader_update_render_buffers_final_size() {
    shader_downsampling_buffer.resizeCanvas(shader_final_width, shader_final_height);
    shader_dither_buffer_cpu.resizeCanvas(shader_final_width, shader_final_height);
}

// #endregion
