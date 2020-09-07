require("../../__init.js");
require("metaphorjs/src/func/dom/getOffset.js");
require("metaphorjs/src/func/dom/getWidth.js");
require("metaphorjs/src/func/dom/getHeight.js");
require("metaphorjs/src/func/dom/getOuterWidth.js");
require("metaphorjs/src/func/dom/getOuterHeight.js");
require("metaphorjs/src/func/dom/getStyle.js");
require("metaphorjs/src/func/dom/select.js");

const cls = require("metaphorjs-class/src/cls.js"),
    isArray = require("metaphorjs-shared/src/func/isArray.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");

module.exports = MetaphorJs.dnd.plugin.Boundary = cls({

    $class: "MetaphorJs.dnd.plugin.Boundary",
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
            if (typeof boundary === "string") {
                self.bndEl = MetaphorJs.dom.select(boundary).shift();
            }
            else if (boundary.nodeType) {
                self.bndEl = boundary;
            }
            else if (isArray(boundary)) {
                self.bnd = {
                    x:  boundary[0],
                    y:  boundary[1],
                    x1: boundary[2],
                    y1: boundary[3]
                };
            }
        }
    },

    cacheBoundaries: function() {
        var self = this,
            el = self.bndEl;

        if (el) {
            var ofs = MetaphorJs.dom.getOffset(el),
                bbox = MetaphorJs.dom.getStyle(el, "boxSizing") == "border-box";

            if (bbox) {
                self.bnd = {
                    x: ofs.left,
                    y: ofs.top,
                    x1: ofs.left + MetaphorJs.dom.getOuterWidth(el),
                    y1: ofs.top + MetaphorJs.dom.getOuterHeight(el)
                };
            }
            else {
                var bt = parseInt(MetaphorJs.dom.getStyle(el, "borderTop"), 10) ,
                    bl = parseInt(MetaphorJs.dom.getStyle(el, "borderLeft"), 10);

                self.bnd = {
                    x: ofs.left + bl,
                    y: ofs.top + bt,
                    x1: ofs.left + bl + MetaphorJs.dom.getWidth(el),
                    y1: ofs.top + bt + MetaphorJs.dom.getHeight(el)
                };
            }
        }

        //console.log(self.bnd)
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

        if (bnd.x != undefined && (diff = bnd.x - pos.x) > 0) {
            xdiff = diff;
        }
        if (bnd.x1 != undefined && (diff = bnd.x1 - (pos.x + state.w)) < 0) {
            xdiff = diff;
        }

        if (bnd.y != undefined && (diff = bnd.y - pos.y) > 0) {
            ydiff = diff;
        }
        if (bnd.y1 != undefined && (diff = bnd.y1 - (pos.y + state.h)) < 0) {
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