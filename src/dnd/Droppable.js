
require("../__init.js");
require("metaphorjs/src/func/dom/is.js");
require("metaphorjs/src/func/dom/addClass.js");
require("metaphorjs/src/func/dom/removeClass.js");
require("metaphorjs/src/func/dom/getOffset.js");
require("metaphorjs/src/func/dom/getOuterWidth.js");
require("metaphorjs/src/func/dom/getOuterHeight.js");
require("metaphorjs-observable/src/mixin/Observable.js");

const cls = require("metaphorjs-class/src/cls.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js"),
    extend = require("metaphorjs-shared/src/func/extend.js"),
    isFunction = require("metaphorjs-shared/src/func/isFunction.js");
    

module.exports = (function(){

    /**
     * @object MetaphorJs.dnd.Droppable.config
     */
    var defaults = {
        /**
         * @property {boolean} accept {
         *  Should this droppable accept draggable
         *  @default true
         * }
         */
        /**
         * @property {string} accept Droppable will accept draggable if it matches
         * this selector
         */
        /**
         * @property {function} accept {
         *  Should this droppable accept given draggable
         *  @param {MetaphorJs.dnd.Droppable} drp
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @returns {boolean}
         * }
         */
        /**
         * @property {HTMLElement} accept Accept specific dom node
         */
        accept: true,

        /**
         * @object cls
         */
        cls: {
            /**
             * @property {string} active Apply this css class when active
             */
            active: null,
            /**
             * @property {string} over Apply this css class when draggable is over
             */
            over: null

            /**
             * @end-object
             */
        },

        /**
         * @object callback
         */
        callback: {
            /**
             * @property {object} context all callback's context
             */
            context:            null,

            /**
             * @property {function} * {
             *  eventName: function(drp); See class's events
             *  @param {MetaphorJs.dnd.Droppable} drp
             * }
             */

            init: null,
            enable: null,
            disable: null,
            activate: null,
            deactivate: null,
            drop: null

            /**
             * @end-object
             */
        }

        /**
         * @end-object
         */
    };

    var all = [];

    /**
     * @class MetaphorJs.dnd.Droppable
     */
    var Droppable = cls({

        /**
         * @event init {
         *  @param {MetaphorJs.dnd.Droppable} drp 
         * }
         */
        /**
         * @event enable {
         *  @param {MetaphorJs.dnd.Droppable} drp 
         *  @returns {boolean} return false to cancel
         * }
         */
        /**
         * @event disable {
         *  @param {MetaphorJs.dnd.Droppable} drp 
         *  @returns {boolean} return false to cancel
         * }
         */
        /**
         * @event activate {
         *  @param {MetaphorJs.dnd.Droppable} drp 
         *  @param {MetaphorJs.dnd.Draggable} drg
         * }
         */
        /**
         * @event deactivate {
         *  @param {MetaphorJs.dnd.Droppable} drp 
         * }
         */
        /**
         * @event drop {
         *  @param {MetaphorJs.dnd.Droppable} drp 
         *  @param {MetaphorJs.dnd.Draggable} drg
         * }
         */

        $mixins: [MetaphorJs.mixin.Observable],
        droppable: null,
        enabled: true,
        active: false,
        accepted: null,
        

        /**
         * @method
         * @constructor
         * @param {object} cfg {
         *  @md-extend MetaphorJs.dnd.Droppable.config
         * }
         */
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

            self.droppable.$$droppable = self;
        },

        /**
         * @method
         * @returns {boolean}
         */
        isEnabled: function() {
            return this.enabled;
        },

        /**
         * Enable droppable (enabled by default)
         * @method
         */
        enable: function () {
            var self = this;
            if (!self.enabled) {
                if (self.trigger("enable", self) !== false) {
                    self.enabled = true;
                }
            }
        },

        /**
         * Disable droppable
         * @method
         */
        disable: function () {
            var self = this;
            if (self.enabled) {
                if (self.trigger("disable", self) !== false) {
                    self.enabled = false;
                }
            }
        },


        /**
         * Check if this droppable accepts draggable
         * @method
         * @param {HTMLElement} draggable
         * @returns {boolean}
         */
        accepts: function(draggable) {

            var self    = this,
                a	    = self.accept;

            if (a === true || a === false) {
                return a;
            }

            if (typeof a == 'string') {
                return MetaphorJs.dom.is(draggable.getElem(), a);
            }

            if (isFunction(a)) {
                return a.call(self.$$callbackContext, self, draggable);
            }

            var elem = draggable.getElem();

            return a == elem;
        },

        setCurrentDraggable: function(drg) {

            var self = this;

            if (self.accepted === drg) {
                return true;
            }

            if (self.accepts(drg)) {

                drg.on('end', self.releaseDraggable, self);

                if (self.cls.active) {
                    MetaphorJs.dom.addClass(self.droppable, self.cls.active);
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
                    MetaphorJs.dom.addClass(self.droppable, self.cls.over);
                }
            }
        },

        setDraggableOut: function(drg) {
            var self = this;
            if (self.active && self.accepted == drg) {
                if (self.cls.over) {
                    MetaphorJs.dom.removeClass(self.droppable, self.cls.over);
                }
            }
        },

        getCoords: function() {

            var self = this,
                el	= self.droppable,
                ofs	= MetaphorJs.dom.getOffset(el),
                coords = {};

            coords.x	= ofs.left;
            coords.y	= ofs.top;
            coords.w	= MetaphorJs.dom.getOuterWidth(el);
            coords.h	= MetaphorJs.dom.getOuterHeight(el);
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
                MetaphorJs.dom.removeClass(self.droppable, self.cls.active);
            }
            if (self.cls.over) {
                MetaphorJs.dom.removeClass(self.droppable, self.cls.over);
            }

            self.trigger('deactivate', self);
        },

        onDestroy: function() {

            var self = this;

            self.droppable.$$droppable = null;

            if (self.accepted) {
                self.releaseDraggable(self.accepted);
            }

            var inx = all.indexOf(self);
            all.splice(inx, 1);
        }
    }, {

        /**
         * Get all droppables
         * @static
         * @method
         * @return {array}
         */
        getAll: function() {
            return all;
        }
    });


    return Droppable;
}());