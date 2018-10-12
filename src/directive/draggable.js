require("../__init.js");
require("../dnd/Draggable.js");
require("metaphorjs/src/lib/Expression.js");

var Directive = require("metaphorjs/src/class/Directive.js"),
    createWatchable = require("metaphorjs-watchable/src/func/createWatchable.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

Directive.registerAttribute("draggable", 1000, function(scope, node, expr, renderer, attr){

    var cfg = MetaphorJs.lib.Expression.parse(expr)(scope) || {},
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

    draggable = new MetaphorJs.dnd.Draggable(cfg);

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