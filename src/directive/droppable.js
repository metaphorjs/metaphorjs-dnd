
var Directive = require("metaphorjs/src/class/Directive.js"),
    createGetter = require("metaphorjs-watchable/src/func/createGetter.js"),
    createWatchable = require("metaphorjs-watchable/src/func/createWatchable.js"),
    Droppable = require("../class/Droppable.js");

Directive.registerAttribute("droppable", 1000,
    function(scope, node, expr, parentRenderer, attr){

    var cfg = createGetter(expr)(scope) || {},
        nodeCfg = attr ? attr.config : {},
        watcher,
        droppable,
        onChange = function(val) {
            droppable[val ? "enable" : "disable"]();
        };

    cfg.droppable = node;

    if (nodeCfg.if) {
        watcher = createWatchable(scope, nodeCfg.if, onChange);
        if (!watcher.getLastResult()) {
            cfg.enabled = false;
        }
    }

    droppable = new Droppable(cfg);

    return function() {

        if (watcher) {
            watcher.unsubscribeAndDestroy(onChange, null);
            watcher = null;
        }

        onChange = null;
        droppable.$destroy();
        droppable = null;
        cfg = null;
        nodeCfg = null;
    };
});