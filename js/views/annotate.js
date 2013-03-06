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
        "collections/annotations",
        "collections/categories",
        "views/annotate-tab",
        "text!templates/annotate-tab-title.tmpl",
        "roles",
        "access",
        "handlebars",
        "backbone"],
       
    function ($, _, PlayerAdapter, Annotation, Annotations, Categories, AnnotateTab, TabTitleTemplate, ROLES, ACCESS, Handlebars, Backbone) {

        "use strict";

        var TAB_LINK_PREFIX = "#labelTab-",

            DEFAULT_TABS = {
              ALL: {
                      id:  "all",
                      name: "All",
                      roles: []
                    },
              PUBLIC: {
                        id:  "public",
                        name: "Public",
                        filter: {isPublic: true},
                        roles: [ROLES.SUPERVISOR],
                        attributes: {access: ACCESS.PUBLIC}
                      },
              MINE: {
                      id:  "mine",
                      name: "Mine",
                      filter: {isPublic: false},
                      roles: [ROLES.SUPERVISOR, ROLES.USER],
                      attributes: {access: ACCESS.PRIVATE}
                    }
            },

            /**
             * View to add annotation
             */
            Annotate = Backbone.View.extend({
          
            /** Main container of the appplication */
            el: $("div#annotate-container"),
            
            /** The player adapter passed during initialization part */
            playerAdapter: null,
            
            /** Events to handle by the annotate view */
            events: {
                "keyup #new-annotation"             : "keydownOnAnnotate",
                "click #insert"                     : "insert",
                "click #annotate-full"              : "setLayoutFull",
                "click #annotate-text"              : "setLayoutText",
                "click #annotate-categories"        : "setLayoutCategories",
                "click .toggle-collapse"            : "toggleVisibility",
                "keydown #new-annotation"           : "onFocusIn",
                "focusout #new-annotation"          : "onFocusOut",
                "click #label-tabs-buttons a"       : "showTab",
                "click #editSwitch"                 : "onSwitchEditModus"
            },

            /** Template for tabs button */
            tabsButtonTemplate: Handlebars.compile(TabTitleTemplate),

            /** Element containing the tabs buttons */
            tabsButtonsElement: $("ul#label-tabs-buttons"),

            /** Element containing the tabs contents */
            tabsContainerElement: $("div#label-tabs-contents"),

            /** Define edit mode is on or not */
            editModus: false,

            /** Arrays of key currently prressed */
            pressedKeys: {},

            categoriesTabs: {},
          
            /**
             * @constructor
             */
            initialize: function (attr) {
                var categories;

                  
                // Set the current context for all these functions
                _.bindAll(this,
                          "insert",
                          "render",
                          "reset",
                          "onFocusIn",
                          "onFocusOut",
                          "changeTrack",
                          "addTab",
                          "onSwitchEditModus",
                          "switchEditModus",
                          "keyupOnAnnotate",
                          "keydownOnAnnotate",
                          "setLayoutCategories",
                          "setLayoutText",
                          "setLayoutFull",
                          "toggleVisibility");
                
                // Parameter for stop on write
                this.continueVideo = false;
                
                // New annotation input
                this.input = this.$("#new-annotation");
                
                // Print selected track
                this.trackDIV = this.$el.find("div.currentTrack span.content");
                this.changeTrack(annotationsTool.selectedTrack);
                
                this.tracks = annotationsTool.video.get("tracks");
                this.tracks.bind("selected_track", this.changeTrack, this);
                this.playerAdapter = attr.playerAdapter;

                if (annotationsTool.isStructuredAnnotationEnabled()) {
                    categories = annotationsTool.video.get("categories");

                    _.each(DEFAULT_TABS, function (params) {
                      this.addTab(categories, params);
                    }, this)
                } else {
                    this.$el.find("#categories").hide();
                    this.$el.find("#annotate-categories").parent().hide();
                }

                if (!annotationsTool.isFreeTextEnabled()) {
                    this.$el.find("#input-container").hide();
                    this.$el.find("#annotate-text").parent().hide();
                }

                this.$el.find("#annotate-full").addClass("checked");

                this.tabsContainerElement.find("div.tab-pane:first-child").addClass("active");
                this.tabsButtonsElement.find("a:first-child").parent().first().addClass("active");

                // Add backbone events to the model 
                _.extend(this, Backbone.Events);
            },
            
            /**
             * Proxy function for insert through 'enter' keypress
             */
            keydownOnAnnotate: function (e) {
                // this.pressedKeys[e.keyCode] = true;

                // If enter is pressed and shit not, we insert a new annotation
                if (e.keyCode === 13 && !e.shiftKey) {
                    this.insert();
                }
            },

            keyupOnAnnotate: function (e) {
                this.pressedKeys[e.keyCode] = false;
            },
            
            /**
             * Insert a new annotation
             */
            insert: function () {
                var value = this.input.val(),
                    time = this.playerAdapter.getCurrentTime(),
                    params;
                
                if (!value || (!_.isNumber(time) || time < 0)) {
                    return;
                }
                
                params = {
                    text: value,
                    start: time
                };

                annotationsTool.selectedTrack.get("annotations").create(params, {wait: true});
                
                if (this.continueVideo) {
                    this.playerAdapter.play();
                }

                this.input.val("");
            },
            
            /**
             * Change the current selected track by the given one
             */
            changeTrack: function (track) {
                // If the track is valid, we set it
                if (track) {
                    this.input.attr("disabled", false);
                    this.trackDIV.html(track.get("name"));
                } else {
                    // Otherwise, we disable the input and inform the user that no track is set
                    this.input.attr("disabled", true);
                    this.trackDIV.html("<span class='notrack'>Select a track!</span>");
                }
            },
            
            /**
             * Listener for when a user start to write a new annotation,
             * manage if the video has to be or not paused.
             */
            onFocusIn: function () {
                if (!this.$el.find("#pause-video").attr("checked") || (this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED)) {
                    return;
                }
                  
                this.continueVideo = true;
                this.playerAdapter.pause();
                
                // If the video is moved, or played, we do no continue the video after insertion
                $(this.playerAdapter).one(PlayerAdapter.EVENTS.TIMEUPDATE, function () {
                    this.continueVideo = false;
                });
            },
            
            /**
             * Listener for when we leave the annotation input
             */
            onFocusOut: function () {
                if (this.continueVideo) {
                    this.continueVideo = false;
                    this.playerAdapter.play();
                }
            },

            /**
             * Show the tab related to the source from the event
             * @param {Event} event Event related to the action
             */
            showTab: function (event) {
                var tabId = event.currentTarget.attributes.getNamedItem("href").value;
                //event.preventDefault();

                tabId = tabId.replace(TAB_LINK_PREFIX,"");


                $(event.currentTarget).one("shown", $.proxy(function (event) {
                  this.categoriesTabs[tabId].initCarousel();
                }, this));

                $(event.currentTarget).tab("show");
                
            },

            /**
             * Add a new categories tab in the annotate view
             */
            addTab: function (categories, attr) {
                var params = {
                        id: attr.id,
                        name: attr.name,
                        categories: categories,
                        filter: attr.filter,
                        roles: attr.roles,
                        attributes: attr.attributes
                    },
                    newButton = this.tabsButtonTemplate(params),
                    annotateTab;

                newButton = $(newButton).appendTo(this.tabsButtonsElement);
                params.button = newButton;

                annotateTab = new AnnotateTab(params);

                this.categoriesTabs[attr.id] = annotateTab;
                this.tabsContainerElement.append(annotateTab.$el);
            },

            /**
             * Listener for edit modus switch.
             * @param {Event} event Event related to this action
             */
            onSwitchEditModus: function (event) {
                this.switchEditModus($(event.target).attr("checked") === "checked");
            },

            /**
             *  Switch the edit modus to the given status.
             * @param  {Boolean} status The current status
             */
            switchEditModus: function (status) {
                this.editModus = status;

                this.$el.toggleClass("edit-on", status);

                // trigger an event that all element switch in edit modus
                annotationsTool.video.trigger("switchEditModus", status);
            },

            setLayoutFull: function (event) {
              if (!$(event.target).hasClass("checked")) {
                if (annotationsTool.isStructuredAnnotationEnabled()) {
                  this.$el.find("#categories").show();
                }
                if (annotationsTool.isFreeTextEnabled()) {
                  this.$el.find("#input-container").show();
                }
                  this.$el.find("#annotate-text").removeClass("checked");
                this.$el.find("#annotate-categories").removeClass("checked");
                $(event.target).addClass("checked");
                this.trigger("change-layout");
              }
            },

            setLayoutText: function (event) {
              if (!$(event.target).hasClass("checked")) {
                this.$el.find("#categories").hide();
                this.$el.find("#input-container").show();
                this.$el.find("#annotate-full").removeClass("checked");
                this.$el.find("#annotate-categories").removeClass("checked");
                $(event.target).addClass("checked");
                this.trigger("change-layout");
              }
            },

            setLayoutCategories: function (event) {
              if (!$(event.target).hasClass("checked")) {
                this.$el.find("#categories").show();
                this.$el.find("#input-container").hide();
                this.$el.find("#annotate-text").removeClass("checked");
                this.$el.find("#annotate-full").removeClass("checked");
                $(event.target).addClass("checked");
                this.trigger("change-layout");
              }
            },

            toggleVisibility: function (event) {
              var mainContainer = this.$el.find(".control-group");

              if (mainContainer.css("display") === "none") {
                mainContainer.show();
                $(event.target).html("Collapse");
              } else {
                mainContainer.hide();
                $(event.target).html("Expand");
              }
              this.trigger("change-layout");
            },
            
            /**
             * Reset the view
             */
            reset: function () {
                this.$el.hide();
                delete this.tracks;
                this.undelegateEvents();

                if (annotationsTool.isStructuredAnnotationEnabled()) {
                  this.tabsContainerElement.empty();
                  this.$el.find("#editSwitch input").attr("checked",false);
                  this.tabsButtonsElement.find(".tab-button").remove();
                }
            }
            
        });
              
              
        return Annotate;
    
    
    });