require("../__init.js");
require("../dnd/Droppable.js")
require("metaphorjs/src/lib/Expression.js");

var Directive = require("metaphorjs/src/class/Directive.js"),
    createWatchable = require("metaphorjs-watchable/src/func/createWatchable.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

Directive.registerAttribute("droppable", 1000,
    function(scope, node, expr, parentRenderer, attr){

    var cfg = MetaphorJs.lib.Expression.parse(expr)(scope) || {},
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

    droppable = new MetaphorJs.dnd.Droppable(cfg);

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