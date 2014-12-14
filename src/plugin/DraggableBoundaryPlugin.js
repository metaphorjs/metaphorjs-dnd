

var defineClass = require("metaphorjs-class/src/func/defineClass.js");

module.exports = defineClass({

    $class: "draggable.Boundary",
    drg: null,

    $init: function(draggable) {

        var self = this,
            boundary = draggable.cfg.boundary;

        self.drg = draggable;

    },

    $beforeHostInit: function(){

        var drg = this.drg;

    }

});