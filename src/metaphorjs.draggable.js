
var extend = require("metaphorjs/src/func/extend.js"),
    bind = require("metaphorjs/src/func/bind.js"),
    defineClass = require("metaphorjs-class/src/func/defineClass.js"),
    ObservableMixin = require("metaphorjs/src/mixin/ObservableMixin.js"),
    addListener = require("metaphorjs/src/func/event/addListener.js"),
    removeListener = require("metaphorjs/src/func/event/removeListener.js"),
    normalizeEvent = require("metaphorjs/src/func/event/normalizeEvent.js"),
    getOffset = require("metaphorjs/src/func/dom/getOffset.js"),
    getOuterWidth = require("metaphorjs/src/func/dom/getOuterWidth.js"),
    getOuterHeight = require("metaphorjs/src/func/dom/getOuterHeight.js"),
    getOffsetParent = require("metaphorjs/src/func/dom/getOffsetParent.js"),
    getAnimationPrefixes = require("metaphorjs-animate/src/func/getAnimationPrefixes.js"),
    undf = require("metaphorjs/src/var/undf.js");

module.exports = (function(){

    var prefixes = getAnimationPrefixes(),
        transformPrefix = prefixes.transform,
        rTranslate = /translate(x|y)\([^)]+\)/gi;

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

    var defaults = {

        cls: {
            drag:				null
        },

        start: {
            delay:				0,
            distance:			0
        },

        end: {
            restore:			false
        },

        drag: {
            method:             "transform",
            axis:				null,
            grid:				null,
            gridStart:			null,
            boundary:			null,
            boundaryLocal:		false
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
            scope:				null,
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

        cfg: null,
        node: null,

        startEvent: null,
        enabled: true,
        started: false,
        distance: false,

        drag: null,
        target: null,
        helper: null,
        placeholder: null,

        $init: function(node, cfg) {

            console.log("init")

            var self = this,
                cbScope = null,
                ev;

            cfg = extend({}, cfg, defaults, false, true);

            if (cfg.callback.scope) {
                cbScope = cfg.callback.scope;
                delete cfg.callback.scope;
            }
            for (ev in cfg.callback) {
                self.on(ev, cfg.callback[ev], cbScope);
            }
            delete cfg.callback;

            self.cfg = cfg;
            self.node = node;

            if (cfg.enabled !== undf) {
                self.enabled = cfg.enabled;
            }

            self.drag = {
                node: node,
                clickX: null,
                clickY: null,
                startX: null,
                startY: null,
                offsetX: null,
                offsetY: null,
                x: null,
                y: null
            };

            self.target = {
                offsetX: null,
                offsetY: null
            };

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

            fn(self.node, "mousedown", self.onMousedownDelegate);
            fn(self.node, "touchstart", self.onMousedownDelegate);
        },

        setMoveEvents: function(mode) {
            var fn = mode == "bind" ? addListener : removeListener,
                html = document.documentElement,
                self = this,
                node = self.node;


            fn(html, "mousemove", self.onMousemoveDelegate);
            fn(html, "mouseup", self.onMouseupDelegate);

            fn(node, "touchmove", self.onMousemoveDelegate);
            fn(node, "touchend", self.onMouseupDelegate);
        },

        processEvent: function(e) {

            var self = this,
                evs = self.cfg.events,
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
            e = prepareEvent(e, this.node);
            this.start(e);
            return this.processEvent(e);
        },

        start: function(e) {
            var self = this,
                cfg = self.cfg;

            if (!self.enabled || self.started) {
                return;
            }

            self.startEvent = e;
            self.setMoveEvents('bind');

            if (cfg.start.distance) {
                self.distance       = true;
                self.drag.clickX    = e.clientX;
                self.drag.clickY	= e.clientY;
            }
            else {
                self.onActualStart(e);
            }
        },

        onActualStart: function(e) {

            var self = this,
                se	= self.startEvent;

            if (self.trigger('beforestart', self, se) === false) {
                self.end(e);
                return;
            }

            self.started   = true;

            self.processStartEvent();
            self.cacheOffsetParent();

            self.trigger('start', self, se);
        },

        processStartEvent: function() {

            var	self    = this,
                e		= self.startEvent,
                cfg     = self.cfg,
                node	= self.node,
                ofs		= getOffset(node),
                cur		= cfg.cursor.position,
                drag    = self.drag;

            drag.clickX	= e.clientX;
            drag.clickY	= e.clientY;
            drag.startX	= ofs.left;
            drag.startY	= ofs.top;

            if (cur == 'click') {
                drag.offsetX	= drag.clickX - ofs.left;
                drag.offsetY	= drag.clickY - ofs.top;
            }
            else {

                var	w	= getOuterWidth(node),
                    h	= getOuterHeight(node);

                if (cur.indexOf('t') != -1) {
                    drag.offsetY	= h + cfg.cursor.offsetY;
                }
                else {
                    drag.offsetY	= - cfg.cursor.offsetY;
                }

                if (cur.indexOf('l') != -1) {
                    drag.offsetX	= w + cfg.cursor.offsetX;
                }
                else {
                    drag.offsetX	= - cfg.cursor.offsetX;
                }
            }
        },

        cacheOffsetParent: function() {

            var self = this;

            /*if (helper.elem) {
                target.offsetX	= 0;
                target.offsetY	= 0;
            }
            else {*/

                if (self.offsetParent === null) {
                    self.offsetParent = getOffsetParent(self.node);
                }

                var op		= self.offsetParent,
                    ofs		= getOffset(op || self.node);

                self.target.offsetX	= ofs.left;
                self.target.offsetY	= ofs.top;
            //}
        },




        onMousemove: function(e) {
            e = prepareEvent(e, this.node);
            this.move(e);
            return this.processEvent(e);
        },

        move: function(e) {

            var self    = this,
                drag    = self.drag,
                cfg     = self.cfg;

            if (self.distance) {

                if (Math.abs(e.clientX - drag.clickX)  >= cfg.start.distance ||
                    Math.abs(e.clientY - drag.clickY) 	>= cfg.start.distance) {

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

            if (!drag.node) {
                state.started = false;
                self.end(e);
                return;
            }

            if (cfg.drag.method == "transform") {
                self.applyTransform(e);
            }
            else {
                self.applyPosition(e);
            }


            self.trigger('drag', self, e);
        },

        applyTransform: function(e) {

            var self = this,
                cfg = self.cfg,
                style = self.node.style,
                transform = style[transformPrefix] || style["transform"] || "",
                axis = cfg.drag.axis,
                x = e.clientX - self.drag.offsetX - self.target.offsetX,
                y = e.clientY - self.drag.offsetY - self.target.offsetY;

            transform = transform.replace(rTranslate, "");

            if (axis != "x") {
                transform += " translateY("+y+"px)";
            }
            if (axis != "y") {
                transform += " translateX("+x+"px)";
            }

            self.drag.x = x;
            self.drag.y = y;

            style[transformPrefix] = transform;
        },

        applyPositionFromTransform: function() {

            var self = this,
                cfg = self.cfg,
                style = self.node.style,
                axis = cfg.drag.axis,
                transform = style[transformPrefix] || style["transform"] || "";

            if (axis != "x") {
                style.top = self.target.offsetY + self.drag.y + "px";
            }
            if (axis != "y") {
                style.left = self.target.offsetX + self.drag.x + "px";
            }

            transform = transform.replace(rTranslate, "");

            style[transformPrefix] = transform;
        },

        applyPosition: function(e) {

            var self = this,
                cfg = self.cfg,
                style = self.node.style,
                axis = cfg.drag.axis,
                x = e.clientX - self.drag.offsetX,
                y = e.clientY - self.drag.offsetY;

            if (axis != "x") {
                style.top = y + "px";
            }

            if (axis != "y") {
                style.left = x + "px";
            }

            self.drag.x = x;
            self.drag.y = y;
        },


        onMouseup: function(e) {
            e = prepareEvent(e, this.node);
            this.end(e);
            return this.processEvent(e);
        },

        end: function(e) {

            var self = this,
                cfg = self.cfg;

            self.setMoveEvents('unbind');

            if (!self.enabled || !self.started) {
                return;
            }

            self.trigger('beforeend', self, e);

            if (cfg.drag.method == "transform") {
                self.applyPositionFromTransform();
            }

            self.started = false;

            self.trigger('end', self, e);
        },

        destroy: function() {

            this.disable();

        }


    });


}());