require("../__init.js");
require("../dnd/Droppable.js")
require("metaphorjs/src/lib/Expression.js");
require("metaphorjs/src/lib/MutationObserver.js");

const Directive = require("metaphorjs/src/app/Directive.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

Directive.registerAttribute("droppable", 1000,
    function(scope, node, config, renderer, attr){

    var cfg,
        droppable,
        onChange = function(val) {
            droppable && droppable[val ? "enable" : "disable"]();
        };

    var init = function(node) {
        if (config) {
            cfg = config.get("value") || {};
            config.disableProperty("value");
    
            if (config.has("if")) {
                config.on("if", onChange);
                cfg.enabled = config.get("if");
            }

            !cfg.droppable && (cfg.droppable = node);
            droppable = new MetaphorJs.dnd.Droppable(cfg);
        }
    };

    renderer.on("rendered", function(){
        if (node) {
            Directive.resolveNode(node, "droppable", function(node){
                async(init, null, [node]);
            });
        }
    });
    

    return function() {
        onChange = null;
        droppable && droppable.$destroy();
        droppable = null;
        cfg = null;
        config = null;
        node = null;
    };
});