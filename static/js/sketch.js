/*
TODO:
Kernel filter upsampling

out of bounds selection

About
Help
Documentation
*/

p5.RendererGL.prototype._initContext = function() {
  try {
    this.drawingContext =
      this.canvas.getContext('webgl2', this._pInst._glAttributes);// ||
      // this.canvas.getContext('experimental-webgl', this._pInst._glAttributes);
    if (this.drawingContext === null) {
      throw new Error('Error creating webgl context');
    } else {
      const gl = this.drawingContext;
      gl.getExtension('OES_standard_derivatives');
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this._viewport = this.drawingContext.getParameter(
        this.drawingContext.VIEWPORT
      );
    }
  } catch (er) {
    throw er;
  }
};


// p5.RendererGL.prototype._initContext = function() {
//   this.drawingContext=this.elt.getContext('webgl2');
// }


const margin = 8;

function preload() {
  shader_load_image();
  shader_load_shaders();
  control_load_font();
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  frameRate(30);

  shader_green_palette = [
    color('#071821'),
    color('#306850'),
    color('#86c06c'),
    color('#e0f8cf')
  ];

  shader_gray_palette = [
    color('#000000'),
    color('#525252'),
    color('#a4a4a4'),
    color('#f8f8f8')
  ]

  control_initial_colors = [
    color('#2f2643'),
    color('#8f263a'),
    color('#c67e6c'),
    color('#f3e0d5')
  ]

  shader_palette = [...shader_green_palette];

  control_add_controls(
    2 * margin + display_width + control_label_width,
    shader_load_image_from_file, shader_download_image
  );

  shader_update_final_size();
  display_update_size();
  shader_update_img(shader_initial_img);
  shader_create_render_buffers_final_size();
  shader_update_final_img_ratio();
  display_update_shaded_image_size();
  shader_update_img_ratio();
  display_update_source_image_size();
  display_update_selection(RESET);
  shader_update_selection();
  shader_update_selected_image();
  shader_create_render_buffers_selected_size();

  control_resize_controls();
}

function fileDropped(file) {
  load_image_from_file(file);
}

function mousePressed() {
  if (display_selection_possible(mouseX, mouseY)) {
    display_selecting = true;
    display_update_selection(INITIAL);
  }
}

function mouseDragged() {
  if (display_selecting) {
    display_update_selection(DRAG);
  }
}

function mouseMoved() {
  cursor(
    display_selection_possible(mouseX, mouseY)
      ? CROSS : ARROW
  );
}

function mouseReleased() {
  if (display_draw_selection) {
    display_selecting = false;

    shader_update_selection();
    shader_update_selected_image();
    shader_update_render_buffers_selected_size();
    shader_need_to_rerender = true;
  }
}


function draw() {
  background('#404040');
  translate(-windowWidth / 2, -windowHeight / 2);

  dsiplay_draw_background(margin);

  shader_render();

  display_draw_source_image(shader_img);

  display_draw_shaded_image(shader_resampling_buffer);
  // display_draw_shaded_image(shader_luma_contrast_bright_buffer);




  control_draw_labels(2 * margin + display_width);
  control_draw_values(3 * margin + display_width + control_width + control_label_width);

  display_draw_selection();

  draw_framerate();
}

function draw_framerate() {
  fill('#e0f8cf');
  textFont(control_font);
  textSize(control_font_size);
  text(frameRate().toFixed(0), 10, 20);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  display_update_size();
  display_update_shaded_image_size();
  display_update_source_image_size();
  display_update_selection(RESIZE);

  control_resize_controls();
}




