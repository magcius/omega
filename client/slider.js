(function(exports) {
    "use strict";

    function getX(elem) {
        var x = 0;
        do {
            x += elem.offsetLeft;
        } while ((elem = elem.offsetParent));
        return x;
    }

    function Slider() {
        this._toplevel = document.createElement('div');
        this._toplevel.classList.add('slider');

        this._trough = document.createElement('div');
        this._trough.classList.add('slider-trough');

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        this._trough.addEventListener('mousedown', this._onMouseDown);
        this._toplevel.appendChild(this._trough);

        this._knob = document.createElement('div');
        this._knob.classList.add('slider-knob');
        this._trough.appendChild(this._knob);

        this._dragging = false;

        this.elem = this._toplevel;

        this.setValue(0);
    }
    Slider.prototype._onMouseDown = function(event) {
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);

        this._setDragging(true);
        this._handleDragEvent(event);
    };
    Slider.prototype._onMouseMove = function(event) {
        this._handleDragEvent(event);
    };
    Slider.prototype._onMouseUp = function(event) {
        this._handleDragEvent(event);
        this._setDragging(false);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
    };
    Slider.prototype._handleDragEvent = function(event) {
        if (!this._dragging)
            return;

        var mx = event.clientX;
        var cx = getX(this._trough);
        var x = mx - cx;
        var w = this._trough.offsetWidth;
        var value = Math.min(Math.max(x / w, 0), 1);
        if (this.setValue(value))
            this.emit('value-changed', value);
    };
    Slider.prototype.getValue = function(value) {
        return this._value;
    };
    Slider.prototype.setValue = function(value) {
        if (this._value == value)
            return false;

        this._value = value;
        this._knob.style.left = (value * 100) + '%';
        return true;
    };
    Slider.prototype._setDragging = function(isDragging) {
        this._dragging = isDragging;
        this._knob.classList.toggle('sliding', isDragging);
    };
    Signals.addSignalMethods(Slider.prototype);

    exports.Slider = Slider;

})(window);
