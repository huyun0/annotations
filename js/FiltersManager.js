
define(["use!backbone"], function (Backbone) {

    "use strict";


    var FiltersManager = function (master) {
        _.extend(this, Backbone.Events);

        if (master instanceof FiltersManager) {
            this.master = master;
            this.isBindedToMaster = true;
            this.listenTo(master, "switch", this._switchListener);
        } else if (master) {
            console.warn("Parent for FiltersManager is not valid!");
        } else {
            delete this.bindToMaster;
            delete this.unbdindFromMaster;
        }
    };


    FiltersManager.prototype = {

        /**
         * List of filter used for the list elements
         * @alias module:views-list.List#filters
         * @type {Object}
         */
        filters: {

            mine: {
                active: false,
                filter: function (list) {
                    return _.filter(list, function (item) {
                        return item.model.get("isMine");
                    }, this);
                }
            },

            public: {
                active: false,
                filter: function (list) {
                    return _.filter(list, function (item) {
                        return item.model.get("isPublic");
                    }, this);
                }
            }

        },

        disableFilters: function () {
            _.each(this.filters, function (filter, index) {
                this.switchFilter(index, false);
            }, this);
        },

        switchFilter: function (id, active) {
            if (this.isBindedToMaster) {
                this.master.switchFilter(id, active);
            } else {
                this._switchFilterLocally(id, active);
            }
        },

        _switchFilterLocally: function (id, active) {
            this.filters[id].active = active;
            this.trigger("switch", {id: id, active: active});
        },

        _switchListener: function (attr) {
            if (this.isBindedToMaster) {
                this._switchFilterLocally(attr.id, attr.active);
            }
        },

        getFilters: function () {
            if (this.isBindedToMaster) {
                return this.master.filters;
            } else {
                return this.filters;
            }
        },

        bindToMaster: function () {
            this.isBindedToMaster = true;
        },

        unbdindFromMaster: function () {
            this.isBindedToMaster = false;
        }

    };

    return FiltersManager;

});