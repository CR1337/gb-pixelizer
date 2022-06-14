let control_font;
const control_font_size = 18;

const control_label_width = 256
const control_width = 400;
const control_height = 26;

let control_selection_fixed = true;

let control_image_file_input;
let control_final_width_input, final_height_input;
let control_fix_aspect_checkbox;
let control_sv_depth_slider;
let control_luminance_standard_select;
let control_contrast_slider;
let control_brightness_slider;
let control_gamma_slider;
let control_denoise_slider;
let control_edge_algo_select;
let control_edge_threshold_slider;
let control_edge_intensity_slider;
let control_edge_color_select;
let control_downsampling_algo_select;
let control_dithering_algo_select;
let control_filter_kernel_radius_slider;
let control_error_decay_slider;
let control_palette_select;
let control_color_pickers = [];
let control_reset_button;
let control_settings_file_input;
let control_download_settings_button;
let control_download_image_button;

let control_initial_colors = [];

const control_sv_depth_slider_behavior = {
    min: 2,
    max: 8,
    default: 8,
    get shader_value() { return control_sv_depth_slider.value(); },
    get display_string() { return this.shader_value.toString(); }
};

const control_contrast_slider_behavior = {
    min: 0,
    max: 1000,
    default: 500,
    get shader_value() { return control_contrast_slider.value() / this.max; },
    get display_string() {
        return (this.shader_value * 100).toFixed(1) + " %";
    }
};

const control_brightness_slider_behavior = {
    min: 0,
    max: 1000,
    default: 500,
    get shader_value() { return control_brightness_slider.value() / this.max; },
    get display_string() {
        return (this.shader_value * 100).toFixed(1) + " %";
    }
};

const control_gamma_slider_behavior = {
    _max: 5,
    min: 0,
    max: 50,
    get default() { return (Math.log(1 + 1) / Math.log(this._max + 1)) * (this.max); },
    get shader_value() { return Math.pow(this._max + 1, control_gamma_slider.value() / this.max) - 1; },
    get display_string() {
        return this.shader_value.toFixed(1);
    }
};

const control_denoise_slider_behavior = {
    min: 0,
    max: 8,
    default: 0,
    get shader_value() { return control_denoise_slider.value(); },
    get display_string() {
        return this.shader_value.toString();
    }
};

const control_edge_threshold_slider_behavior = {
    min: 0,
    max: 255,
    default: 127,
    get shader_value() { return control_edge_threshold_slider.value() / this.max; },
    get display_string() {
        return (this.shader_value * this.max).toString();
    }
};

const control_edge_intensity_slider_behavior = {
    min: 0,
    max: 1000,
    default: 500,
    get shader_value() { return control_edge_intensity_slider.value() / this.max; },
    get display_string() {
        return (this.shader_value * 100).toFixed(1) + " %";
    }
};

const control_filter_kernel_radius_slider_behavior = {
    min: 1,
    max: 8,
    default: 2,
    get shader_value() { return control_filter_kernel_radius_slider.value(); },
    get display_string() {
        return this.shader_value.toString();
    }
};

const control_error_decay_slider_behavior = {
    min: 0,
    max: 1000,
    default: 0,
    get shader_value() { return control_error_decay_slider.value() / this.max; },
    get display_string() {
        return (this.shader_value * 100).toFixed(1) + " %";
    }
};

class ControlSettings {
    constructor (
        final_width, final_height, sv_depth, luminance_standard,
        contrast, brightness, gamma, denoise, edge_algo, edge_threshold, edge_intensity,
        edge_color, downsampling_algo, dithering_algo, filter_kernel,
        error_decay, palette, custom_colors
    ) {
        this.final_width = final_width;
        this.final_height = final_height;
        this.sv_depth = sv_depth;
        this.luminance_standard = luminance_standard;
        this.contrast = contrast;
        this.brightness = brightness;
        this.gamma = gamma;
        this.denoise = denoise;
        this.egde_algo = edge_algo;
        this.edge_threshold = edge_threshold;
        this.edge_intensity = edge_intensity;
        this.edge_color = edge_color;
        this.downsampling_algo = downsampling_algo;
        this.dithering_algo = dithering_algo;
        this.filter_kernel = filter_kernel;
        this.error_decay = error_decay;
        this.palette = palette;
        this.custom_colors = custom_colors;
    }

