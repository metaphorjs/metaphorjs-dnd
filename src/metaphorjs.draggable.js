
var extend = require("metaphorjs/src/func/extend.js"),
    bind = require("metaphorjs/src/func/bind.js"),
    defineClass = require("metaphorjs-class/src/func/defineClass.js"),
    ObservableMixin = require("metaphorjs/src/mixin/ObservableMixin.js"),
    addListener = require("metaphorjs/src/func/event/addListener.js"),
    removeListener = require("metaphorjs/src/func/event/removeListener.js"),
    addClass = require("metaphorjs/src/func/dom/addClass.js"),
    removeClass = require("metaphorjs/src/func/dom/removeClass.js"),
    normalizeEvent = require("metaphorjs/src/func/event/normalizeEvent.js"),
    getOffset = require("metaphorjs/src/func/dom/getOffset.js"),
    getPosition = require("metaphorjs/src/func/dom/getPosition.js"),
    getOuterWidth = require("metaphorjs/src/func/dom/getOuterWidth.js"),
    getOuterHeight = require("metaphorjs/src/func/dom/getOuterHeight.js"),
    getWidth = require("metaphorjs/src/func/dom/getWidth.js"),
    getHeight = require("metaphorjs/src/func/dom/getHeight.js"),
    getOffsetParent = require("metaphorjs/src/func/dom/getOffsetParent.js"),
    getStyle = require("metaphorjs/src/func/dom/getStyle.js"),
    getAnimationPrefixes = require("metaphorjs-animate/src/func/getAnimationPrefixes.js"),
    async = require("metaphorjs/src/func/async.js"),
    animate = require("metaphorjs-animate/src/metaphorjs.animate.js"),
    browserHasEvent = require("metaphorjs/src/func/browser/browserHasEvent.js"),
    select = require("metaphorjs-select/src/metaphorjs.select.js");

