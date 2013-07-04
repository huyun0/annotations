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
 * @requires handlebars
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
                 * @constant
                 * @type {Number}
                 * @alias module:views-loop.Loop#MAX_MARGIN
                 */
                MAX_MARGIN: 3,

                /**
                 * The minimal length of a loop
                 * @constant
                 * @type {Number}
                 * @alias module:views-loop.Loop#MINIMAL_LOOP
                 */
                MINIMAL_LOOP: 5,

                /**
                 * Length of the step between each value of the slider
                 * @constant
                 * @type {Number}
                 * @alias module:views-loop.Loop#SLIDER_STEP
                 */
                SLIDER_STEP: 1,

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
                    "click #enableLoop"  : "toggle",
                    "click .next"        : "nextLoop",
                    "click .previous"    : "previousLoop",
                    "change #loop-length": "typeLoopLength"
                },

                /**
                 * Constructor
                 * @alias module:views-loop.Loop#initialize
                 */
                initialize: function () {
                    _.bindAll(this, "addTimelineItem",
                                    "changeLoopLength",
                                    "checkLoop",
                                    "createLoops",
                                    "findCurrentLoop",
                                    "initSlider",
                                    "nextLoop",
                                    "previousLoop",
                                    "resetLoops",
                                    "toggle",
                                    "typeLoopLength");
                    var duration;

                    this.playerAdapter = annotationsTool.playerAdapter;
                    this.loops = new Loops([], annotationsTool.video);

                    $("#video-container").after(this.loopTemplate());
                    this.setElement($("#loop")[0]);
                    this.initSlider();

                    this.toggle(false);
                },

                initSlider: function () {
                    var duration = this.playerAdapter.getDuration();

                    this.currentLoopLength = (duration / 10) < this.MINIMAL_LOOP ? this.MINIMAL_LOOP : Math.round(duration / 10);
                    this.slider = $("#slider").slider({
                            min     : this.MINIMAL_LOOP,
                            max     : Math.round(duration - 1),
                            step    : 1,
                            value   : this.currentLoopLength,
                            formater: function (value) {
                                return value + " s";
                            }
                    });

                    $("#slider").bind("slideStop", this.changeLoopLength);
                    this.$el.find("#loop-length").val(this.currentLoopLength);
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
                        this.resetLoops();
                        annotationsTool.views.timeline.redraw();
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
                 * Change the loop length through the text box
                 * @param  {Object} event The event object
                 * @alias module:views-loop.Loop#typeLoopLength
                 */
                typeLoopLength: function (event) {
                    var loopInput = $(event.target),
                        newValue = parseInt(loopInput.val(), 10);

                    if (_.isNaN(newValue) || newValue > this.playerAdapter.getDuration() || newValue < 0) {
                        annotationsTool.alertWarning("The given value for the loop length is not valid!");
                        loopInput.val(this.currentLoopLength);
                        return;
                    }

                    this.currentLoopLength = newValue;
                    this.$el.find("#slider").slider("setValue", this.currentLoopLength);
                    this.createLoops(this.currentLoopLength);
                },

                /**
                 * Change the loop length through the slider
                 * @param  {Object} event The event object
                 * @alias module:views-loop.Loop#changeLoopLength
                 */
                changeLoopLength: function (event) {
                    this.currentLoopLength = parseInt(event.value, 10);
                    this.$el.find("#loop-length").val(this.currentLoopLength);
                    this.$el.find("#slider").slider("setValue", this.currentLoopLength);
                    this.createLoops(this.currentLoopLength);
                },

                /**
                 * Set the given loop as the current one
                 * @param {Object || Integer} loop The new loop object or its index
                 * @alias module:views-loop.Loop#setCurrentLoop
                 */
                setCurrentLoop: function (loop) {
                    var index = _.isNumber(loop) ? loop : this.loops.indexOf(loop);

                    if (!_.isUndefined(this.currentLoop)) {
                        this.addTimelineItem(this.currentLoop, false);
                    }

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
                    this.addTimelineItem(this.currentLoop, true);
                },

                /**
                 * Find and return the loop related to the current playhead
                 * @return {Object} Return the related loop
                 */
                findCurrentLoop: function () {
                    var currentTime = this.playerAdapter.getCurrentTime();

                    return this.loops.find(function (loop) {
                                return loop.get("start") <= currentTime && loop.get("end") > currentTime;
                            });
                },

                /**
                 * Create all the loops with the given length
                 * @param  {Integer} event The click event
                 * @alias module:views-loop.Loop#createLoops
                 */
                createLoops: function (loopLength) {
                    var duration    = this.playerAdapter.getDuration(),
                        currentTime = this.playerAdapter.getCurrentTime(),
                        limit       = currentTime === 0 ? duration : currentTime,
                        isLimit     = false,
                        startTime   = 0,
                        endTime;

                    if (loopLength >= duration) {
                        annotationsTool.alertInfo("Interval too long to create one loop!");
                        return;
                    }

                    this.resetLoops();
                    this.currentLoopLength = loopLength;
                    this.currentLoop = undefined;

                    while (startTime < duration) {

                        if ((startTime + loopLength) >= limit) {
                            endTime = limit;
                            if (startTime < currentTime) {
                                limit   = duration;
                                isLimit = true;
                            }
                        } else {
                            endTime = startTime + loopLength;
                        }

                        this.loops.add({
                            start: startTime,
                            end  : endTime
                        });

                        if (isLimit) {
                            startTime = currentTime;
                            isLimit = false
                        } else {
                            startTime += loopLength;
                        }
                    }

                    this.loops.each(function (loop, index) {
                        this.addTimelineItem(loop, false);
                    }, this);

                    this.setCurrentLoop(this.findCurrentLoop());
                },

                /**
                 * Add the given loop on the timeline. If the given loop already has a representation, this one will be replaced.
                 * @param {object}  loop      The loop to represent on the timeline
                 * @param {Boolean} isCurrent Define if the loop is the current one
                 * @alias module:views-loop.Loop#addTimelineItem
                 */
                addTimelineItem: function (loop, isCurrent) {
                    var timeline    = annotationsTool.views.timeline,
                        loopClass   = isCurrent ? "loop current" : "loop";

                    timeline.addItem("loop-" + loop.cid, {
                        start  : timeline.getFormatedDate(loop.get("start")),
                        end    : timeline.getFormatedDate(loop.get("end")),
                        group  : "<div class=\"loop-group\">Loops",
                        content: "<div id=\"loop-" + loop.cid + "\" class=\"" + loopClass + "\"></div>"
                    });
                },

                /**
                 * Reset the loops array
                 * @alias module:views-loop.Loop#resetLoops
                 */
                resetLoops: function () {
                    this.loops.each(function (loop, index) {
                        annotationsTool.views.timeline.removeItem("loop-" + loop.cid);
                    });

                    this.loops.each(function (loop, index) {
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
                    this.isEnable = false;
                    this.$el.remove();
                }
            });

            return loopView;

        }
);