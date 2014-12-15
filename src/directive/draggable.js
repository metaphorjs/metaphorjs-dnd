
var Directive = require("metaphorjs/src/class/Directive.js"),
    createGetter = require("metaphorjs-watchable/src/func/createGetter.js"),
    Draggable = require("../metaphorjs.draggable.js");

Directive.registerAttribute("mjs-draggable", 1000, function(scope, node, expr){

    var cfg = createGetter(expr)(scope) || {};
    cfg.draggable = node;

    var draggable = new Draggable(cfg);

    return function() {
        draggable.$destroy();
        draggable = null;
        cfg = null;
    };
});