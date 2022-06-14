// #region GLOBALS

const display_ratio = 10 / 9

let display_width;
let display_height;
let display_prev_width;
let display_prev_height;
let display_source_image_x;
let display_source_image_y;
let display_source_image_width;
let display_source_image_height;
let display_shaded_image_x;
let display_shaded_image_y
let display_shaded_image_width;
let display_shaded_image_height;

let display_selecting = false;

let display_selection_x;
let display_selection_y;
let display_selection_width;
let display_selection_height;
let display_selection_start_x;
let display_selection_start_y;

// #endregion

// #region DRAWING

function dsiplay_draw_background() {
    fill(0, 0, 0);
    rect(margin, margin, display_width, display_height);
    rect(margin, 2 * margin + display_height, display_width, display_height);
}

function display_draw_source_image(img) {
    image(
        img,
        display_source_image_x,
        display_source_image_y,
        display_source_image_width,
        display_source_image_height
    );
}

function display_draw_shaded_image(img) {
    image(
        img,
        display_shaded_image_x,
        display_shaded_image_y,
        display_shaded_image_width,
        display_shaded_image_height
    );
}

function display_draw_selection() {
    push();
    noFill();
    strokeWeight(1);
    stroke(255, 0, 0);
    rect(
        display_selection_x, display_selection_y,
        display_selection_width, display_selection_height
    )
    pop();
}

// #endregion

// #region UPDATE

function display_update_size() {
    const height = (windowHeight - 3 * margin) / 2;
    const width = display_ratio * height;

    display_prev_width = (display_width == null)
        ? width : display_width;
    display_prev_height = (display_height == null)
        ? height : display_height;

    display_width = width;
    display_height = height;
}

function display_update_source_image_size() {
    if (shader_img_ratio > display_ratio) {
        display_source_image_x = margin;
        display_source_image_y = margin + (display_height - (display_width / shader_img_ratio)) / 2;
        display_source_image_width = display_width;
        display_source_image_height = display_width / shader_img_ratio;
    } else {
        display_source_image_x = margin + (display_width - (display_height * shader_img_ratio)) / 2;
        display_source_image_y = margin;
        display_source_image_width = display_height * shader_img_ratio;
        display_source_image_height = display_height;
    }
}

function display_update_shaded_image_size() {
    const y_offset = margin + display_height;
    if (shader_final_image_ratio > display_ratio) {
        display_shaded_image_x = margin;
        display_shaded_image_y = margin + (display_height - (display_width / shader_final_image_ratio)) / 2 + y_offset;
        display_shaded_image_width = display_width;
        display_shaded_image_height = display_width / shader_final_image_ratio;
    } else {
        display_shaded_image_x = margin + (display_width - (display_height * shader_final_image_ratio)) / 2;
        display_shaded_image_y = margin + y_offset;
        display_shaded_image_width = display_height * shader_final_image_ratio;
        display_shaded_image_height = display_height;
    }
}

const INITIAL = Symbol('initial');
const RESET = Symbol('initial');
const RESIZE = Symbol('initial');
const DRAG = Symbol('initial');
const FIX = Symbol('fix')

function display_update_selection(mode) {
    switch (mode) {
        case INITIAL:
            display_selection_start_x = min(
                max(display_source_image_x, mouseX),
                display_source_image_x + display_source_image_width
            );
            display_selection_start_y =  min(
                max(display_source_image_y, mouseY),
                display_source_image_y + display_source_image_height
            );
            display_selection_x = display_selection_start_x;
            display_selection_y = display_selection_start_y;
            display_selection_width = 0;
            display_selection_height = 0;
            break;

        case RESET:
            display_selection_x = display_source_image_x;
            display_selection_y = display_source_image_y;
            display_selection_width = display_source_image_width;
            display_selection_height = display_source_image_height;
            break;

        case RESIZE:
            const w_scale_factor =  display_source_image_width / shader_img.width;
            const h_scale_factor =  display_source_image_height / shader_img.height;
            display_selection_x = shader_selection_x * w_scale_factor + display_source_image_x;
            display_selection_y = shader_selection_y * h_scale_factor + display_source_image_y;
            display_selection_width = shader_selection_width * w_scale_factor;
            display_selection_height = shader_selection_height * h_scale_factor;
            break;

        case DRAG:
            if (mouseX < display_selection_start_x) {
                display_selection_x = min(
                    max(display_source_image_x, mouseX),
                    display_source_image_x + display_source_image_width
                );
                display_selection_width = display_selection_start_x - mouseX;
            } else {
                display_selection_x = display_selection_start_x;
                display_selection_width = min(
                    max(display_source_image_x, mouseX),
                    display_source_image_x + display_source_image_width
                ) - display_selection_start_x;
            }
            if (mouseY < display_selection_start_y) {
                display_selection_y = min(
                    max(display_source_image_y, mouseY),
                    display_source_image_y + display_source_image_height
                );
                display_selection_height = display_selection_start_y - mouseY;
            } else {
                display_selection_y = display_selection_start_y;
                display_selection_height = min(
                    max(display_source_image_y, mouseY),
                    display_source_image_y + display_source_image_height
                ) - display_selection_start_y;
            }
            break;
    }
    if (control_selection_fixed) {
        const selection_ratio = display_selection_width / display_selection_height;
        if (selection_ratio > shader_final_image_ratio) {
            const fixed_width = (display_selection_width / selection_ratio) * shader_final_image_ratio;
            const delta_width = display_selection_width - fixed_width;
            display_selection_width = fixed_width;
            if (mouseX < display_selection_start_x && mode == DRAG)
                display_selection_x += delta_width;
        } else {
            const fixed_height = (display_selection_height * selection_ratio) / shader_final_image_ratio;
            const delta_height = display_selection_height - fixed_height;
            display_selection_height = fixed_height;
            if (mouseY < display_selection_start_y && mode == DRAG)
                display_selection_y += delta_height;
        }
    }
}

// #endregion

// #region MISC

function display_selection_possible(x, y) {
    return !(
        x >= 2 * margin + display_width
        || y >= 2 * margin + display_height
    );
}

// #endregion
