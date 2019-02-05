
require("../__init.js");

require("metaphorjs/src/func/dom/addListener.js");
require("metaphorjs/src/func/dom/removeListener.js");
require("metaphorjs/src/func/dom/addClass.js");
require("metaphorjs/src/func/dom/removeClass.js");
require("metaphorjs/src/func/dom/normalizeEvent.js");
require("metaphorjs/src/func/dom/getOffset.js");
require("metaphorjs/src/func/dom/getPosition.js");
require("metaphorjs/src/func/dom/getOuterWidth.js");
require("metaphorjs/src/func/dom/getOuterHeight.js");
require("metaphorjs/src/func/dom/getStyle.js");
require("metaphorjs/src/func/browser/hasEvent.js");
require("metaphorjs/src/func/dom/select.js");
require("metaphorjs/src/func/dom/is.js");
require("metaphorjs-animate/src/animate/animate.js")
require("metaphorjs-animate/src/animate/getPrefixes.js"),
require("metaphorjs-observable/src/mixin/Observable.js");
require("./plugin/Boundary.js");
require("./plugin/Drop.js");
require("./plugin/Helper.js");
require("./plugin/Placeholder.js");

var extend = require("metaphorjs-shared/src/func/extend.js"),
    bind = require("metaphorjs-shared/src/func/bind.js"),
    cls = require("metaphorjs-class/src/cls.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js"),
    async = require("metaphorjs-shared/src/func/async.js");

