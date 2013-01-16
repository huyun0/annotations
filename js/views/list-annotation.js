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
 *
 */

define(["jquery", 
        "underscore", 
        "prototypes/player_adapter", 
        "models/annotation", 
        "models/user", 
        "text!templates/list-annotation.tmpl", 
        "backbone",
        "handlebars"],

function ($, _not, PlayerAdapter, Annotation, User, Template, Backbone, Handlebars) {

    /**
     * Transform time in seconds (i.e. 12.344) into a well formated time (01:12:04)
     *
     * @param {number} the time in seconds
     */
    var getWellFormatedTime = function(time) {
            var twoDigit = function(number) {
                    return(number < 10 ? "0" : "") + number;
                }

            var base = time.toFixed();
            var seconds = base % 60;
            var minutes = ((base - seconds) / 60) % 60;
            var hours = (base - seconds - minutes * 60) / 3600;
            return twoDigit(hours) + ":" + twoDigit(minutes) + ":" + twoDigit(seconds);
        };

    /**
     * Function to display time for handlebars
     */
    Handlebars.registerHelper("time", getWellFormatedTime);

    /**
     * Function to display the duration
     */
    Handlebars.registerHelper("end", function(start, duration) {
        if(duration && _.isNumber(duration) && duration > 0) return getWellFormatedTime(start + duration);
        else return undefined;
    });

    /**
     * Get nickname from user to display
     */
    Handlebars.registerHelper("nickname", function(user) {
        if(!_.isObject(user)) return window.annotationsTool.users.get(user).get("nickname");
        else return user.nickname;
    });


    /**
     *  View for each annotation in the annotations list view
     */

    var ListAnnotation = Backbone.View.extend({

        tagName: "div",

        className: "annotation",

        /** View template */
        template: Handlebars.compile(Template),

        /** Annotation views list */
        annotationViews: {},

        deleted: false,

        collapsed: false,

        /** Events to handle */
        events: {
            "click": "onSelect",
            "click i.delete": "deleteFull",
            "click .select": "onSelect",
            "click a.collapse": "onCollapse",
            "dblclick .start": "startEdit",
            "dblclick .end": "startEdit",
            "keydown .start-value": "onKeyDownSaveStart",
            "keydown .end-value": "onKeyDownSaveEnd",
            "focusout .start-value": "saveStart",
            "focusout .end-value": "saveEnd"
        },

        /**
         * @constructor
         */
        initialize: function(attr) {
            if(!attr.annotation) throw "The annotations have to be given to the annotate view.";

            // Bind function to the good context 
            _.bindAll(this, "render", "deleteFull", "deleteView", "onSelect", "onSelected", "selectVisually", "onCollapse", "startEdit", "saveStart", "saveEnd", "onKeyDownSaveStart", "onKeyDownSaveEnd");

            this.model = attr.annotation;

            this.id = this.model.get("id");

            // Add backbone events to the model 
            _.extend(this.model, Backbone.Events);

            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "destroy", this.deleteView);
            this.listenTo(this.model, "remove", this.deleteView);
            this.listenTo(this.model, "selected selected_timeline", this.onSelected);

            // Type use for delete operation
            this.typeForDelete = annotationsTool.deleteOperation.targetTypes.ANNOTATION;

            if(attr.track) this.track = attr.track;
            else this.track = annotationsTool.selectedTrack;

            return this.render();
        },

        /**
         * Delete completely the annotation
         */
        deleteFull: function(event) {
            if(event) event.stopImmediatePropagation();

            annotationsTool.deleteOperation.start(this.model, this.typeForDelete);
        },

        /**
         * Delete only this annotation view
         */
        deleteView: function() {
            this.remove();
            this.undelegateEvents();
            this.deleted = true;
        },

        /**
         * Move the video current time to this annotation
         */
        jumpTo: function() {
            this.model.trigger("jumpto", this.model.get("start"));
        },


        startEdit: function(event) {
            var $target = $(event.currentTarget).find("input");

            if($target.attr("disabled")) {
                $target.removeAttr("disabled");
            }
        },

        onKeyDownSaveStart: function(event) {
            if(event.keyCode === 13 && !event.shiftKey) {
                this.saveStart(event);
            }
        },

        onKeyDownSaveEnd: function(event) {
            if(event.keyCode === 13 && !event.shiftKey) {
                this.saveEnd(event);
            }
        },

        saveEnd: function(event) {
            var $target = $(event.currentTarget),
                value = $target.val(),
                values,
                seconds;

            $target.removeClass("error");

            if (!value.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)) {
                $target.addClass("error");
                return;
            } else {
                values = value.split(":");

                if (values.length === 3) {
                    seconds = parseInt(values[0])*3600+parseInt(values[1])*60+parseInt(values[2]);
                } else if (values.length === 2) {
                    seconds = parseInt(values[0])*60+parseInt(values[1]);
                } else {
                    seconds = parseInt(values[0]);
                }

                if (annotationsTool.playerAdapter.getDuration() < seconds || this.model.get("start") > seconds) {
                    $target.addClass("error");
                    return;
                } 

                this.model.set("duration", seconds-this.model.get("start")); 
                this.model.save();
            }

            $target.attr("disabled", "disabled");
        },

        saveStart: function(event) {
            var $target = $(event.currentTarget),
                value = $target.val(),
                values,
                seconds;

            $target.removeClass("error");

            if (!value.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)) {
                $target.addClass("error");
                return;
            } else {
                values = value.split(":");

                if (values.length === 3) {
                    seconds = parseInt(values[0])*3600+parseInt(values[1])*60+parseInt(values[2]);
                } else if (values.length === 2) {
                    seconds = parseInt(values[0])*60+parseInt(values[1]);
                } else {
                    seconds = parseInt(values[0]);
                }

                if ((this.model.get("duration")+this.model.get("start")) < seconds) {
                    $target.addClass("error");
                    return;
                } 

                this.model.set({start: seconds, duration: this.model.get("duration")+this.model.get("start")-seconds}); 
                this.model.save();
            }

            $target.attr("disabled", "disabled");
        },

        /**
         * Render this view
         */
        render: function() {
            if(this.deleted) {
                return "";
            }

            this.model.set({
                collapsed: this.collapsed
            }, {
                silent: true
            });
            var modelJSON = this.model.toJSON();
            modelJSON.track = this.track.get("name");
            modelJSON.text = modelJSON.text.replace(/\n/g, "<br/>");
            this.$el.html(this.template(modelJSON));
            this.delegateEvents(this.events);
            return this;
        },

        /**
         * Listener for click on this annotation
         */
        onSelect: function() {
            this.model.trigger("selected", this.model);
        },

        /**
         * Listener for selection done on this annotation
         */
        onSelected: function() {
            this.$el.parent().find(".selected").removeClass("selected");
            this.selectVisually();
            this.jumpTo();
        },


        /**
         * Show the selection on the annotation presentation
         */
        selectVisually: function() {
            this.$el.addClass("selected");
        },

        /**
         * Toggle the visibility of the text container
         */
        onCollapse: function(event) {
            event.stopImmediatePropagation();

            this.collapsed = !this.collapsed;

            this.$el.find(".collapse > i").toggleClass("icon-chevron-right").toggleClass("icon-chevron-down");

            if(this.collapsed) this.$el.find("div.in").collapse("hide");
            else this.$el.find("div.collapse").collapse("show");
        }

    });


    return ListAnnotation;


});