(function(exports) {
    "use strict";

    function getX(elem) {
        var x = 0;
        do {
            x += elem.offsetLeft;
        } while ((elem = elem.offsetParent));
        return x;
    }

    function SliderBase() {
        this._toplevel = document.createElement('div');

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        this._constructDOM();

        this._dragging = false;

        this.elem = this._toplevel;
    }
    SliderBase.prototype._onMouseDown = function(event) {
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);

        this._setDragging(true);
        this._handleDragEvent(event);
    };
    SliderBase.prototype._onMouseMove = function(event) {
        this._handleDragEvent(event);
    };
    SliderBase.prototype._onMouseUp = function(event) {
        this._handleDragEvent(event);
        this._setDragging(false);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
    };
    SliderBase.prototype._handleDragEvent = function(event) {
        if (!this._dragging)
            return;

        var value = this._getValueFromEvent(event);
        this._setValue(value);
    };
    SliderBase.prototype.getValue = function(value) {
        return this._value;
    };
    SliderBase.prototype._setValue = function(value) {
        if (this.setValue(value))
            this.emit('value-changed', value);
    };
    SliderBase.prototype.setValue = function(value) {
        if (this._value == value)
            return false;

        this._value = Math.min(Math.max(value, 0), 1);
        this._updateValueDisplay();
        return true;
    };
    SliderBase.prototype._setDragging = function(isDragging) {
        this._dragging = isDragging;
        this._updateDraggingDisplay();
    };
    Signals.addSignalMethods(SliderBase.prototype);

    function Slider() {
        SliderBase.call(this);
        this.setValue(0);
    }
    Slider.prototype = Object.create(SliderBase.prototype);
    Slider.prototype._constructDOM = function() {
        this._toplevel.classList.add('slider');

        this._trough = document.createElement('div');
        this._trough.classList.add('slider-trough');

        this._trough.addEventListener('mousedown', this._onMouseDown);
        this._toplevel.appendChild(this._trough);

        this._knob = document.createElement('div');
        this._knob.classList.add('slider-knob');
        this._trough.appendChild(this._knob);
    };
    Slider.prototype._getValueFromEvent = function(event) {
        var mx = event.clientX;
        var cx = getX(this._trough);
        var x = mx - cx;
        var w = this._trough.offsetWidth;
        return (x / w);
    };
    Slider.prototype._updateValueDisplay = function() {
        this._knob.style.left = (this._value * 100) + '%';
    };
    Slider.prototype._updateDraggingDisplay = function() {
        this._knob.classList.toggle('sliding', this._dragging);
    };

    exports.Slider = Slider;

    // Volume Control

    function VolumeControl() {
        SliderBase.call(this);
        this.setValue(1);
    }
    VolumeControl.prototype = Object.create(SliderBase.prototype);
    VolumeControl.prototype._constructDOM = function() {
        this._toplevel = document.createElement('div');
        this._toplevel.classList.add('volume-control');

        this._inside = document.createElement('div');
        this._inside.classList.add('volume-control-inside');
        this._toplevel.appendChild(this._inside);

        this._volumeFill = document.createElement('div');
        this._volumeFill.classList.add('volume-control-fill');
        this._inside.appendChild(this._volumeFill);

        this._toplevel.addEventListener('mousedown', this._onMouseDown);
        this._toplevel.addEventListener('mousewheel', this._onMouseWheel.bind(this));
        this._toplevel.addEventListener('DOMMouseScroll', this._onMouseWheel.bind(this));
    };
    VolumeControl.prototype._getValueFromEvent = function(event) {
        var mx = event.clientX;
        var cx = getX(this._toplevel);
        var x = mx - cx;
        var w = this._toplevel.offsetWidth;
        return (x / w);
    };
    VolumeControl.prototype._updateValueDisplay = function() {
        this._volumeFill.style.marginLeft = (-(1 - this._value) * 100) + '%';
    };
    VolumeControl.prototype._updateDraggingDisplay = function() {
    };
    VolumeControl.prototype._onMouseWheel = function(event) {
        var delta = event.wheelDelta || -event.detail;
        if (delta > 0)
            this._setValue(this._value + 0.05);
        else
            this._setValue(this._value - 0.05);
    };

    exports.VolumeControl = VolumeControl;

})(window);