    apply() {
        try {
            control_final_width_input.value(this.final_width);
            control_final_height_input.value(this.final_height);
            control_sv_depth_slider.value(this.sv_depth);
            control_luminance_standard_select.selected(this.luminance_standard);
            control_contrast_slider.value(this.contrast);
            control_brightness_slider.value(this.brightness);
            control_gamma_slider.value(this.gamma);
            control_denoise_slider.value(this.denoise);
            control_edge_algo_select.selected(this.edge_algo);
            control_edge_threshold_slider.value(this.edge_threshold);
            control_edge_intensity_slider.value(this.edge_intensity);
            control_edge_color_select.selected(this.edge_color);
            control_downsampling_algo_select.selected(this.downsampling_algo);
            control_filter_kernel_radius_slider.value(this.filter_kernel);
            control_dithering_algo_select.selected(this.dithering_algo);
            control_error_decay_slider.value(this.error_decay);
            control_palette_select.selected(this.palette);
            for (let i = 0; i < 4; ++i) {
                control_color_pickers[i].value(this.custom_colors[i]);
            }
        } catch (error) {
            console.log(error);
            alert("Incompatible file content!");
            control_reset();
        }
    }

    static from_json(json) {
        return new ControlSettings(
            json['final_width'],
            json['final_height'],
            json['sv_depth'],
            json['luminance_standard'],
            json['contrast'],
            json['brightness'],
            json['gamma'],
            json['denoise'],
            json['edge_algo'],
            json['edge_threshold'],
            json['edge_intensity'],
            json['edge_color'],
            json['downsampling_algo'],
            json['dithering_algo'],
            json['filter_kernel'],
            json['error_decay'],
            json['palette'],
            json['custom_colors']
        );
    }

    to_json() {
        return JSON.stringify(this);
    }
}

function control_load_font() {
    control_font = loadFont("fonts/consolas.ttf");
}

function control_set_input_filter(input, filter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function(event) {
        input.addEventListener(event, function() {
            if (filter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            } else {
                this.value = "";
            }
        });
    });
}

function control_int_input_filter_factory(min_value, max_value) {
    return (value) => {
        return /^\d*$/.test(value)
            && (parseInt(value) >= min_value
            || parseInt(value) <= max_value
            || value == "");
    }
}

function control_add_slider(x_pos, y_pos, min_value, max_value, start_value, step=1) {
    let slider = createSlider(min_value, max_value, start_value, step);
    slider.position(x_pos, y_pos);
    slider.style('width', control_width.toString() + "px");
    slider.style('height', control_height.toString() + "px");
    slider.addClass('slider');
    return slider;
}

function control_add_select(x_pos, y_pos, options, selected_index) {
    let select = createSelect();
    select.position(x_pos, y_pos);
    select.style('width', control_width.toString() + "px");
    select.style('height', control_height.toString() + "px");
    for (let option of options) {
        select.option(option);
    }
    select.selected(options[selected_index]);
    select.addClass('select');
    return select;
}

function control_add_number_input(x_pos, y_pos, width, min_value, max_value, start_value) {
    let input = createInput(start_value.toString());
    input.position(x_pos, y_pos);
    input.size(width);
    input.style('height', control_height.toString() + "px");
    control_set_input_filter(input.elt, control_int_input_filter_factory(min_value, max_value));
    input.addClass('number_input');
    return input;
}

function control_add_checkbox(x_pos, y_pos, label, start_value) {
    let checkbox = createCheckbox(label, start_value);
    checkbox.position(x_pos, y_pos);
    checkbox.style('color', '#FFFFFF');
    checkbox.addClass('checkbox');
    return checkbox;
}

