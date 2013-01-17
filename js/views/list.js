 
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

/**
 * A module representing the annotations list view
 * @module views-list
 * @requires jQuery
 * @requires underscore
 * @requires prototype-player_adapter
 * @requires models-annotation
 * @requires views-list-annotation
 * @requires backbone
 */
define(["jquery",
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "views/list-annotation",
        "backbone",
        "FiltersManager",
        "scrollspy"],
       
    function ($, PlayerAdapter, Annotation, Annotations, AnnotationView, Backbone, FiltersManager) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-list
         * @alias List
         */
        var List = Backbone.View.extend({
          
            /**
             * Annotations list container of the appplication
             * @alias module:views-list.List#el
             * @type {DOM element}
             */
            el: $("div#list-container"),
          
            /**
             * Annotation views list
             * @alias module:views-list.List#annotationViews
             * @type {Array}
             */
            annotationViews: [],


            /**
             * List of filter used for the list elements
             * @alias module:views-list.List#filters
             * @type {Object}
             */
            filters: {
                // Define if only the annotation created by the current user should be visible in the list
                mine: {
                    active: false,
                    filter: function (list) {
                        return _.filter(list, function (annotationView) {
                            return annotationView.model.get("isMine");
                        }, this);
                    }
                }
            },

            /**
             * Events to handle
             * @alias module:views-list.List#events
             * @type {object}
             */
            events: {
                "click #filter-none" : "disableFilter",
                "click .filter" : "switchFilter"
            },
          
            /**
             * Constructor
             * @alias module:views-list.List#initialize
             * @param {Object} attr Object literal containing the model initialion attribute.
             */
            initialize: function () {
                // Bind functions to the good context
                _.bindAll(this, "render",
                               "addTrack",
                               "addAnnotation",
                               "addList",
                               "sortViewsbyTime",
                               "reset",
                               "updateSelection",
                               "unselect",
                               "switchFilter",
                               "updateFiltersRender",
                               "disableFilter",
                               "doClick");
                
                this.annotationViews = [];

                this.filtersManager = new FiltersManager(annotationsTool.filtersManager);
                this.listenTo(this.filtersManager, "switch", this.updateFiltersRender);

                this.tracks = annotationsTool.video.get("tracks");
                this.listenTo(this.tracks, "add", this.addTrack);
                this.tracks.each(this.addTrack, this);
                
                this.playerAdapter = annotationsTool.playerAdapter;
                $(this.playerAdapter).bind(PlayerAdapter.EVENTS.TIMEUPDATE, this.updateSelection);

                return this.render();
            },
            
            /**
             * Add one track
             * @alias module:views-list.List#initialize
             * @param {Track} track to add
             */
            addTrack: function (track) {
                var ann = track.get("annotations"),
                    annotationTrack = track;

                this.listenTo(ann, "add", $.proxy(function (newAnnotation) {
                    this.addAnnotation(newAnnotation, annotationTrack);
                }, this));

                this.listenTo(ann, "destroy, destroy", this.removeOne);
                this.listenTo(ann, "change", this.sortViewsbyTime);

                this.addList(ann.toArray(), annotationTrack);
            },

            /**
             * Add an annotation as view to the list
             * @alias module:views-list.List#addAnnotation
             * @param {Annotation} the annotation to add as view
             * @param {Track} track Annotation target
             * @param {Boolean} isPartofList Define if the annotation is added with a whole list
             */
            addAnnotation: function (addAnnotation, track, isPartofList) {
                var view;
              
                // If annotation has not id, we save it to have an id
                if (!addAnnotation.id) {
                    this.listenTo(addAnnotation, "ready", this.addAnnotation);
                    return;
                }
                
                view = new AnnotationView({annotation: addAnnotation, track: track});
                this.annotationViews.push(view);

                if (!isPartofList) {
                    this.sortViewsbyTime();
                }
            },
            
            
            /**
             * Add a list of annotation, creating a view for each of them
             * @alias module:views-list.List#addList
             * @param {Array} annotationsList List of annotations
             */
            addList: function (annotationsList, track) {
                _.each(annotationsList, function (annotation) {
                    this.addAnnotation(annotation, track);
                }, this);
                
                if (annotationsList.length > 0) {
                    this.sortViewsbyTime();
                }
            },
            
            /**
             * Update the annotations selection
             * @alias module:views-list.List#updateSelection
             */
            updateSelection: function () {
                //if(this.playerAdapter.getStatus() != PlayerAdapter.STATUS.PLAYING)
                //  return;
                
                this.unselect();
                
                var currentTime = this.playerAdapter.getCurrentTime(),
                    firstSelection = true, // Tag for element selection
                    start,
                    end;
                
                _.each(this.annotationViews, function (view) {
                  
                    start = view.model.get("start");
                    
                    if (_.isNumber(view.model.get("duration"))) {
                        end = start + view.model.get("duration");
                      
                        if (start <= currentTime && end >= currentTime) {
                            view.selectVisually();
                            
                            if (firstSelection) {
                                this.doClick(view.$el.find("a.proxy-anchor")[0]);
                                firstSelection = false;
                            }
                        }
                    } else if (start <= currentTime && (start + 5) >= currentTime) {

                        view.selectVisually();

                        if (firstSelection) {
                            this.doClick(view.$el.find("a.proxy-anchor")[0]);
                            firstSelection = false;
                        }
                      
                    }

                }, this);
            },
            
            /**
             * Unselect all annotation views
             * @alias module:views-list.List#unselect
             */
            unselect: function ()  {
                this.$el.find(".selected").removeClass("selected");
            },
            
            /**
             * Remove the given annotation from the views list
             * @alias module:views-list.List#removeOne
             * @param {Annotation} Annotation from which the view has to be deleted
             */
            removeOne: function (delAnnotation) {
                _.find(this.annotationViews, function (annotationView, index) {
                    if (delAnnotation === annotationView.model) {
                        this.annotationViews.splice(index, 1);
                        this.render();
                        return;
                    }
                }, this);
            },
            
            /**
             * Sort all the annotations in the list by start time
             * @alias module:views-list.List#sortViewsByTime
             */
            sortViewsbyTime: function () {
                this.annotationViews = _.sortBy(this.annotationViews, function (annotationView) {
                    return annotationView.model.get("start");
                });
                this.render();
            },

            /**
             * Switch on/off the filter related to the given event
             * @alias module:views-list.List#switchFilter
             * @param  {Event} event
             */
            switchFilter: function (event) {
                var active = !$(event.target).hasClass("checked"),
                    id = event.target.id.replace("filter-", "");

                this.filtersManager.switchFilter(id, active);                
            },

            updateFiltersRender: function(attr){
                if (attr.active) {
                    this.$el.find("#filter-"+attr.id).addClass("checked");
                } else {
                    this.$el.find("#filter-"+attr.id).removeClass("checked");
                }
                this.render();
            },

            /**
             * Disable all the list filter
             * @alias module:views-list.List#disableFilter
             */
            disableFilter: function () {
                this.$el.find("#filter").removeClass("checked");

                this.filtersManager.disableFilters();

                this.render();
            },
            
            /**
             * Display the list
             * @alias module:views-list.List#render
             */
            render: function () {
                var list = this.annotationViews;

                this.$el.find("#content-list").empty();

                _.each(this.filtersManager.getFilters(), function (filter) {
                    if (filter.active) {
                        list = filter.filter(list);
                    }
                });
                
                _.each(list, function (annView) {
                    this.$el.find("#content-list").append(annView.render().$el);
                }, this);
                
                return this;
            },

            
            /**
             * Reset the view
             * @alias module:views-list.List#reset
             */
            reset: function () {
                this.$el.hide();

                _.each(this.annotationViews, function (annView) {
                    annView.undelegateEvents();
                    annView.stopListening();
                }, this);
                
                this.stopListening();

                this.annotationViews = [];
                this.$el.find("#content-list").empty();

                delete this.annotationViews;
                delete this.tracks;
                this.undelegateEvents();
            },
            
            /**
             * Simple function to simulate a click on the given element
             * @alias module:views-list.List#doClick
             * @param {DOM element} el click event target
             */
            doClick: function eventFire(el) {
                if (el.fireEvent) {
                    (el.fireEvent("onclick"));
                } else {
                    var evObj = document.createEvent("Events");
                    evObj.initEvent("click", true, false);
                    el.dispatchEvent(evObj);
                }
            }
            
        });
                
        return List;
    
    });