(function(exports) {
    "use strict";

    function ArrayModel(array) {
        this._array = array;
    }
    ArrayModel.prototype.fetch = function(start, length, func) {
        func(this._array.slice(start, length));
    };
    ArrayModel.prototype.getLength = function() {
        return this._array.length
    };
    Signals.addSignalMethods(ArrayModel.prototype);

    exports.ArrayModel = ArrayModel;

    function LazyModel() {
    }
    LazyModel.protot

    Signals.addSignalMethods(LazyModel.prototype);
    exports.LazyModel = LazyModel;

})(window);