function control_add_button(x_pos, y_pos, label, handler) {
    let button = createButton(label);
    button.position(x_pos, y_pos);
    button.size(control_width);
    button.style('height', control_height.toString() + "px");
    button.mousePressed(handler);
    button.addClass('button');
    return button;
}

function control_add_file_input(x_pos, y_pos, handler, multiple=false) {
    let file_input = createFileInput(handler, multiple);
    file_input.position(x_pos, y_pos);
    file_input.style('width', control_width.toString() + "px");
    file_input.style('height', control_height.toString() + "px");
    file_input.addClass('file_input');
    return file_input;
}

function control_add_color_picker(x_pos, y_pos, width, start_color) {
    let color_picker = createColorPicker(start_color);
    color_picker.position(x_pos, y_pos);
    color_picker.style('width', width + "px");
    color_picker.style('height', control_height.toString() + "px");
    color_picker.addClass('color_picker');
    return color_picker;
}

function control_add_link(x_pos, y_pos, href, text, target) {
    let link = createA(href, text, target);
    link.position(x_pos, y_pos);
    link.addClass('link');
    return link;
}

function control_reset() {
    control_sv_depth_slider.value(control_sv_depth_slider_behavior.default);
    control_luminance_standard_select.elt.selectedIndex = 1;
    control_contrast_slider.value(control_contrast_slider_behavior.default);
    control_brightness_slider.value(control_brightness_slider_behavior.default);
    control_gamma_slider.value(control_gamma_slider_behavior.default);
    control_denoise_slider.value(control_denoise_slider_behavior.default);
    control_edge_algo_select.elt.selectedIndex = 0;
    control_edge_threshold_slider.value(control_edge_threshold_slider_behavior.default);
    control_edge_intensity_slider.value(control_edge_intensity_slider_behavior.default);
    control_edge_color_select.elt.selectedIndex = 0;
    control_downsampling_algo_select.elt.selectedIndex = 5;
    control_filter_kernel_radius_slider.value(control_filter_kernel_radius_slider_behavior.default);
    control_dithering_algo_select.elt.selectedIndex = 0;
    control_error_decay_slider.value(control_error_decay_slider_behavior.default);
    control_palette_select.elt.selectedIndex = 1;
    for (let i = 0; i < 4; ++i) {
        control_color_pickers[i].value(control_initial_colors[i].toString('#rrggbb'));
    }
    shader_palette = [...shader_green_palette]
    shader_need_to_rerender = true;
}

function control_settings_file_input_handler(file) {
    settings = ControlSettings.from_json(file.data);
    settings.apply();
    control_settings_file_input.value(null);
    shader_need_to_rerender = true;
}

function control_download_settings_button_handler() {
    let settings = new ControlSettings(
        control_final_width_input.value(),
        control_final_height_input.value(),
        control_sv_depth_slider.value(),
        control_luminance_standard_select.selected(),
        control_contrast_slider.value(),
        control_brightness_slider.value(),
        control_gamma_slider.value(),
        control_denoise_slider.value(),
        control_edge_algo_select.selected(),
        control_edge_threshold_slider.value(),
        control_edge_intensity_slider.value(),
        control_edge_color_select.selected(),
        control_downsampling_algo_select.selected(),
        control_dithering_algo_select.selected(),
        control_filter_kernel_radius_slider.value(),
        control_error_decay_slider.value(),
        control_palette_select.selected(),
        [
            color(control_color_pickers[0].value()).toString('#rrggbb'),
            color(control_color_pickers[1].value()).toString('#rrggbb'),
            color(control_color_pickers[2].value()).toString('#rrggbb'),
            color(control_color_pickers[3].value()).toString('#rrggbb'),
        ]
    );
    let json = settings.to_json();
    const a = document.createElement('a');
    const name = "settings.json";
    const type = name.split(".").pop();
    a.href = URL.createObjectURL( new Blob([json], { type:`json/${type === "txt" ? "plain" : type}` }) );
    a.download = name;
    a.click();
}