module.exports = MetaphorJs.dnd.Draggable = function () {

    var prefixes = MetaphorJs.animate.getPrefixes(),
        transformPrefix = prefixes.transform,
        touchSupported = MetaphorJs.browser.hasEvent("touchstart"),
        documentBlocked = false;

    var prepareEvent = function (e, node) {
        e = MetaphorJs.dom.normalizeEvent(e || window.event);
        var touches, i, l, trg;

        if (touches = e.touches) {
            for (i = 0, l = touches.length; i < l; i++) {
                trg = touches[i].target;
                if (node === trg || node.contains(trg)) {
                    extend(e, touches[i], true, false);
                }
            }
        }

        return e;
    };

    var blockHandler = function (e) {
        e = MetaphorJs.dom.normalizeEvent(e || window.event);
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    var blockDocument = function () {
        var doc = window.document;
        MetaphorJs.dom.addListener(doc, "touchstart", blockHandler);
        MetaphorJs.dom.addListener(doc, "touchmove", blockHandler);
        MetaphorJs.dom.addListener(doc, "touchend", blockHandler);
        documentBlocked = true;
    };


    /**
     * @object MetaphorJs.dnd.Draggable.config
     */
    var defaults = {

        /**
         * @property {HTMLElement} draggable {
         *  Draggable object
         *  @required
         * }
         */
        draggable:           null,

        /**
         * @property {boolean} blockDocumentEvents {
         *  Blocks touchstart, touchmove and touchend events.
         *  @default false
         * }
         */
        blockDocumentEvents: false,

        /**
         * @object cls
         */
        cls: {
            /**
             * @property {string} drag Class to add while dragging
             */
            drag: null
            /**
             * @end-object
             */
        },

        /**
         * @object start
         */
        start: {
            /**
             * @property {int} delay Number of milliseconds to delay dragging
             */
            delay:         0,

            /**
             * @property {int} distance Number of pixels to move the mouse 
             *  before dragging starts
             */
            distance:      0,

            /**
             * @property {int} hold Similar to <code>delay</code> but during
             * this hold period if mouse moves more than <code>holdThreshold</code>
             * pixels, dragging gets cancelled.
             */
            hold:          0,

            /**
             * @property {int} holdThreshold Number of pixels
             */
            holdThreshold: 20,

            /**
             * @property {boolean} animate Run "mjs-drag-start" css animation
             */
            animate:       false,

            /**
             * @property {string} not Selector to try against mousedown event target
             * and all its parents. It any element matches the selector, 
             * dragging gets cancelled.
             */
            not:           null

            /**
             * @end-object
             */
        },

        /**
         * @object end
         */
        end: {
            /**
             * @property {boolean} restore Return element back to its original position
             */
            restore: false,

            /**
             * @property {boolean} animate Run "mjs-drag-end" css animation
             */
            animate: false

            /**
             * @end-object
             */
        },

        /**
         * @object drag
         */
        drag: {
            /**
             * @property {string} method {
             *  transform|position - apply movement via css transforms 
             *  or absolute positioning
             *  @default transform
             * }
             */
            method: "transform",

            /**
             * @property {string} axis x|y Move element on this axis
             */
            axis:   null,

            /**
             * @property {string|DomNode} handle Use this element as drag handle
             * instead of the whole element. If string - css selector
             */
            handle: null

            /**
             * @end-object
             */
        },

        /**
         * @object cursor
         */
        cursor: {

            /**
             * @property {string} position {
             *  click|c|t|r|b|l|tl|tr|bl|br: when dragging, 
             *  position element the way so that cursor is in 
             *  this position
             *  @default click
             * }
             */
            position: 'click',

            /**
             * @property {int} offsetX cursor position offset
             */
            offsetX:  0,

            /**
             * @property {int} offsetY cursor position offset
             */
            offsetY:  0

            /**
             * @end-object
             */
        },

        /**
         * Drop target
         * @property {string|DomNode|jQuery} drop {
         *  Css selector | jQuery object | Dom node<br>
         * }
         */
        drop: null, 	// fn|[dom|jquery|selector|droppable]

        /**
         * @object events
         */
        events: {
            /**
             * Event name as key (mousedown|mouseup; * for all)
             * @object *
             */
            "*": {
                /**
                 * @property {boolean} returnValue
                 */
                returnValue:     false,
                /**
                 * @property {boolean} stopPropagation
                 */
                stopPropagation: true,
                /**
                 * @property {boolean} preventDefault
                 */
                preventDefault:  true

                /**
                 * @end-object
                 */
            }
            /**
             * @end-object
             */
        },

        /**
         * @object helper Drag helper settings
         */
        helper: {
            /**
             * @property {boolean} destroy Destroy helper when dragging stops
             */
            destroy:        true,

            /**
             * @property {int} zIndex Helper's z index
             */
            zIndex:         9999,

            /**
             * @property {string} tpl Helper's html template
             */
            tpl:            null,

            /**
             * @property {function} fn {
             *  Funtion that creates helper
             *  @param {MetaphorJs.dnd.Draggable} drg
             *  @returns {HTMLElement}
             * }
             */
            fn:             null,

            /**
             * @property {object} context fn's context
             */
            context:        null,

            /**
             * @property {HTMLElement} appendTo Append helper to this element
             */
            appendTo:       null,

            /**
             * @property {boolean} manualPosition {
             *  Cancel auto positioning of the helper
             *  @default false
             * }
             */
            manualPosition: false,

            /**
             * @property {boolean} animate Run "mjs-leave" css animation 
             * when dragging stops
             */
            animate:        false

            /**
             * @end-object
             */
        },

        /**
         * @object placeholder Placeholder settings
         */
        placeholder: {
            /**
             * @property {boolean} destroy Destroy placeholder when dragging ended
             */
            destroy:        true,

            /**
             * @property {string} tpl Placeholder's html template
             */
            tpl:            null,

            /**
             * @property {function} fn {
             *  Function that creates placeholder
             *  @param {MetaphorJs.dnd.Draggable} drg
             *  @returns {HTMLElement}
             * }
             */
            fn:             null,

            /**
             * @property {object} context fn's context
             */
            context:        null,

            /**
             * @property {boolean} animate Animate placeholder
             */
            animate:        false

            /**
             * @end-object
             */
        },

        /**
         * @property {array} boundary {
         *  [x, y, x1, y1]<br>
         *  Dragging boundary
         * }
         */
        boundary: null,

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
             *  eventName: function(drg); See class's events
             *  @param {MetaphorJs.dnd.Draggable} drg
             * }
             */

            init:               null,
            enable:             null,
            disable:            null,
            "correct-position": null,
            "before-start":     null,
            "before-actual-start": null,
            start:              null,
            "after-delay":      null,
            "before-end":       null,
            end:                null,
            "end-animation":    null,
            drag:               null,
            "before-drop":      null,
            drop:               null

            /**
             * @end-object
             */
        }

        /**
         * @end-object
         */
    };

    /**
     * Make dom objects draggable
     * @class MetaphorJs.dnd.Draggable
     * @extends MetaphorJs.cls.BaseClass
     * @mixes MetaphorJs.mixin.Observable
     */
    return cls({

        /**
         * @event init {
         *  @param {MetaphorJs.dnd.Draggable} drg
         * }
         */
        /**
         * @event enable {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @returns {boolean} return false to cancel enabling
         * }
         */
        /**
         * @event disable {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @returns {boolean} return false to cancel disabling
         * }
         */
        /**
         * @event correct-position {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @param {object} pos {
         *      @type {int} top
         *      @type {int} left
         *  }
         *  @param {string} method transform|position
         *  @param {MetaphorJs.lib.DomEvent} event Dom event
         * }
         */
        /**
         * @event before-start {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @param {MetaphorJs.lib.DomEvent} event Dom event
         *  @returns {boolean} Return false to cancel dragging
         * }
         */
        /**
         * @event after-delay {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @param {MetaphorJs.lib.DomEvent} startEvent Dom event
         * }
         */
        /**
         * @event before-actual-start {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @param {MetaphorJs.lib.DomEvent} startEvent Dom event
         * }
         */
        /**
         * @event start {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @param {MetaphorJs.lib.DomEvent} startEvent Dom event
         * }
         */
        /**
         * @event before-end {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @param {MetaphorJs.lib.DomEvent} lastMoveEvent Dom event
         *  @param {MetaphorJs.lib.DomEvent} event Dom event (mouseup)
         * }
         */
        /**
         * @event end {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @param {MetaphorJs.lib.DomEvent} event Dom event
         *  @param {object} position {
         *      @type {int} top
         *      @type {int} left
         *  }
         * }
         */
        /**
         * @event end-animation {
         *  @param {MetaphorJs.dnd.Draggable} drg
         * }
         */
        /**
         * @event drag {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @param {MetaphorJs.lib.DomEvent} event Dom event
         *  @param {object} position {
         *      @type {int} top
         *      @type {int} left
         *  }
         * }
         */
        /**
         * @event before-drop {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @param {MetaphorJs.dnd.Droppable} drp
         * }
         */
        /**
         * @event drop {
         *  @param {MetaphorJs.dnd.Draggable} drg
         *  @param {MetaphorJs.dnd.Droppable} drp
         * }
         */

        $mixins: [MetaphorJs.mixin.Observable],

        draggable: null,

        dragEl:   null,
        handleEl: null,
        holderEl: null,

        delayTmt:      null,
        holdTmt:       null,
        startEvent:    null,
        lastMoveEvent: null,
        lastPosition:  null,
        enabled:       true,
        started:       false,
        distance:      false,

        state:          null,

        $constructor: function (cfg) {

            extend(cfg, defaults, false, true);

            var self = this,
                pls = MetaphorJs.dnd.plugin;

            if (cfg.helper.tpl || cfg.helper.fn) {
                self.$plugins.push(pls.Helper);
            }

            if (cfg.placeholder.tpl || cfg.placeholder.fn) {
                self.$plugins.push(pls.Placeholder);
            }

            if (cfg.boundary) {
                self.$plugins.push(pls.Boundary);
            }

            if (cfg.drop) {
                self.$plugins.push(pls.Drop);
            }

            self.$super(cfg);
        },

        /**
         * @method
         * @constructor
         * @param {object} cfg {
         *  @md-extend MetaphorJs.dnd.Draggable.config
         * }
         */
        $init: function (cfg) {

            var self = this;

            extend(self, cfg, true, false);

            if (touchSupported && !documentBlocked && self.blockDocumentEvents) {
                blockDocument();
            }

            if (!transformPrefix) {
                self.drag.method = "position";
            }

            self.state = {
                clickX:  null,
                clickY:  null,
                offsetX: null,
                offsetY: null,
                x:       null,
                y:       null
            };

            var h;
            if (h = self.drag.handle) {
                if (typeof h === "string") {
                    self.handleEl = MetaphorJs.dom.select(h).shift() || self.draggable;
                }
                else {
                    self.handleEl = h || self.draggable;
                }
            }
            else {
                self.handleEl = self.draggable;
            }

            self.dragEl = self.draggable;
            self.holderEl = self.draggable;

            self.draggable.$$draggable = self;

            self.onMousedownDelegate = bind(self.onMousedown, self);
            self.onMousemoveDelegate = bind(self.onMousemove, self);
            self.onMouseupDelegate = bind(self.onMouseup, self);
            self.onScrollDelegate = bind(self.onScroll, self);

            self.trigger("init", self);

            if (self.enabled) {
                self.enabled = false;
                self.enable();
            }
        },


        /**
         * Get draggable node
         * @method
         * @returns {HTMLElement}
         */
        getElem: function() {
            return this.draggable;
        },

        /**
         * @method
         * @returns {boolean}
         */
        isEnabled: function() {
            return this.enable;
        },  

        /**
         * Enable draggable (enabled by default)
         * @method
         */
        enable: function () {
            var self = this;
            if (!self.enabled) {
                if (self.trigger("enable", self) !== false) {
                    self.enabled = true;
                    self.setStartEvents("bind");
                }
            }
        },

        /**
         * Disable draggable
         * @method
         */
        disable: function () {
            var self = this;
            if (self.enabled) {
                if (self.trigger("disable", self) !== false) {
                    self.enabled = false;
                    self.setStartEvents("unbind");
                }
            }
        },

        setStartEvents: function (mode) {

            var self = this,
                fn = mode == "bind" ? MetaphorJs.dom.addListener : 
                                    MetaphorJs.dom.removeListener;

            fn(self.handleEl, "mousedown", self.onMousedownDelegate);

            if (touchSupported) {
                fn(self.handleEl, "touchstart", self.onMousedownDelegate);
            }
        },

        setMoveEvents: function (mode) {

            var fn = mode == "bind" ? MetaphorJs.dom.addListener : 
                                    MetaphorJs.dom.removeListener,
                html = document.documentElement,
                self = this,
                node = self.draggable;

            fn(html, "mousemove", self.onMousemoveDelegate);
            fn(html, "mouseup", self.onMouseupDelegate);
            fn(window, "scroll", self.onScrollDelegate);

            if (touchSupported) {
                fn(node, "touchmove", self.onMousemoveDelegate);
                fn(node, "touchend", self.onMouseupDelegate);
                fn(node, "touchcancel", self.onMouseupDelegate);
            }
        },

        processEvent: function (e) {

            var self = this,
                evs = self.events,
                cfg = evs[e.type] || evs["*"];

            if (cfg) {
                if (cfg.process) {
                    return cfg.process(e);
                }
                if (cfg.stopPropagation) {
                    e.stopPropagation();
                }
                if (cfg.preventDefault) {
                    e.preventDefault();
                }
                return cfg.returnValue;
            }

        },

        isValidMousedown: function(e) {

            var self = this;

            if (!self.start.not) {
                return true;
            }

            var trg     = e.target,
                not     = self.start.not;

            while (trg) {
                if (MetaphorJs.dom.is(trg, not)) {
                    return false;
                }
                trg = trg.parentNode;
            }

            return true;
        },


        onMousedown: function (e) {
            e = prepareEvent(e, this.handleEl);
            if (!this.isValidMousedown(e)) {
                return;
            }
            this.dragStart(e);
            return this.processEvent(e);
        },

        dragStart: function (e) {

            var self = this,
                start = self.start;

            if (!self.enabled || self.started) {
                return;
            }

            self.startEvent = e;

            if (self.trigger('before-start', self, e) === false) {
                self.dragStop(e);
                return;
            }

            self.setMoveEvents('bind');

            if (start.hold) {
                self.holdTmt = async(self.onAfterDelay, self, [e], start.hold);
            }
            else if (start.delay) {
                self.delayTmt = async(self.onAfterDelay, self, [e], start.delay);
            }
            else {
                self.onAfterDelay(e);
            }
        },

        onAfterDelay: function (e) {

            var self = this,
                start = self.start,
                se = self.startEvent;

            self.delayTmt = null;
            self.holdTmt = null;

            self.trigger("after-delay", self, e);

            if (start.distance) {
                self.distance = start.distance;
                self.state.clickX = se.clientX;
                self.state.clickY = se.clientY;
            }
            else {
                self.onActualStart(e);
                self.dragMove(self.lastMoveEvent || e);
            }
        },

        onActualStart: function(e) {

            var self = this,
                se = self.startEvent;

            self.started = true;

            self.cacheState();

            self.trigger("before-actual-start", self, se);

            if (self.cls.drag) {
                MetaphorJs.dom.addClass(self.draggable, self.cls.drag);
            }

            if (self.start.animate) {
                MetaphorJs.dom.animate(self.dragEl, ["mjs-drag-start"], null, false);
            }

            self.trigger('start', self, se);
        },

        cacheState: function () {

            var self = this,
                e = self.startEvent,
                node = self.draggable,
                cur = self.cursor.position,
                state = self.state,
                ofs = MetaphorJs.dom.getOffset(node),
                pos = MetaphorJs.dom.getPosition(node);

            state.clickX = e.clientX;
            state.clickY = e.clientY;
            state.x = ofs.left;
            state.y = ofs.top;
            state.offsetX = state.clickX - state.x;
            state.offsetY = state.clickY - state.y;
            state.left = pos.left;
            state.top = pos.top;
            state.w = MetaphorJs.dom.getOuterWidth(node);
            state.h = MetaphorJs.dom.getOuterHeight(node);
            state.mt = parseInt(MetaphorJs.dom.getStyle(node, "marginTop"), 10);
            state.ml = parseInt(MetaphorJs.dom.getStyle(node, "marginLeft"), 10);

            if (cur != 'click') {

                var w = MetaphorJs.dom.getOuterWidth(node),
                    h = MetaphorJs.dom.getOuterHeight(node);

                if (cur.indexOf('c') !== -1) {
                    state.offsetX = w / 2;
                    state.offsetY = h / 2;
                }

                if (cur.indexOf('t') !== -1) {
                    state.offsetY = 0;
                }
                else if (cur.indexOf('b') !== -1) {
                    state.offsetY = h;
                }

                if (cur.indexOf('l') !== -1) {
                    state.offsetX = 0;
                }
                else if (cur.indexOf('r') !== -1) {
                    state.offsetX = w;
                }
            }

            state.offsetY -= self.cursor.offsetY;
            state.offsetX -= self.cursor.offsetX;

            //console.log(state)
        },


        onMousemove: function (e) {
            e = prepareEvent(e, this.draggable);
            this.dragMove(e);
            return this.processEvent(e);
        },

        onScroll: function() {
            this.dragMove(this.lastMoveEvent);
        },

        dragMove:  function (e) {

            var self = this,
                state = self.state;

            self.lastMoveEvent = e;

            if (self.delayTmt) {
                return;
            }

            if (self.holdTmt) {
                var se = self.startEvent;
                if ((Math.abs(e.clientX - se.clientX) >= self.start.holdThreshold) ||
                    (Math.abs(e.clientY - se.clientY) >= self.start.holdThreshold)) {
                    self.dragStop(e);
                }
                return;
            }

            if (self.distance) {

                if (Math.abs(e.clientX - state.clickX) >= self.distance ||
                    Math.abs(e.clientY - state.clickY) >= self.distance) {

                    self.distance = false;
                    self.onActualStart(e);

                    if (!self.started) {
                        return;
                    }
                }
                else {
                    return;
                }
            }

            if (self.drag.method == "transform") {
                self.lastPosition = self.applyTransform(e);
            }
            else {
                self.lastPosition = self.applyPosition(e);
            }

            self.trigger('drag', self, e, self.lastPosition);
        },

        calcPosition: function(e) {

            var self = this,
                state = self.state,
                pos = {};
                //sp = getScrollParent(self.dragEl),
                //st = getScrollTop(sp || window),
                //sl = getScrollLeft(sp || window);

            //console.log(st, e.clientX, sp)

            // rel position
            pos.left = e.clientX - state.offsetX - (state.x - state.left);
            pos.top = e.clientY - state.offsetY - (state.y - state.top);

            // abs position
            pos.x = e.clientX - state.offsetX; //sl +
            pos.y = e.clientY - state.offsetY; // st +

            // transform
            pos.translateX = e.clientX - state.offsetX - state.x;
            pos.translateY = e.clientY - state.offsetY - state.y;


            return pos;
        },

        applyTransform: function (e) {

            var self = this,
                style = self.dragEl.style,
                transform = "",
                axis = self.drag.axis,
                pos = self.calcPosition(e);

            self.trigger("correct-position", self, pos, "transform", e);

            if (axis != "x") {
                transform += " translateY(" + pos.translateY + "px)";
            }
            if (axis != "y") {
                transform += " translateX(" + pos.translateX + "px)";
            }

            style[transformPrefix] = transform;

            return pos;
        },

        applyPosition: function (e, el, resetTransform) {

            var self = this,
                style = (el || self.dragEl).style,
                axis = self.drag.axis,
                pos = self.calcPosition(e);

            self.trigger("correct-position", self, pos, "position", e);

            if (axis != "x") {
                style.top = pos.top + "px";
            }

            if (axis != "y") {
                style.left = pos.left + "px";
            }

            if (resetTransform) {
                style[transformPrefix] = "";
            }

            return pos;
        },


        onMouseup: function (e) {
            e = prepareEvent(e, this.draggable);
            this.dragStop(e);
            return this.processEvent(e);
        },

        dragStop: function (e) {

            var self = this;

            self.setMoveEvents('unbind');

            var moveEvent = self.lastMoveEvent;
            self.lastMoveEvent = null;

            if (self.delayTmt) {
                clearTimeout(self.delayTmt);
                self.delayTmt = null;
                return;
            }

            if (self.holdTmt) {
                clearTimeout(self.holdTmt);
                self.holdTmt = null;
                return;
            }

            if (!self.enabled || !self.started) {
                return;
            }

            self.trigger('before-end', self, moveEvent, e);


            if (self.end.animate) {
                MetaphorJs.animate.animate(
                    self.end.restore ? self.dragEl : self.holderEl,
                    ["mjs-drag-end"],
                    null,
                    false,
                    null,
                    function(el, position, stage){
                        if (stage == "active") {
                            self.positionOnStop(moveEvent);
                        }
                    })
                    .done(self.onEndAnimation, self);
            }
            else {
                self.positionOnStop(moveEvent);
            }
        },

        positionOnStop: function(e) {
            var self = this,
                el = self.draggable,
                pos;

            if (self.cls.drag) {
                MetaphorJs.dom.removeClass(el, self.cls.drag);
            }

            if (self.end.restore) {
                pos = self.applyPosition(self.startEvent, null, true);
            }
            else if (el !== self.dragEl) {
                pos = self.applyPosition(e, el);
            }
            else if (self.drag.method == "transform") {
                pos = self.applyPosition(e, null, true);
            }

            self.started = false;

            self.trigger('end', self, e, pos || self.lastPosition);
        },

        onEndAnimation: function () {
            this.trigger("end-animation", this);
        },

        onDestroy: function () {

            this.disable();
            this.draggable.$$draggable = null;
        }


    });


}();