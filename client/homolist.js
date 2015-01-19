(function(exports) {
    "use strict";

    // List view of homogeneous model-based items

    function HomoList(template) {
        this._toplevel = document.createElement('div');
        this._toplevel.classList.add('homo-list');

        this._inside = document.createElement('div');
        this._toplevel.appendChild(this._inside);

        this._toplevel.addEventListener('scroll', function() {
            this._redisplay();
        }.bind(this));

        this._template = template;
        this._items = [];
        this._model = null;

        this.elem = this._toplevel;
    }
    HomoList.prototype.setModel = function(model, additionalData) {
        this._model = model;
        this._additionalData = additionalData;
        this._resize();
    };
    HomoList.prototype._ensureMinItems = function(n) {
        while (this._items.length < n) {
            var templ = this._template();
            this._items.push(templ);
            this._inside.appendChild(templ.elem);
        }
    };
    HomoList.prototype._ensureItems = function(n) {
        this._ensureMinItems(n);
        while (this._items.length > n) {
            this._inside.removeChild(this._items.shift().elem);
        }
    };
    HomoList.prototype._getHeightPerElem = function() {
        this._ensureMinItems(1);
        var templ = this._items[0].elem;
        return templ.offsetHeight;
    };
    HomoList.prototype._resize = function() {
        var heightPerElem = this._getHeightPerElem();
        var insideHeight = heightPerElem * this._model.length;
        this._inside.style.height = insideHeight + 'px';
        this._redisplay();
    };
    HomoList.prototype._redisplay = function() {
        var heightPerElem = this._getHeightPerElem();

        var containerY = this._toplevel.scrollTop;
        var containerHeight = this._toplevel.offsetHeight;

        var firstItem = Math.floor(containerY / heightPerElem);
        var lastItem = Math.min(Math.ceil((containerY + containerHeight) / heightPerElem), this._model.length);

        this._ensureItems(lastItem);

        for (var i = firstItem; i < lastItem; i++)
            this._updateItem(i);
    };
    HomoList.prototype._updateItem = function(i) {
        this._items[i].setModel(this._model[i], this._additionalData);
    };
    HomoList.prototype.centerItem = function(idx) {
        var heightPerElem = this._getHeightPerElem();
        var containerHeight = this._toplevel.offsetHeight;

        var elemTop = heightPerElem * idx;
        var centerFudge = (containerHeight + heightPerElem) / 2;
        this._toplevel.scrollTop = elemTop - centerFudge;
    };

    exports.HomoList = HomoList;

})(window);
