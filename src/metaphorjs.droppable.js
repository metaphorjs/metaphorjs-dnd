

var defineClass = require("metaphorjs-class/src/func/defineClass.js"),
    ObservableMixin = require("metaphorjs/src/mixin/ObservableMixin.js"),
    extend = require("metaphorjs/src/func/extend.js"),
    isFunction = require("metaphorjs/src/func/isFunction.js"),
    is = require("metaphorjs-select/src/func/is.js"),
    addClass = require("metaphorjs/src/func/dom/addClass.js"),
    removeClass = require("metaphorjs/src/func/dom/removeClass.js"),
    getOffset = require("metaphorjs/src/func/dom/getOffset.js"),
    getOuterWidth = require("metaphorjs/src/func/dom/getOuterWidth.js"),
    getOuterHeight = require("metaphorjs/src/func/dom/getOuterHeight.js");

module.exports = (function(){

    var defaults = {
        accept: true,
        cls: {
            active: null,
            over: null
        },
        callback: {
            context: null
        }
    };

    var all = [];

    var Droppable = defineClass({

        $class:  "Draggable",
        $mixins: [ObservableMixin],
        node: null,
        enabled: true,
        active: false,
        accepted: null,

        $init: function(cfg) {

            var self = this;

            extend(cfg, defaults, false, true);
            extend(self, cfg, true, false);

            all.push(self);

            self.trigger("init", self);

            if (self.enabled) {
                self.enabled = false;
                self.enable();
            }
        },

        isEnabled: function() {
            return this.enabled;
        },

        enable: function () {
            var self = this;
            if (!self.enabled) {
                if (self.trigger("enable", self) !== false) {
                    self.enabled = true;
                }
            }
        },

        disable: function () {
            var self = this;
            if (self.enabled) {
                if (self.trigger("disable", self) !== false) {
                    self.enabled = false;
                }
            }
        },



        accepts: function(draggable) {

            var self    = this,
                a	    = self.accept;

            if (a === true || a === false) {
                return a;
            }

            if (typeof a == 'string') {
                return is(draggable.getElem(), a);
            }

            if (isFunction(a)) {
                return a.call(self.$$callbackContext, self, draggable);
            }

            var elem = draggable.getElem();

            return a == elem;
        },


        setCurrentDraggable: function(drg) {

            var self = this;

            if (self.accepts(drg)) {

                drg.on('end', self.releaseDraggable, self);

                if (self.cls.active) {
                    addClass(self.node, self.cls.active);
                }

                self.active = true;
                self.accepted = drg;

                self.trigger('activate', self, drg);

                return true;
            }

            return false;
        },

        setDraggableOver: function(drg) {
            var self = this;
            if (self.active && self.accepted == drg) {
                if (self.cls.over) {
                    addClass(self.node, self.cls.over);
                }
            }
        },

        setDraggableOut: function(drg) {
            var self = this;
            if (self.active && self.accepted == drg) {
                if (self.cls.over) {
                    removeClass(self.node, self.cls.over);
                }
            }
        },

        getCoords: function() {

            var self = this,
                el	= self.node,
                ofs	= getOffset(el),
                coords = {};

            coords.x	= ofs.left;
            coords.y	= ofs.top;
            coords.w	= getOuterWidth(el);
            coords.h	= getOuterHeight(el);
            coords.x1	= coords.x + coords.w;
            coords.y1	= coords.y + coords.h;

            return coords;
        },

        drop: function(drg) {
            var self = this;
            if (self.active && self.accepted == drg) {
                self.trigger('drop', self, drg);
            }
        },

        releaseDraggable: function(drg) {

            var self = this;

            drg.un('end', self.releaseDraggable, self);

            self.active = false;
            self.accepted = null;

            if (self.cls.active) {
                removeClass(self.node, self.cls.active);
            }
            if (self.cls.over) {
                removeClass(self.node, self.cls.over);
            }

            self.trigger('deactivate', self);
        },

        destroy: function() {

            var self = this;

            if (self.accepted) {
                self.releaseDraggable(self.accepted);
            }

            var inx = all.indexOf(self);
            all.splice(inx, 1);
        }
    }, {


        getAll: function() {
            return all;
        }
    });


    return Droppable;
}());