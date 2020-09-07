require("../../__init.js");
require("metaphorjs/src/func/dom/toFragment.js");
require("metaphorjs-animate/src/animate/animate.js");

const cls = require("metaphorjs-class/src/cls.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

module.exports = MetaphorJs.dnd.plugin.Helper = cls({

    $class: "MetaphorJs.dnd.plugin.Helper",
    drg: null,
    helperEl: null,

    $init: function(draggable) {
        var self = this;
        self.drg = draggable;
    },

    $beforeHostInit: function() {
        var self = this;
        self.drg.on("before-start", self.onBeforeStart, self);
        self.drg.on("start", self.onStart, self);
        self.drg.on("end", self.onEnd, self);
        self.drg.on("end-animation", self.onEndAnimation, self);
    },

    createHelper: function() {

        var self = this,
            drg = self.drg,
            cfg = drg.helper,
            el;

        if (cfg.tpl) {
            el = MetaphorJs.dom.toFragment(cfg.tpl).firstChild;
        }
        else {
            el = cfg.fn.call(cfg.context, drg);
        }

        drg.dragEl = el;
        self.helperEl = el;
    },

    positionHelper: function() {

        var self = this,
            drg = self.drg,
            cfg = drg.helper,
            trgState = drg.state,
            style = self.helperEl.style,
            appendTo = cfg.appendTo || drg.draggable.parentNode;

        if (cfg.manualPosition !== true) {
            style.left = trgState.left + "px";
            style.top = trgState.top + "px";
        }

        if (cfg.appendTo !== false) {
            appendTo.appendChild(self.helperEl);
        }
    },

    destroyHelper: function() {
        var self = this,
            el = self.helperEl;

        el.parentNode.removeChild(el);

        if (self.drg.helper.destroy) {
            self.helperEl = null;
        }
    },

    onBeforeStart: function() {
        var self = this;

        if (!self.helperEl) {
            self.createHelper();
        }
    },

    onStart: function() {

        var self = this;
        self.positionHelper();
    },

    onEnd: function() {
        var self = this,
            helperAnim = self.drg.helper.animate;
        if (!self.drg.end.animate && !helperAnim) {
            self.destroyHelper();
        }
        if (helperAnim){
            MetaphorJs.animate.animate(self.helperEl, "leave", null, false)
                .done(self.destroyHelper, self);
        }
    },

    onEndAnimation: function() {
        var self = this;
        if (self.drg.end.animate && !self.drg.helper.animate) {
            self.destroyHelper();
        }
    }
});