module.exports = function () {

    var prefixes = getAnimationPrefixes(),
        transformPrefix = prefixes.transform,
        touchSupported = browserHasEvent("touchstart"),
        documentBlocked = false;

    var prepareEvent = function (e, node) {
        e = normalizeEvent(e || window.event);
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
        e = normalizeEvent(e || window.event);
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    var blockDocument = function () {
        var doc = window.document;
        addListener(doc, "touchstart", blockHandler);
        //addListener(doc, "touchmove", blockHandler);
        addListener(doc, "touchend", blockHandler);
        documentBlocked = true;
    };


    var defaults = {

        draggable:           null,
        blockDocumentEvents: true,

        cls: {
            drag: null
        },

        start: {
            delay:         0,
            distance:      0,
            hold:          0,
            holdThreshold: 20,
            animate:       false
        },

        end: {
            restore: false,
            animate: false
        },

        drag: {
            method: "transform",
            axis:   null,
            handle: null
        },

        cursor: {
            position: 'click',
            offsetX:  0,
            offsetY:  0
        },

        drop: {
            enable: false,
            to:     null 	// fn|[dom|jquery|selector|droppable]
        },

        events: {
            "*": {
                returnValue:     false,
                stopPropagation: true,
                preventDefault:  true
            }
        },

        helper: {
            destroy:        true,
            zIndex:         9999,
            tpl:            null,
            fn:             null,
            context:        null,
            appendTo:       null,
            manualPosition: false,
            animate:        false
        },

        placeholder: {
            destroy:        true,
            tpl:            null,
            fn:             null,
            context:        null,
            animate:        false
        },

        boundary: null,

        callback: {
            context:     null,
            beforestart: null,
            start:       null,
            beforeend:   null,
            end:         null,
            drag:        null,
            drop:        null,
            destroy:     null
        }
    };

    return defineClass({

        $class:  "Draggable",
        $mixins: [ObservableMixin],

        draggable: null,

        dragEl:   null,
        handleEl: null,
        holderEl: null,

        delayTmt:      null,
        holdTmt:       null,
        startEvent:    null,
        lastMoveEvent: null,
        enabled:       true,
        started:       false,
        distance:      false,

        state:          null,

        $constructor: function (cfg) {
            extend(cfg, defaults, false, true);

            var self = this;

            if (cfg.helper.tpl || cfg.helper.fn) {
                self.$plugins.push("draggable.Helper");
            }

            if (cfg.placeholder.tpl || cfg.placeholder.fn) {
                self.$plugins.push("draggable.Placeholder");
            }

            if (cfg.boundary) {
                self.$plugins.push("draggable.Boundary");
            }

            self.$super(cfg);
        },

        $init: function (cfg) {

            var self = this;

            extend(self, cfg, true, false);

            if (touchSupported && !documentBlocked && self.blockDocumentEvents) {
                blockDocument();
            }

            if (!prefixes.transform) {
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
                if (typeof h == "string") {
                    self.handleEl = select(h).shift() || self.draggable;
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

            self.onMousedownDelegate = bind(self.onMousedown, self);
            self.onMousemoveDelegate = bind(self.onMousemove, self);
            self.onMouseupDelegate = bind(self.onMouseup, self);

            self.trigger("plugin-init");

            if (self.enabled) {
                self.enabled = false;
                self.enable();
            }
        },

        enable: function () {
            var self = this;
            if (!this.enabled) {
                this.enabled = true;
                if (self.trigger("plugin-enable") !== false) {
                    this.setStartEvents("bind");
                }
            }
        },

        disable: function () {
            var self = this;
            if (self.enabled) {
                self.enabled = false;
                if (self.trigger("plugin-disable") !== false) {
                    self.setStartEvents("unbind");
                }
            }
        },

        setStartEvents: function (mode) {

            var self = this,
                fn = mode == "bind" ? addListener : removeListener;

            fn(self.handleEl, "mousedown", self.onMousedownDelegate);

            if (touchSupported) {
                fn(self.handleEl, "touchstart", self.onMousedownDelegate);
            }
        },

        setMoveEvents: function (mode) {

            var fn = mode == "bind" ? addListener : removeListener,
                html = document.documentElement,
                self = this,
                node = self.draggable;

            fn(html, "mousemove", self.onMousemoveDelegate);
            fn(html, "mouseup", self.onMouseupDelegate);

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


        onMousedown: function (e) {
            e = prepareEvent(e, this.handleEl);
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

            self.trigger("plugin-before-start");

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

        onActualStart: function (e) {

            var self = this,
                se = self.startEvent;

            if (self.trigger('beforestart', self, se) === false) {
                self.dragStop(e);
                return;
            }

            self.started = true;

            self.cacheState();

            self.trigger("plugin-start");

            if (self.cls.drag) {
                addClass(self.draggable, self.cls.drag);
            }

            if (self.start.animate) {
                animate(self.dragEl, ["mjs-drag-start"], null, false);
            }

            self.trigger('start', self, se);
        },

        cacheState: function () {

            var self = this,
                e = self.startEvent,
                node = self.draggable,
                cur = self.cursor.position,
                state = self.state,
                ofs = getOffset(node),
                pos = getPosition(node);

            state.clickX = e.clientX;
            state.clickY = e.clientY;
            state.x = ofs.left;
            state.y = ofs.top;
            state.offsetX = state.clickX - state.x;
            state.offsetY = state.clickY - state.y;
            state.left = pos.left;
            state.top = pos.top;
            state.w = getOuterWidth(node);
            state.h = getOuterHeight(node);
            state.mt = parseInt(getStyle(node, "marginTop"), 10);
            state.ml = parseInt(getStyle(node, "marginLeft"), 10);

            if (cur != 'click') {

                var w = getOuterWidth(node),
                    h = getOuterHeight(node);

                if (cur.indexOf('c') != -1) {
                    state.offsetX = w / 2;
                    state.offsetY = h / 2;
                }

                if (cur.indexOf('t') != -1) {
                    state.offsetY = 0;
                }
                else if (cur.indexOf('b') != -1) {
                    state.offsetY = h;
                }

                if (cur.indexOf('l') != -1) {
                    state.offsetX = 0;
                }
                else if (cur.indexOf('r') != -1) {
                    state.offsetX = w;
                }
            }

            state.offsetY -= self.cursor.offsetY;
            state.offsetX -= self.cursor.offsetX;
        },


        onMousemove: function (e) {
            e = prepareEvent(e, this.draggable);
            this.dragMove(e);
            return this.processEvent(e);
        },

        dragMove:          function (e) {

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
                self.applyTransform(e);
            }
            else {
                self.applyPosition(e);
            }

            self.trigger('drag', self, e);
        },

        calcPosition: function(e) {

            var self = this,
                state = self.state,
                pos = {};

            // rel position
            pos.left = e.clientX - state.offsetX - (state.x - state.left);
            pos.top = e.clientY - state.offsetY - (state.y - state.top);

            // abs position
            pos.x = e.clientX - state.offsetX;
            pos.y = e.clientY - state.offsetY;

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

            self.trigger("plugin-correct-position", pos, "transform");

            if (axis != "x") {
                transform += " translateY(" + pos.translateY + "px)";
            }
            if (axis != "y") {
                transform += " translateX(" + pos.translateX + "px)";
            }

            style[transformPrefix] = transform;
        },

        applyPosition: function (e, el, resetTransform) {

            var self = this,
                style = (el || self.dragEl).style,
                axis = self.drag.axis,
                pos = self.calcPosition(e);

            self.trigger("plugin-correct-position", pos, "position");

            if (axis != "x") {
                style.top = pos.top + "px";
            }

            if (axis != "y") {
                style.left = pos.left + "px";
            }

            if (resetTransform) {
                style[transformPrefix] = "";
            }
        },


        onMouseup: function (e) {
            e = prepareEvent(e, this.draggable);
            this.dragStop(e);
            return this.processEvent(e);
        },

        dragStop: function (e) {

            var self = this;

            self.setMoveEvents('unbind');

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

            self.trigger("plugin-before-end");
            self.trigger('beforeend', self, e);


            if (self.end.animate) {
                animate(
                    self.end.restore ? self.dragEl : self.holderEl,
                    ["mjs-drag-end"],
                    null,
                    false,
                    null,
                    function(el, position, stage){
                        if (stage == "active") {
                            self.positionOnStop(e);
                        }
                    })
                    .done(self.onEndAnimation, self);
            }
            else {
                self.positionOnStop(e);
            }


        },

        positionOnStop: function(e) {
            var self = this,
                el = self.draggable;

            if (self.cls.drag) {
                removeClass(el, self.cls.drag);
            }

            if (self.end.restore) {
                self.applyPosition(self.startEvent, null, true);
            }
            else if (el !== self.dragEl) {
                self.applyPosition(e, el);
            }
            else if (self.drag.method == "transform") {
                self.applyPosition(e, null, true);
            }

            self.started = false;

            self.trigger("plugin-end");
            self.trigger('end', self, e);
        },

        onEndAnimation: function () {
            this.trigger("plugin-end-animation");
        },

        destroy: function () {

            this.disable();

        }


    });


}();