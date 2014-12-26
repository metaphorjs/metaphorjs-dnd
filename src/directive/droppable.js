
var Directive = require("metaphorjs/src/class/Directive.js"),
    createGetter = require("metaphorjs-watchable/src/func/createGetter.js"),
    createWatchable = require("metaphorjs-watchable/src/func/createWatchable.js"),
    Droppable = require("../class/Droppable.js"),
    getNodeConfig = require("metaphorjs/src/func/dom/getNodeConfig.js");

Directive.registerAttribute("mjs-droppable", 1000, function(scope, node, expr){

    var cfg = createGetter(expr)(scope) || {},
        nodeCfg = getNodeConfig(node),
        watcher,
        droppable,
        onChange = function(val) {
            droppable[val ? "enable" : "disable"]();
        };

    cfg.droppable = node;

    if (nodeCfg.droppableIf) {
        watcher = createWatchable(scope, nodeCfg.droppableIf, onChange);
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