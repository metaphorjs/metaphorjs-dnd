
var defineClass = require("metaphorjs-class/src/func/defineClass.js"),
    removeStyle = require("metaphorjs/src/func/dom/removeStyle.js");


module.exports = defineClass({

    $class: "draggable.Placeholder",
    drg: null,
    placeholderEl: null,

    $init: function(draggable) {
        this.drg = draggable;
    },

    $beforeHostInit: function() {

        var self = this;
        self.drg.on("plugin-before-start", self.onBeforeStart, self);
        self.drg.on("plugin-start", self.onStart, self);
        self.drg.on("plugin-before-end", self.onBeforeEnd, self);
        self.drg.on("plugin-end", self.onEnd, self);
        self.drg.on("plugin-end-animation", self.onEndAnimation, self);
    },

    onBeforeStart: function() {
        if (!this.placeholderEl) {
            this.createPlaceholder();
        }
    },

    onStart: function() {
        this.positionPlaceholder();
    },

    createPlaceholder: function() {

        var self = this,
            drg = self.drg,
            cfg = drg.placeholder,
            el;

        if (cfg.tpl) {
            el = toFragment(cfg.tpl).firstChild;
        }
        else {
            el = cfg.fn.call(cfg.context, drg);
        }

        drg.holderEl = el;
        self.placeholderEl = el;
    },

    positionPlaceholder: function() {

        var self = this,
            drg = self.drg,
            el = drg.draggable,
            pl = self.placeholderEl;

        pl.style.left = drg.dragState.startX + "px";
        pl.style.top = drg.dragState.startY + "px";
        el.parentNode.insertBefore(pl, el);

        if (drg.$hasPlugin("draggable.Helper")) {
            el.style.display = "none";
        }
    },

    destroyPlaceholder: function() {
        var self = this,
            drg = self.drg,
            el = self.placeholderEl;

        if (el && el.parentNode) {
            el.parentNode.removeChild(el);

            if (self.drg.placeholder.destroy) {
                self.placeholderEl = null;
            }

            if (drg.$hasPlugin("draggable.Helper")) {
                removeStyle(drg.draggable, "display");
            }
        }
    },

    onBeforeEnd: function() {
        var self = this,
            drg = self.drg;

        if (drg.$hasPlugin("draggable.Helper") && !drg.end.restore) {
            self.destroyPlaceholder();
            drg.holderEl = drg.draggable;
        }
    },

    onEnd: function() {
        var self = this;
        if (!self.drg.end.animate) {
            self.destroyPlaceholder();
        }
    },

    onEndAnimation: function() {
        var self = this;
        if (self.drg.end.animate) {
            self.destroyPlaceholder();
        }
    }

});