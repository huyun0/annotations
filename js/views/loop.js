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
                    "click .previous"  : "previousLoop"
                },

                /**
                 * Constructor
                 * @alias module:views-loop.Loop#initialize
                 */
                initialize: function () {
                    _.bindAll(this, "toggle",
                                    "createLoops",
                                    "checkLoop",
                                    "initSlider",
                                    "findCurrentLoop",
                                    "nextLoop",
                                    "previousLoop",
                                    "changeLoopLength",
                                    "resetLoops");
                    var duration;

                    this.playerAdapter = annotationsTool.playerAdapter;
                    this.loops = new Loops([], annotationsTool.video);


                    $("#video-container").after(this.loopTemplate());
                    this.setElement($("#loop")[0]);
                    $(this.playerAdapter).one(PlayerAdapter.EVENTS.READY, this.initSlider);

                    this.toggle(false);
                },

                initSlider: function () {
                    var duration = this.playerAdapter.getDuration();
                    this.currentLoopLength = Math.round(duration / 10);
                    this.slider = $("#slider").slider({
                            min     : 5,
                            max     : Math.round(duration - 1),
                            step    : 1,
                            value   : this.currentLoopLength,
                            formater: function (value) {
                                return value + " s";
                            }
                    });

                    $("#slider").bind("slideStop", this.changeLoopLength);
                    this.$el.find("#loop-length").html(this.currentLoopLength + " s");
                },

                /**
                 * Switch on/off the loop function
                 * @param  {Object} event The click event
                 * @alias module:views-loop.Loop#toggle
                 */
                toggle: function (event) {
                    var isEnable = (!event.target && _.isBoolean(event)) ? event : !(_.isUndefined($(event.target).attr("checked")));

                    if (isEnable) {
                        $(this.playerAdapter).bind(PlayerAdapter.EVENTS.TIMEUPDATE, this.checkLoop);
                        this.createLoops(this.currentLoopLength);
                        this.$el.removeClass("disabled");
                    } else {
                        $(this.playerAdapter).unbind(PlayerAdapter.EVENTS.TIMEUPDATE, this.checkLoop);
                        this.$el.addClass("disabled");
                    }

                    this.isEnable = isEnable;
                },

                /**
                 * Switch on/off the loop function
                 * @param  {Object} event The click event
                 * @alias module:views-loop.Loop#checkLoop
                 */
                checkLoop: function () {
                    if (_.isUndefined(this.currentLoop)) {
                        return;
                    }

                    var currentTime = this.playerAdapter.getCurrentTime(),
                        difference = (currentTime - this.currentLoop.get("end"));

                    if (difference >= 0 && difference < this.MAX_MARGIN) {
                        this.playerAdapter.setCurrentTime(this.currentLoop.get("start"));

                        if (currentTime === this.playerAdapter.getDuration()) {
                            this.playerAdapter.play();
                        }
                    } else if (difference > this.MAX_MARGIN) {
                        this.setCurrentLoop(this.findCurrentLoop());
                    }
                },

                /**
                 * Move to next loop
                 * @alias module:views-loop.Loop#nextLoop
                 */
                nextLoop: function () {
                    if (this.isEnable) {
                        this.setCurrentLoop(this.loops.indexOf(this.currentLoop) + 1);
                        this.playerAdapter.setCurrentTime(this.currentLoop.get("start"));
                    }
                },

                /**
                 * Move to previous loop
                 * @alias module:views-loop.Loop#previousLoop
                 */
                previousLoop: function () {
                    if (this.isEnable) {
                        this.setCurrentLoop(this.loops.indexOf(this.currentLoop) - 1);
                        this.playerAdapter.setCurrentTime(this.currentLoop.get("start"));
                    }
                },

                /**
                 * Change the loop length
                 * @alias module:views-loop.Loop#changeLoopLength
                 */
                changeLoopLength: function () {
                    this.currentLoopLength = parseInt(this.slider.val(), 10);
                    this.$el.find("#loop-length").html(this.currentLoopLength + " s");
                    this.createLoops(this.currentLoopLength);
                },

                /**
                 * Set the given loop as the current one
                 * @param {Object || Integer} loop The new loop object or its index
                 * @alias module:views-loop.Loop#setCurrentLoop
                 */
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

                /**
                 * Find and return the loop related to the current playhead
                 * @return {Object} Return the related loop
                 */
                findCurrentLoop: function () {
                    var currentTime = this.playerAdapter.getCurrentTime();

                    return this.loops.find(function (loop) {
                                return loop.get("start") <= currentTime && loop.get("end") >= currentTime;
                            });
                },

                /**
                 * Create all the loops with the given length
                 * @param  {Integer} event The click event
                 * @alias module:views-loop.Loop#createLoops
                 */
                createLoops: function (loopLength) {
                    var duration = this.playerAdapter.getDuration(),
                        i;

                    if (loopLength >= duration) {
                        annotationsTool.alertInfo("Interval too long to create one loop!");
                        return;
                    }

                    this.resetLoops();
                    this.currentLoopLength = loopLength;

                    for (i = 0; i < duration / loopLength; i++) {
                        this.loops.add({
                            start: i * loopLength,
                            end  : ((i + 1) * loopLength < duration ? (i + 1) * loopLength : duration )
                        });
                    }

                    this.setCurrentLoop(this.findCurrentLoop());
                },

                /**
                 * Reset the loops array
                 * @alias module:views-loop.Loop#resetLoops
                 */
                resetLoops: function () {
                    this.loops.each(function (loop) {
                        loop.destroy();
                    });

                    this.loops.reset();
                },

                /**
                 * Reset the view
                 * @alias module:views-loop.Loop#reset
                 */
                reset: function () {
                    this.resetLoops();
                    this.undelegateEvents();
                    this.$el.remove();
                }
            });

            return loopView;

        }
);