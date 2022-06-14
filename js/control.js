class Control {
    labelWidth = 256;
    height = 26;
    fontSize = 18;  // TODO

    constructor(xPos, yPos, width, labelText) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.width = width;
        this.labelText = labelText;
        this.label = null;
        this.element = null;
    }

    place() {
        this.element.position(xPos, this.yPos);
        this.element.style('height', this.height.toString() + "px");
        this.label = createSpan(this.labelText);
    }

    remove() {
        if (this.element != null) {
            this.element.remove();
            this.label.remove();
        }
    }
}

class FileUpload extends Control {
    constructor(xPos, yPos, width, labelText, fontColor, handler) {
        super(xPos, yPos, width, labelText);
        this.fontColor = fontColor;
        this.handler = handler;
    }

    place() {
        this.element = this.createFileInput(this.onFileSelected);
        super.place();
    }

    onFileSelected(file) {
        this.handler(file);
    }
}

class Checkbox extends Control {
    constructor(xPos, yPos, width, caption, start_checked=false) {
        super(xPos, yPos, width, "");
        this.caption = caption;
        this.start_checked = start_checked;
    }

    place() {
        this.element = this.createCheckbox(this.caption, this.start_checked);
        super.place();
    }
}

class Button extends Control {
    constructor(xPos, yPos, width, caption, handler) {
        super(xPos, yPos, width, "");
        this.caption = caption;
        this.handler = handler;
    }

    place() {
        this.element = this.createButton(this.caption);
        this.element.mousePressed(this.onButtonPressed);
    }

    onButtonPressed() {
        this.handler();
    }
}



class SliderBehavior {
    constructor(minValue, maxValue, defaultValue, valueFunc, displayStringFunc) {
       this.minValue = minValue;
       this.maxValue = maxValue;
       this.defaultValue = defaultValue;
       this.valueFunc = valueFunc;
       this.displayStringFunc = displayStringFunc;
    }
}

class Slider extends Control {
    constructor(xPos, yPos, width, labelText, behavior) {
        super(xPos, yPos, width, labelText);
        this.behavior = behavior;
    }

    place() {
        this.element = this.
    }

}

class Combobox extends Control {

}