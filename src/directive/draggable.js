
var Directive = require("metaphorjs/src/class/Directive.js"),
    createGetter = require("metaphorjs-watchable/src/func/createGetter.js"),
    createWatchable = require("metaphorjs-watchable/src/func/createWatchable.js"),
    Draggable = require("../class/Draggable.js");

Directive.registerAttribute("draggable", 1000, function(scope, node, expr, renderer, attr){

    var cfg = createGetter(expr)(scope) || {},
        nodeCfg = attr ? attr.config : {},
        watcher,
        draggable,
        onChange = function(val) {
            draggable[val ? "enable" : "disable"]();
        };

    cfg.draggable = node;

    if (nodeCfg.if) {
        watcher = createWatchable(scope, nodeCfg.if, onChange);
        if (!watcher.getLastResult()) {
            cfg.enabled = false;
        }
    }

    draggable = new Draggable(cfg);

    return function() {

        if (watcher) {
            watcher.unsubscribeAndDestroy(onChange, null);
            watcher = null;
        }

        onChange = null;
        draggable.$destroy();
        draggable = null;
        cfg = null;
        nodeCfg = null;
        node = null;
    };
});