function control_add_controls(
    x_offset, file_input_handler, download_image_button_handler
) {
    let counter = 0;

    control_image_file_input = control_add_file_input(
        x_offset, (counter + 1) * margin + counter * control_height,
        file_input_handler
    );
    counter++;

    const resolution_input_width = control_width / 2 - margin ;
    control_final_width_input = control_add_number_input(
        x_offset, (counter + 1) * margin + counter * control_height,
        resolution_input_width,
        0, 2040, 160
    );
    control_final_width_input.changed(on_control_final_size_changed);
    control_final_height_input = control_add_number_input(
        x_offset + resolution_input_width + margin, (counter + 1) * margin + counter * control_height,
        resolution_input_width,
        0, 2040, 144
    );
    control_final_height_input.changed(on_control_final_size_changed);
    counter++;

    control_fix_aspect_checkbox = control_add_checkbox(
        x_offset, (counter + 1) * margin + counter * control_height,
        "Fix selection aspect ratio", true
    );
    control_fix_aspect_checkbox.changed(on_control_fix_aspect_checkbox_changed);
    counter++;

    control_sv_depth_slider = control_add_slider(
        x_offset, (counter + 1) * margin + counter * control_height,
        control_sv_depth_slider_behavior.min,
        control_sv_depth_slider_behavior.max,
        control_sv_depth_slider_behavior.default
    );
    control_sv_depth_slider.elt.oninput=on_control_sv_depth_changed;
    counter++;


    control_luminance_standard_select = control_add_select(
        x_offset, (counter + 1) * margin + counter * control_height,
        [
            "Averaging",  // (r+g+b)/ 3
            "BT.709",  // (r*0.2126+g*0.7152+b*0.0722)
            "BT.601",  // (r*0.299+g*0.587+b*0.114)
            "Desaturation",  //(max(r, g, b)+min(r, g, b)) / 2
            "Max decomposition",  //max(r, g, b)
            "Min decomposition",  //min(r, g, b)
            "Red",  // r
            "Green",  // g
            "Blue"  // b
        ],
        1
    );
    control_luminance_standard_select.changed(on_control_luma_contrast_bright_changed);
    counter++;

    control_contrast_slider = control_add_slider(
        x_offset, (counter + 1) * margin + counter * control_height,
        control_contrast_slider_behavior.min,
        control_contrast_slider_behavior.max,
        control_contrast_slider_behavior.default
    );
    control_contrast_slider.elt.oninput=on_control_luma_contrast_bright_changed;
    counter++;

    control_brightness_slider = control_add_slider(
        x_offset, (counter + 1) * margin + counter * control_height,
        control_brightness_slider_behavior.min,
        control_brightness_slider_behavior.max,
        control_brightness_slider_behavior.default
    );
    control_brightness_slider.elt.oninput = on_control_luma_contrast_bright_changed;
    counter++;

    control_gamma_slider = control_add_slider(
        x_offset, (counter + 1) * margin + counter * control_height,
        control_gamma_slider_behavior.min,
        control_gamma_slider_behavior.max,
        control_gamma_slider_behavior.default
    );
    control_gamma_slider.elt.oninput = on_control_luma_contrast_bright_changed;
    counter++;

    control_denoise_slider = control_add_slider(
        x_offset, (counter + 1) * margin + counter * control_height,
        control_denoise_slider_behavior.min,
        control_denoise_slider_behavior.max,
        control_denoise_slider_behavior.default
    );
    control_denoise_slider.elt.oninput=on_control_denoise_changed;
    counter++;

    control_edge_algo_select = control_add_select(
        x_offset, (counter + 1) * margin + counter * control_height,
        [
            "Sobel",
            "Scharr",
            "Prewitt"
        ],
        0
    );
    control_edge_algo_select.changed(on_control_edge_detection_changed);
    counter++;

    control_edge_threshold_slider = control_add_slider(
        x_offset, (counter + 1) * margin + counter * control_height,
        control_edge_threshold_slider_behavior.min,
        control_edge_threshold_slider_behavior.max,
        control_edge_threshold_slider_behavior.default
    );
    control_edge_threshold_slider.elt.oninput = on_control_edge_detection_changed;
    counter++;

    control_edge_intensity_slider = control_add_slider(
        x_offset, (counter + 1) * margin + counter * control_height,
        control_edge_intensity_slider_behavior.min,
        control_edge_intensity_slider_behavior.max,
        control_edge_intensity_slider_behavior.default
    );
    control_edge_intensity_slider.elt.oninput = on_control_edge_enhancement_changed;
    counter++;

    control_edge_color_select = control_add_select(
        x_offset, (counter + 1) * margin + counter * control_height,
        [
            "Black",
            "White",
            "Nearest"
        ],
        0
    );
    control_edge_color_select.changed(on_control_edge_enhancement_changed);
    counter++;

    control_downsampling_algo_select = control_add_select(
        x_offset, (counter + 1) * margin + counter * control_height,
        [
            "Nearest",
            "Bilinear",
            "Bicubic",
            "Lanczos 2",
            "Lanczos 3",
            "Magic Sharp"
        ],
        5
    );
    control_downsampling_algo_select.changed(on_control_downsampling_changed);
    counter++;

    control_filter_kernel_radius_slider = control_add_slider(
        x_offset, (counter + 1) * margin + counter * control_height,
        control_filter_kernel_radius_slider_behavior.min,
        control_filter_kernel_radius_slider_behavior.max,
        control_filter_kernel_radius_slider_behavior.default
    );
    control_filter_kernel_radius_slider.elt.oninput = on_control_downsampling_changed;
    counter++;

    control_dithering_algo_select = control_add_select(
        x_offset, (counter + 1) * margin + counter * control_height,
        [
            "None",
            "Floyd-Steinberg",
            "Jarvis",
            "Stucki",
            "Atkinson",
            "Burkes",
            "Sierra",
            "Two row Sierra",
            "Sierra lite",
            "Ordered 2x2",
            "Ordered 4x4",
            "Ordered 8x8"
        ],
        0
    );
    control_dithering_algo_select.changed(on_control_dithering_changed);
    counter++;

    control_error_decay_slider = control_add_slider(
        x_offset, (counter + 1) * margin + counter * control_height,
        control_error_decay_slider_behavior.min,
        control_error_decay_slider_behavior.max,
        control_error_decay_slider_behavior.default
    );
    control_error_decay_slider.elt.oninput = on_control_dithering_changed
    counter++;

    control_palette_select = control_add_select(
        x_offset, (counter + 1) * margin + counter * control_height,
        [
            "Gray",
            "Green (GB Studio compatible)",
            "Custom..."
        ],
        1
    );
    control_palette_select.changed(on_control_palette_changed);
    counter++;

    for (let i = 0; i < 4; ++i) {
        const width = control_width / 4 - (3 / 4) * margin;
        control_color_pickers[i] = control_add_color_picker(
            x_offset + i * (width + margin), (counter + 1) * margin + counter * control_height,
            width, control_initial_colors[i]
        );
        control_color_pickers[i].elt.oninput = on_control_palette_changed;
    }
    counter++;

    control_reset_button = control_add_button(
        x_offset, (counter + 1) * margin + counter * control_height,
        "Reset", control_reset
    );
    counter++;

    control_settings_file_input = control_add_file_input(
        x_offset, (counter + 1) * margin + counter * control_height,
        control_settings_file_input_handler
    );
    control_settings_file_input.elt.id = "settings_file_input";
    counter++;

    control_download_settings_button = control_add_button(
        x_offset, (counter + 1) * margin + counter * control_height,
        "Download settings", control_download_settings_button_handler
    );
    counter++;

    control_download_image_button = control_add_button(
        x_offset, (counter + 1) * margin + counter * control_height,
        "Download image", download_image_button_handler
    );
    counter++;

    control_add_link(
        x_offset, (counter + 1) * margin + counter * control_height,
        "https://icons8.com/", "Icons8", "_blank"
    );

    // control_add_link(
    //     x_offset, (counter + 1) * margin + counter * control_height,
    //     "/about.html", "About", "_blank"
    // );
    // control_add_link(
    //     x_offset + 64, (counter + 1) * margin + counter * control_height,
    //     "/help.html", "Help", "_blank"
    // );
    // control_add_link(
    //     x_offset + 120, (counter + 1) * margin + counter * control_height,
    //     "/documentation.html", "Documentation", "_blank"
    // );
}

