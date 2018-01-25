
var Directive = require("metaphorjs/src/class/Directive.js"),
    createGetter = require("metaphorjs-watchable/src/func/createGetter.js"),
    createWatchable = require("metaphorjs-watchable/src/func/createWatchable.js"),
    Draggable = require("../class/Draggable.js");

Directive.registerAttribute("draggable", 1000, function(scope, node, expr){

    var cfg = createGetter(expr)(scope) || {},
        nodeCfg = attrMap['modifier']['draggable'] ?
                    attrMap['modifier']['draggable'] : {},
        watcher,
        draggable,
        onChange = function(val) {
            draggable[val ? "enable" : "disable"]();
        };

    cfg.draggable = node;

    if (nodeCfg.draggableIf) {
        watcher = createWatchable(scope, nodeCfg.draggableIf, onChange);
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