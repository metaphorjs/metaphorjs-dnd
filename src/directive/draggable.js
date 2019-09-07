
require("../__init.js");
require("../dnd/Draggable.js");
require("metaphorjs/src/lib/Expression.js");
require("metaphorjs/src/lib/MutationObserver.js");

var Directive = require("metaphorjs/src/app/Directive.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js"),
    async = require("metaphorjs-shared/src/func/async.js");

Directive.registerAttribute("draggable", 1000, function(scope, node, config, renderer, attr) {

    config.setType("if", "bool");

    var cfg,
        draggable,
        onChange = function(val) {
            draggable && draggable[val ? "enable" : "disable"]();
        };

    var init = function(node) {
        if (config)  {
            cfg = config.get("value") || {};
            config.disableProperty("value");
            if (config.has("if")) {
                config.on("if", onChange);
                cfg.enabled = config.get("if");
            }

            !cfg.draggable && (cfg.draggable = node);
            draggable = new MetaphorJs.dnd.Draggable(cfg);
        }
    };

    renderer.on("rendered", function(){
        if (node) {
            Directive.resolveNode(node, "draggable", function(node){
                async(init, null, [node]);
            });
        }
    });

    return function() {
        onChange = null;
        draggable && draggable.$destroy();
        draggable = null;
        cfg = null;
        node = null;
        config = null;
    };
});