function control_get_selected_index(select) {
    return select.elt.selectedIndex;
}

function control_draw_labels(x_offset) {
    push();
    fill('#ffffff');
    textFont(control_font);
    textSize(control_font_size);

    labels = [
        "Upload image:",
        "Final resolution:",
        "",
        "SV depth:",
        "Luminance standard:",
        "Contrast:",
        "Brightness:",
        "Gamma:",
        "Denoise:",
        "Edge Algorithm:",
        "Edge threshold:",
        "Edge intensity:",
        "Edge color:",
        "Downsampling algorithm:",
        "Filter kernel radius",
        "Dithering algorithm:",
        "Dithering error decay:",
        "Palette:",
        "Custom palette:",
        "",
        "Upload settings:"
    ]
    let counter = 0;
    for (let label of labels) {
        text(label, x_offset, (counter + 1) * margin + (counter) * control_height + control_height / 2);
        counter++;
    }
    pop();
}

function control_draw_values(x_offset) {
    push();
    fill('#ffffff');
    textFont(control_font);
    textSize(control_font_size);

    let counter = 3;
    text(
        control_sv_depth_slider_behavior.display_string,
        x_offset, (counter + 1) * margin + (counter) * control_height + control_height / 2
    );
    counter += 2;
    text(
        control_contrast_slider_behavior.display_string,
        x_offset, (counter + 1) * margin + (counter) * control_height + control_height / 2
    );
    counter++;
    text(
        control_brightness_slider_behavior.display_string,
        x_offset, (counter + 1) * margin + (counter) * control_height + control_height / 2
    );
    counter++;
    text(
        control_gamma_slider_behavior.display_string,
        x_offset, (counter + 1) * margin + (counter) * control_height + control_height / 2
    );
    counter++;
    text(
        control_denoise_slider_behavior.display_string,
        x_offset, (counter + 1) * margin + (counter) * control_height + control_height / 2
    );
    counter += 2;
    text(
        control_edge_threshold_slider_behavior.display_string,
        x_offset, (counter + 1) * margin + (counter) * control_height + control_height / 2
    );
    counter++;
    text(
        control_edge_intensity_slider_behavior.display_string,
        x_offset, (counter + 1) * margin + (counter) * control_height + control_height / 2
    );
    counter +=3;
    text(
        control_filter_kernel_radius_slider_behavior.display_string,
        x_offset, (counter + 1) * margin + (counter) * control_height + control_height / 2
    );
    counter +=2;
    text(
        control_error_decay_slider_behavior.display_string,
        x_offset, (counter + 1) * margin + (counter) * control_height + control_height / 2
    );
    pop();
}

