
require("../__init.js");
require("../dnd/Draggable.js");
require("metaphorjs/src/lib/Expression.js");
require("metaphorjs/src/lib/MutationObserver.js");

var Directive = require("metaphorjs/src/class/Directive.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

Directive.registerAttribute("draggable", 1000, function(scope, node, expr, renderer, attr) {

    var cfg = MetaphorJs.lib.Expression.parse(expr)(scope) || {},
        nodeCfg = attr ? attr.config : {},
        watcher,
        draggable,
        onChange = function(val) {
            draggable[val ? "enable" : "disable"]();
        };

    cfg.draggable = node;

    if (nodeCfg.if) {
        watcher = MetaphorJs.lib.MutationObserver.get(scope, nodeCfg.if, onChange);
        if (!watcher.getValue()) {
            cfg.enabled = false;
        }
    }

    draggable = new MetaphorJs.dnd.Draggable(cfg);

    return function() {

        if (watcher) {
            watcher.unsubscribe(onChange);
            watcher.$destroy(true);
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