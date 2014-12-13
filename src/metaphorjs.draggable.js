
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
    getOuterWidth = require("metaphorjs/src/func/dom/getOuterWidth.js"),
    getOuterHeight = require("metaphorjs/src/func/dom/getOuterHeight.js"),
    getOffsetParent = require("metaphorjs/src/func/dom/getOffsetParent.js"),
    getAnimationPrefixes = require("metaphorjs-animate/src/func/getAnimationPrefixes.js"),
    async = require("metaphorjs/src/func/async.js"),
    animate = require("metaphorjs-animate/src/metaphorjs.animate.js"),
    browserHasEvent = require("metaphorjs/src/func/browser/browserHasEvent.js"),
    select = require("metaphorjs-select/src/metaphorjs.select.js");

module.exports = (function(){

    var prefixes = getAnimationPrefixes(),
        transformPrefix = prefixes.transform,
        touchSupported = browserHasEvent("touchstart"),
        documentBlocked = false;

    var prepareEvent = function(e, node) {
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

    var blockHandler = function(e) {
        e = normalizeEvent(e || window.event);
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    var blockDocument = function() {
        var doc = window.document;
        addListener(doc, "touchstart", blockHandler);
        addListener(doc, "touchmove", blockHandler);
        addListener(doc, "touchend", blockHandler);
        documentBlocked = true;
    };



    var defaults = {

        draggable:              null,
        blockDocumentEvents:    true,

        cls: {
            drag:				null
        },

        start: {
            delay:				0,
            distance:			0,
            hold:               0,
            holdThreshold:      20,
            animate:            false
        },

        end: {
            restore:			false,
            animate:            false
        },

        drag: {
            method:             "transform",
            axis:				null,
            handle:             null
        },

        cursor: {
            position:			'click',
            offsetX:			0,
            offsetY:			0
        },

        drop: {
            enable:				false,
            to:					null 	// fn|[dom|jquery|selector|droppable]
        },

        events: {
            "*": {
                returnValue:		false,
                stopPropagation:	true,
                preventDefault:		true
            }
        },

        helper: {
            destroy:			true,
            zIndex:				9999,
            tpl:				null,
            fn:					null
        },

        placeholder: {
            tpl:				null,
            fn:					null
        },

        data:					null,

        callback: {
            context:			null,
            beforestart:        null,
            start:				null,
            beforeend:          null,
            end:				null,
            drag:				null,
            drop:               null,
            destroy:            null
        }
    };

    return defineClass({

        $class: "Draggable",
        $mixins: [ObservableMixin],

        draggable: null,

        dragEl: null,
        handleEl: null,

        delayTmt: null,
        holdTmt: null,
        startEvent: null,
        lastMoveEvent: null,
        enabled: true,
        started: false,
        distance: false,

        dragState: null,
        targetState: null,
        
        $constructor: function(cfg) {
            extend(cfg, defaults, false, true);
            this.$super(cfg);
        },

        $init: function(cfg) {

            var self = this;

            extend(self, cfg, true, false);

            if (touchSupported && !documentBlocked && self.blockDocumentEvents) {
                blockDocument();
            }

            if (!prefixes.transform) {
                self.drag.method = "position";
            }

            self.dragState = {
                clickX: null,
                clickY: null,
                startX: null,
                startY: null,
                offsetX: null,
                offsetY: null,
                x: null,
                y: null
            };

            self.targetState = {
                offsetX: null,
                offsetY: null
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

            self.onMousedownDelegate = bind(self.onMousedown, self);
            self.onMousemoveDelegate = bind(self.onMousemove, self);
            self.onMouseupDelegate = bind(self.onMouseup, self);

            if (self.enabled) {
                self.enabled = false;
                self.enable();
            }
        },

        enable: function() {
            if (!this.enabled) {
                this.enabled = true;
                this.setStartEvents("bind");
            }
        },

        disable: function() {
            if (this.enabled) {
                this.enabled = false;
                this.setStartEvents("unbind");
            }
        },

        setStartEvents: function(mode) {

            var self = this,
                fn = mode == "bind" ? addListener : removeListener;

            fn(self.handleEl, "mousedown", self.onMousedownDelegate);

            if (touchSupported) {
                fn(self.handleEl, "touchstart", self.onMousedownDelegate);
            }
        },

        setMoveEvents: function(mode) {

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

        processEvent: function(e) {

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



        onMousedown: function(e) {
            e = prepareEvent(e, this.draggable);
            this.dragStart(e);
            return this.processEvent(e);
        },

        dragStart: function(e) {

            var self = this,
                start = self.start;

            if (!self.enabled || self.started) {
                return;
            }

            self.startEvent = e;

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

        onAfterDelay: function(e) {

            var self = this,
                start = self.start,
                se = self.startEvent;

            self.delayTmt = null;
            self.holdTmt = null;

            if (start.distance) {
                self.distance           = start.distance;
                self.dragState.clickX	= se.clientX;
                self.dragState.clickY	= se.clientY;
            }
            else {
                self.onActualStart(e);
                self.dragMove(self.lastMoveEvent || e);
            }
        },

        onActualStart: function(e) {

            var self = this,
                se	= self.startEvent;

            if (self.trigger('beforestart', self, se) === false) {
                self.dragStop(e);
                return;
            }

            self.started   = true;

            self.processStartEvent();
            self.cacheOffsetParent();

            if (self.cls.drag) {
                addClass(self.draggable, self.cls.drag);
            }

            if (self.start.animate) {
                animate(self.draggable, ["drag-start"], null, false);
            }

            self.trigger('start', self, se);
        },

        processStartEvent: function() {

            var	self    = this,
                e		= self.startEvent,
                node	= self.draggable,
                ofs		= getOffset(node),
                cur		= self.cursor.position,
                drag    = self.dragState;

            drag.clickX	    = e.clientX;
            drag.clickY	    = e.clientY;
            drag.startX	    = ofs.left;
            drag.startY	    = ofs.top;
            drag.offsetX	= drag.clickX - ofs.left;
            drag.offsetY	= drag.clickY - ofs.top;


            if (cur != 'click') {

                var	w	= getOuterWidth(node),
                    h	= getOuterHeight(node);

                if (cur.indexOf('c') != -1) {
                    drag.offsetX    = w / 2;
                    drag.offsetY    = h / 2;
                }

                if (cur.indexOf('t') != -1) {
                    drag.offsetY	= 0;
                }
                else if (cur.indexOf('b') != -1) {
                    drag.offsetY	= h;
                }

                if (cur.indexOf('l') != -1) {
                    drag.offsetX	= 0;
                }
                else if (cur.indexOf('r') != -1) {
                    drag.offsetX    = w;
                }
            }

            drag.offsetY	-= self.cursor.offsetY;
            drag.offsetX	-= self.cursor.offsetX;
        },

        cacheOffsetParent: function() {

            var self = this;

            /*if (helper.elem) {
                target.offsetX	= 0;
                target.offsetY	= 0;
            }
            else {*/

                if (self.offsetParent === null) {
                    self.offsetParent = getOffsetParent(self.draggable);
                }

                var op		= self.offsetParent,
                    ofs		= getOffset(op || self.draggable);

                self.targetState.offsetX	= ofs.left;
                self.targetState.offsetY	= ofs.top;
            //}
        },




        onMousemove: function(e) {
            e = prepareEvent(e, this.draggable);
            this.dragMove(e);
            return this.processEvent(e);
        },

        dragMove: function(e) {

            var self    = this,
                drag    = self.dragState;

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

                if (Math.abs(e.clientX - drag.clickX)  >= self.distance ||
                    Math.abs(e.clientY - drag.clickY) 	>= self.distance) {

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

            /*if (!drag.draggable) {
                state.started = false;
                self.dragStop(e);
                return;
            }*/


            if (self.drag.method == "transform") {
                self.applyTransform(e);
            }
            else {
                self.applyPosition(e);
            }

            self.trigger('drag', self, e);
        },

        applyTransform: function(e) {

            var self = this,
                style = self.draggable.style,
                ds = self.dragState,
                transform = "",
                axis = self.drag.axis,
                x = e.clientX - ds.offsetX - self.targetState.offsetX,
                y = e.clientY - ds.offsetY - self.targetState.offsetY;

            if (axis != "x") {
                transform += " translateY("+y+"px)";
            }
            if (axis != "y") {
                transform += " translateX("+x+"px)";
            }

            ds.x = x;
            ds.y = y;

            style[transformPrefix] = transform;
        },

        applyPositionFromTransform: function() {

            var self = this,
                style = self.draggable.style,
                axis = self.drag.axis;

            if (axis != "x") {
                style.top = self.targetState.offsetY + self.dragState.y + "px";
            }
            if (axis != "y") {
                style.left = self.targetState.offsetX + self.dragState.x + "px";
            }

            style[transformPrefix] = "";
        },

        applyPosition: function(e) {

            var self = this,
                style = self.draggable.style,
                axis = self.drag.axis,
                ds = self.dragState,
                x = e.clientX - ds.offsetX,
                y = e.clientY - ds.offsetY;

            if (axis != "x") {
                style.top = y + "px";
            }

            if (axis != "y") {
                style.left = x + "px";
            }

            ds.x = x;
            ds.y = y;
        },

        restoreOriginalPosition: function() {

            var self = this,
                style = self.draggable.style,
                ds = self.dragState;

            if (self.drag.method == "transform") {
                style[prefixes.transform] = "";
            }
            else {
                style.top = ds.startY + "px";
                style.left = ds.startX + "px";
            }
        },


        onMouseup: function(e) {
            e = prepareEvent(e, this.draggable);
            this.dragStop(e);
            return this.processEvent(e);
        },

        dragStop: function(e) {

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

            self.trigger('beforeend', self, e);

            if (self.end.restore) {
                self.restoreOriginalPosition();
            }
            else if (self.drag.method == "transform") {
                self.applyPositionFromTransform();
            }

            if (self.cls.drag) {
                removeClass(self.draggable, self.cls.drag);
            }

            if (self.end.animate) {
                animate(self.draggable, ["drag-end"], null, false);
            }

            self.started = false;

            self.trigger('end', self, e);
        },

        destroy: function() {

            this.disable();

        }


    });


}());