function control_resize_controls() {
    let final_width_input_value = control_final_width_input.value();
    let final_height_input_value = control_final_height_input.value();
    let fix_aspect_checkbox_value = control_fix_aspect_checkbox.checked();
    let sv_depth_value = control_sv_depth_slider.value();
    let luminance_standard_select_value = control_luminance_standard_select.selected();
    let contrast_slider_value = control_contrast_slider.value();
    let brightness_slider_value = control_brightness_slider.value();
    let gamma_slider_value = control_gamma_slider.value();
    let denoise_slider_value = control_denoise_slider.value();
    let edge_algo = control_edge_algo_select.selected();
    let edge_threshold_slider_value = control_edge_threshold_slider.value();
    let edge_intensity_slider_value = control_edge_intensity_slider.value();
    let edge_color_select_value = control_edge_color_select.selected();
    let downsampling_algo_select_value = control_downsampling_algo_select.selected();
    let filter_kernel_radius_value = control_filter_kernel_radius_slider.value();
    let dithering_algo_select_value = control_dithering_algo_select.selected();
    let error_decay_slider_value = control_error_decay_slider.value();
    let palette_select_value = control_palette_select.selected();
    let color_picker_values = []
    for (let i = 0; i < 4; ++i) {
        color_picker_values.push(control_color_pickers[i].value());
    }
    removeElements();
    control_add_controls(
        2 * margin + display_width + control_label_width,
        shader_load_image_from_file, shader_download_image
    );
    control_final_width_input.value(final_width_input_value);
    control_final_height_input.value(final_height_input_value);
    control_fix_aspect_checkbox.checked(fix_aspect_checkbox_value);
    control_sv_depth_slider.value(sv_depth_value);
    control_luminance_standard_select.selected(luminance_standard_select_value);
    control_contrast_slider.value(contrast_slider_value);
    control_brightness_slider.value(brightness_slider_value);
    control_gamma_slider.value(gamma_slider_value);
    control_denoise_slider.value(denoise_slider_value);
    control_edge_algo_select.selected(edge_algo);
    control_edge_threshold_slider.value(edge_threshold_slider_value);
    control_edge_intensity_slider.value(edge_intensity_slider_value);
    control_edge_color_select.selected(edge_color_select_value);
    control_downsampling_algo_select.selected(downsampling_algo_select_value);
    control_filter_kernel_radius_slider.value(filter_kernel_radius_value);
    control_dithering_algo_select.selected(dithering_algo_select_value);
    control_error_decay_slider.value(error_decay_slider_value);
    control_palette_select.selected(palette_select_value);
    for (let i = 0; i < 4; ++i) {
        control_color_pickers[i].value(color_picker_values[i]);
    }
}

