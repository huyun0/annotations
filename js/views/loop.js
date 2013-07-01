/**
 *  Copyright 2012, Entwine GmbH, Switzerland
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 */

/**
 * A module representing the loop modal
 * @module views-loop
 * @requires jQuery
 * @requires Backbone
 * @requires templates/loop-modal.tmpl
 * @requires ROLES
 * @requires hanldebars
 */
define(["jquery",
        "collections/loops",
        "prototypes/player_adapter",
        "backbone",
        "text!templates/loop-control.tmpl",
        "handlebars",
        "slider"],

        function ($, Loops, PlayerAdapter, Backbone, LoopTmpl, Handlebars) {

            "use strict";

            /**
             * @constructor
             * @see {@link http://www.backbonejs.org/#View}
             * @augments module:Backbone.View
             * @memberOf module:views-loop
             * @alias Loop
             */
            var loopView = Backbone.View.extend({

                /**
                 * Maximal margin supported to define if we are still in the same loop
                 * @alias module:views-loop.Loop#MAX_MARGIN
                 * @type {Number}
                 */
                MAX_MARGIN: 3,

                /**
                 * Loop template
                 * @alias module:views-loop.Loop#loopTemplate
                 * @type {Handlebars template}
                 */
                loopTemplate: Handlebars.compile(LoopTmpl),

                /**
                 * Events to handle
                 * @alias module:views-loop.Loop#events
                 * @type {object}
                 */
                events: {
                    "click #enableLoop": "toggle",
                    "click .next"      : "nextLoop",
                    "click .previous"  : "previousLoop",
                    "change select"    : "changeInterval"
                },

                /**
                 * Constructor
                 * @alias module:views-loop.Loop#initialize
                 */
                initialize: function () {
                    _.bindAll(this, "toggle",
                                    "createLoops",
                                    "checkLoop",
                                    "checkLoopEnded",
                                    "findCurrentLoop",
                                    "nextLoop",
                                    "previousLoop",
                                    "changeInterval",
                                    "resetLoops");

                    this.playerAdapter = annotationsTool.playerAdapter;
                    this.loops = new Loops([], annotationsTool.video);

                    $("#video-container").after(this.loopTemplate());
                    this.setElement($("#loop")[0]);

                    this.currentInterval = parseInt(this.$el.find("select").val(), 10);

                    this.toggle(false);
                },

                toggle: function (event) {
                    var isEnable = (!event.target && _.isBoolean(event)) ? event : !(_.isUndefined($(event.target).attr("checked")));

                    if (isEnable) {
                        $(this.playerAdapter).bind(PlayerAdapter.EVENTS.TIMEUPDATE, this.checkLoop);
                        $(this.playerAdapter).bind(PlayerAdapter.EVENTS.ENDED, this.checkLoopEnded);
                        this.$el.find("select").removeAttr("disabled");
                        this.createLoops(this.currentInterval);
                    } else {
                        $(this.playerAdapter).unbind(PlayerAdapter.EVENTS.TIMEUPDATE, this.checkLoop);
                        $(this.playerAdapter).unbind(PlayerAdapter.EVENTS.ENDED, this.checkLoopEnded);
                        this.$el.find("select").attr("disabled", "disabled");
                        this.$el.find(".previous, .next").hide();
                    }

                    this.isEnable = isEnable;
                },

                checkLoopEnded: function () {
                    this.playerAdapter.play();
                },

                checkLoop: function () {
                    if (_.isUndefined(this.currentLoop)) {
                        return;
                    }

                    var currentTime = this.playerAdapter.getCurrentTime(),
                        difference = (currentTime - this.currentLoop.get("end"));

                    if (difference >= 0 && difference < this.MAX_MARGIN) {
                        this.playerAdapter.setCurrentTime(this.currentLoop.get("start"));
                    } else if (difference > this.MAX_MARGIN) {
                        this.setCurrentLoop(this.findCurrentLoop());
                    }
                },

                nextLoop: function () {
                    if (this.isEnable) {
                        this.setCurrentLoop(this.loops.indexOf(this.currentLoop) + 1);
                        this.playerAdapter.setCurrentTime(this.currentLoop.get("start"));
                    }
                },

                previousLoop: function () {
                    if (this.isEnable) {
                        this.setCurrentLoop(this.loops.indexOf(this.currentLoop) - 1);
                        this.playerAdapter.setCurrentTime(this.currentLoop.get("start"));
                    }
                },

                changeInterval: function () {
                    this.currentInterval = parseInt(this.$el.find("select").val(), 10);
                    this.createLoops(this.currentInterval);
                },

                setCurrentLoop: function (loop) {
                    var index = _.isNumber(loop) ? loop : this.loops.indexOf(loop);

                    this.$el.find(".previous, .next").show();

                    if (index <= 0) {
                        index = 0;
                        this.$el.find(".previous").hide();
                    }

                    if (index >= (this.loops.size() - 1)) {
                        index = this.loops.size() - 1;
                        this.$el.find(".next").hide();
                    }

                    this.currentLoop = this.loops.at(index);
                },

                findCurrentLoop: function () {
                    var currentTime = this.playerAdapter.getCurrentTime();

                    return this.loops.find(function (loop) {
                                return loop.get("start") <= currentTime && loop.get("end") >= currentTime;
                            });
                },

                createLoops: function (interval) {
                    var duration = this.playerAdapter.getDuration(),
                        i;

                    if (interval >= duration) {
                        annotationsTool.alertInfo("Interval too long to create one loop!");
                        return;
                    }

                    this.resetLoops();
                    this.currentInterval = interval;

                    for (i = 0; i < duration / interval; i++) {
                        this.loops.add({
                            start: i * interval,
                            end  : ((i + 1) * interval < duration ? (i + 1) * interval : duration)
                        });
                    }

                    this.setCurrentLoop(this.findCurrentLoop());
                },

                resetLoops: function () {
                    this.loops.each(function (loop) {
                        loop.destroy();
                    });

                    this.loops.reset();
                },

                reset: function () {
                    this.resetLoops();
                }
            });

            return loopView;

        }
);