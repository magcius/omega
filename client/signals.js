(function(exports) {
    "use strict";

    var Signals = {};

    function emit(name, args) {
        var signals = this.$signals;
        if (!signals || !signals[name] || signals[name].length == 0)
            return;

        signals[name].forEach(function(func) {
            func(args);
        });
    }

    function connect(name, func) {
        var signals = this.$signals;
        if (!signals)
            signals = this.$signals = {};
        if (!signals[name])
            signals[name] = [];
        signals[name].push(func);
    }

    Signals.addSignalMethods = function(obj) {
        obj.emit = emit;
        obj.connect = connect;
    };

    exports.Signals = Signals;

})(window);