function on_control_final_size_changed() {
    let width = parseInt(control_final_width_input.value());
    let height = parseInt(control_final_height_input.value());
    if (isNaN(width)) {
        width = 8;
    }
    if (isNaN(height)) {
        height = 8;
    }
    width = max(width - width % 8, 8);
    height = max(height - height % 8, 8);
    control_final_width_input.value(width.toString());
    control_final_height_input.value(height.toString());

    shader_update_final_size();
    shader_update_final_img_ratio();
    display_update_shaded_image_size();
    shader_update_render_buffers_final_size();

    display_update_selection(FIX);
    shader_update_selection();
    shader_update_selected_image();
    shader_update_render_buffers_selected_size();
    shader_need_to_rerender = true;
}

function on_control_fix_aspect_checkbox_changed(){
    control_selection_fixed = control_fix_aspect_checkbox.checked();

    display_update_selection(FIX);
    shader_update_selection();
    shader_update_selected_image();
    shader_update_render_buffers_selected_size();
    shader_need_to_rerender = true;
}

function on_control_sv_depth_changed() {
    shader_need_to_rerender = true;
}

function on_control_luma_contrast_bright_changed() {
    shader_need_to_rerender = true;
}

function on_control_denoise_changed() {
    shader_need_to_rerender = true;
}

function on_control_edge_detection_changed() {
    shader_need_to_rerender = true;
}

function on_control_edge_enhancement_changed() {
    shader_need_to_rerender = true;
}

function on_control_downsampling_changed() {
    shader_need_to_rerender = true;
}

function on_control_dithering_changed() {
    shader_need_to_rerender = true;
    setTimeout(() => { shader_need_to_rerender = true; }, 500);
}

function on_control_palette_changed() {
    for (let i = 0; i < 4; ++i) {
        let c = color(control_color_pickers[i].value());
        c.setRed(Math.floor(red(c) / 8) * 8);
        c.setGreen(Math.floor(green(c) / 8) * 8);
        c.setBlue(Math.floor(blue(c) / 8) * 8);
        control_color_pickers[i].value(c.toString('#rrggbb'));
    }

    switch (control_get_selected_index(control_palette_select)) {
        case 0:
            shader_palette = [...shader_gray_palette];
            break;

        case 1:
            shader_palette = [...shader_green_palette];
            break;

        case 2:
            for (let i = 0; i < 4; ++i) {
                let c = color(control_color_pickers[i].value());
                shader_palette[i] = c;
            }
            break;
    }

    on_control_dithering_changed();
    shader_need_to_rerender = true;
}
