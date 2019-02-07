require("../__init.js");
require("../dnd/Droppable.js")
require("metaphorjs/src/lib/Expression.js");
require("metaphorjs/src/lib/MutationObserver.js");

var Directive = require("metaphorjs/src/app/Directive.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

Directive.registerAttribute("droppable", 1000,
    function(scope, node, config, renderer, attr){

    var cfg = {},
        droppable,
        onChange = function(val) {
            droppable && droppable[val ? "enable" : "disable"]();
        };
    
    if (config.has("if")) {
        config.on("if", onChange);
        cfg.enabled = config.get("if");
    }

    Directive.resolveNode(node, "droppable", function(node){
        if (cfg) {
            cfg.droppable = node;
            droppable = new MetaphorJs.dnd.Droppable(cfg);
        }
    });

    return function() {
        onChange = null;
        droppable && droppable.$destroy();
        droppable = null;
        cfg = null;
        nodeCfg = null;
    };
});