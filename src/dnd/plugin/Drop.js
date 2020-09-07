require("../../__init.js");
require("../Droppable.js");

const cls = require("metaphorjs-class/src/cls.js"),
    MetaphorJs = require("metaphorjs-shared/src/MetaphorJs.js");


module.exports = MetaphorJs.dnd.plugin.Drop = cls({

    $class: "MetaphorJs.dnd.plugin.Drop",
    drg: null,
    droppables: null,

    $init: function(draggable) {
        var self = this;
        self.drg = draggable;
        self.droppables = [];
    },


    $beforeHostInit: function() {
        var self = this;

        self.drg.on("start", self.onStart, self);
        self.drg.on("end", self.onEnd, self);
        self.drg.on("drag", self.onDrag, self);
    },

    onStart: function(drg, e) {
        this.initDroppables(e);
    },

    initDroppables: function(e) {

        var self    = this,
            drg     = self.drg,
            to		= drg.drop,
            drps	= isFunction(to) ?
                        to.call(drg.$$callbackContext, drg) :
                        MetaphorJs.dnd.Droppable.getAll(),
            i, l;

        e = e || drg.lastMoveEvent || drg.startEvent;

        for (i = 0, l = drps.length; i < l; i++) {

            if (!drps[i]) {
                continue;
            }

            if (drps[i].isEnabled() && drps[i].setCurrentDraggable(drg)) {

                self.droppables.push({
                    drp: 	drps[i],
                    coords: drps[i].getCoords(),
                    over:	false
                });
            }
        }

        self.checkDroppables(e.pageX, e.pageY);
    },

    onDrag: function(drg, e, pos) {
        this.checkDroppables(pos.x, pos.y);
    },

    onEnd: function() {
        this.releaseDroppables();
    },

    checkDroppables: function(x, y) {

        var self    = this,
            drg     = self.drg,
            drps    = self.droppables,
            i, l;

        for (i = 0, l = drps.length; i < l; i++) {

            var d		= drps[i],
                coord	= d.coords,
                over	= d.over;

            if (coord.x <= x && coord.x1 >= x && coord.y <= y && coord.y1 >= y) {
                if (!over) {
                    d.drp.setDraggableOver(drg);
                    d.over = true;
                }
            }
            else {
                if (over) {
                    d.drp.setDraggableOut(drg);
                    d.over = false;
                }
            }
        }
    },

    releaseDroppables: function() {

        var self    = this,
            drg     = self.drg,
            drps    = self.droppables,
            i, l, d;

        for (i = 0, l = drps.length; i < l; i++) {

            d = drps[i];
            if (d.over) {
                drg.trigger('before-drop', drg, d.drp);
                drg.trigger('drop', drg, d.drp);
                d.drp.drop(drg);
            }
        }

        self.droppables = [];
    }
});