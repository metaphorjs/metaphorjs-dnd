

var defineClass = require("metaphorjs-class/src/func/defineClass.js"),
    getOffset = require("metaphorjs/src/func/dom/getOffset.js"),
    getWidth = require("metaphorjs/src/func/dom/getWidth.js"),
    getHeight = require("metaphorjs/src/func/dom/getHeight.js"),
    getOuterWidth = require("metaphorjs/src/func/dom/getOuterWidth.js"),
    getOuterHeight = require("metaphorjs/src/func/dom/getOuterHeight.js"),
    getStyle = require("metaphorjs/src/func/dom/getStyle.js"),
    select = require("metaphorjs-select/src/func/select.js"),
    isArray = require("metaphorjs/src/func/isArray.js"),
    undf = require("metaphorjs/src/var/undf.js");

module.exports = defineClass({

    $class: "draggable.plugin.Boundary",
    drg: null,
    bndEl: null,
    bnd: null,

    $init: function(draggable) {

        this.drg = draggable;
    },

    $beforeHostInit: function() {
        var self = this,
            drg = self.drg;
        drg.on("start", self.onStart, self);
        drg.on("correct-position", self.onPosition, self);
    },

    $afterHostInit: function(){

        var self = this,
            drg = self.drg,
            boundary = drg.boundary;

        if (boundary) {
            if (typeof boundary == "string") {
                self.bndEl = select(boundary).shift();
            }
            else if (boundary.nodeType) {
                self.bndEl = boundary;
            }
            else if (isArray(boundary)) {
                self.bnd = {
                    x:  boundary[0],
                    y:  boundary[1],
                    x1: boundary[2],
                    x2: boundary[3]
                };
            }
        }
    },

    cacheBoundaries: function() {
        var self = this,
            el = self.bndEl;

        if (el) {
            var ofs = getOffset(el),
                bbox = getStyle(el, "boxSizing") == "border-box";

            if (bbox) {
                self.bnd = {
                    x: ofs.left,
                    y: ofs.top,
                    x1: ofs.left + getOuterWidth(el),
                    y1: ofs.top + getOuterHeight(el)
                };
            }
            else {
                var bt = parseInt(getStyle(el, "borderTop"), 10) ,
                    bl = parseInt(getStyle(el, "borderLeft"), 10);

                self.bnd = {
                    x: ofs.left + bl,
                    y: ofs.top + bt,
                    x1: ofs.left + bl + getWidth(el),
                    y1: ofs.top + bt + getHeight(el)
                };
            }
        }
    },

    onStart: function() {
        this.cacheBoundaries();
    },

    onPosition: function(drg, pos) {

        var self = this,
            state = self.drg.state,
            bnd = self.bnd,
            diff,
            xdiff = 0,
            ydiff = 0;

        if (!bnd) {
            return;
        }

        if (bnd.x != undf && (diff = bnd.x - pos.x) > 0) {
            xdiff = diff;
        }
        if (bnd.x1 != undf && (diff = bnd.x1 - (pos.x + state.w)) < 0) {
            xdiff = diff;
        }

        if (bnd.y != undf && (diff = bnd.y - pos.y) > 0) {
            ydiff = diff;
        }
        if (bnd.y1 != undf && (diff = bnd.y1 - (pos.y + state.h)) < 0) {
            ydiff = diff;
        }

        pos.x += xdiff;
        pos.left += xdiff;
        pos.translateX += xdiff;
        pos.y += ydiff;
        pos.top += ydiff;
        pos.translateY += ydiff;
    }

});