require("../../__init.js");
require("metaphorjs/src/func/dom/removeStyle.js");
require("metaphorjs/src/func/dom/toFragment.js");

const cls = require("metaphorjs-class/src/cls.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");


module.exports = MetaphorJs.dnd.plugin.Placeholder = cls({

    $class: "MetaphorJs.dnd.plugin.Placeholder",
    drg: null,
    placeholderEl: null,

    $init: function(draggable) {
        this.drg = draggable;
    },

    $beforeHostInit: function() {

        var self = this;
        self.drg.on("before-start", self.onBeforeStart, self);
        self.drg.on("start", self.onStart, self);
        self.drg.on("before-end", self.onBeforeEnd, self);
        self.drg.on("end", self.onEnd, self);
        self.drg.on("end-animation", self.onEndAnimation, self);
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
            el = MetaphorJs.dom.toFragment(cfg.tpl).firstChild;
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
            cfg = drg.placeholder,
            el = drg.draggable,
            state = drg.state,
            pl = self.placeholderEl;

        if (cfg.manualPosition != true) {
            pl.style.left = state.left + "px";
            pl.style.top = state.top + "px";
        }
        if (!cfg.appendTo) {
            el.parentNode.insertBefore(pl, el);
        }
        else {
            cfg.appendTo.appendChild(pl);
        }

        if (drg.$hasPlugin("MetaphorJs.dnd.plugin.Helper")) {
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

            if (drg.$hasPlugin("MetaphorJs.dnd.plugin.Helper")) {
                MetaphorJs.dom.removeStyle(drg.draggable, "display");
            }
        }
    },

    onBeforeEnd: function() {
        var self = this,
            drg = self.drg;

        if (drg.$hasPlugin("MetaphorJs.dnd.plugin.Helper") && !drg.end.restore) {
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