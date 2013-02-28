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
 * A module representing the timeline view
 * @module views-timeline
 * @requires jQuery
 * @requires underscore
 * @requires prototype-player_adapter
 * @requires models-annotation
 * @requires templates/timeline-group.tmpl
 * @requires templates/timeline-item.tmpl
 * @requires templates/timeline-modal-group.tmpl
 * @requires ACCESS
 * @requires timeline
 * @requires bootstrap.tooltip
 * @requires bootstrap.popover
 * @requires backbone
 */
define(["jquery",
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "text!templates/timeline-group.tmpl",
        "text!templates/timeline-item.tmpl",
        "text!templates/timeline-modal-group.tmpl",
        "access",
        "roles",
        "FiltersManager",
        "backbone",
        "handlebars",
        "timeline",
        "tooltip",
        "popover"],
       
    function ($, PlayerAdapter, Annotation, Annotations, GroupTmpl, ItemTmpl, ModalGroupTmpl, ACCESS, ROLES, FiltersManager, Backbone, Handlebars) {

        "use strict";

        /**
         * Handlebars helper to secure the text field
         * @memberOf module:views-timeline
         * @param  {String} text The text to secure
         * @return {String}      The securized text
         */
        Handlebars.registerHelper("secure", function (text) {
            // Add security for XSS
            return _.unescape(text).replace(/\"/g, "'").replace(/<\/?script>/gi, "NO-SCRIPT");
        });

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-timeline
         * @alias module:views-timeline.Timeline
         */
        var Timeline = Backbone.View.extend({
            
            /** 
             * Main container of the timeline
             * @type {DOM Element}
             */
            el: $("div#timeline-container")[0],
            
            /** 
             * Group template 
             * @type {Moustache template}
             */
            groupTemplate: Handlebars.compile(GroupTmpl),
            
            /** 
             * item template 
             * @type {Moustache template}
             */
            itemTemplate: Handlebars.compile(ItemTmpl),
            
            /** Modal template for group insertion */
            modalGroupTemplate: Handlebars.compile(ModalGroupTmpl),
            
            /** Events to handle by the timeline view */
            events: {
                "click #add-track"            : "initTrackCreation",
                "click #reset-zoom"           : "onTimelineResetZoom",
                "click #filter-none"          : "disableFilter",
                "click .filter"               : "switchFilter"
            },
            
            /** 
             * Template for void item content 
             * @type {String}
             * @constant
             */
            VOID_ITEM: "<div style=\"display:none\"></div>",
            
            /** 
             * Default duration for annotation 
             * @type {Integer}
             * @constant
             */
            DEFAULT_DURATION: 5,

            /**
             * Class prefix for stack level
             * @type {String}
             * @constant
             */
            PREFIX_STACKING_CLASS: "stack-level-",

            /**
             * Map containing all the items
             * @type {Map}
             */
            allItems: {},

            /**
             * Array containing only the items who passed the filters
             * @type {Array}
             */
            filteredItems: [],
          
            /**
             * Constructor
             * @alias module:views-timeline.Timeline#initialize
             * @param {Object} attr Object literal containing the model initialion attribute.
             */
            initialize: function (attr) {

                _.bindAll(this, "addTrack",
                               "addTracksList",
                               "createTrack",
                               "onDeleteTrack",
                               "onTrackSelected",
                               "onPlayerTimeUpdate",
                               "onTimelineMoved",
                               "onTimelineItemChanged",
                               "onTimelineItemDeleted",
                               "onTimelineItemSelected",
                               "onTimelineItemUnselected",
                               "isAnnotationSelectedonTimeline",
                               "onTimelineItemAdded",
                               "onAnnotationDestroyed",
                               "onDeletePressed",
                               "generateVoidItem",
                               "generateItem",
                               "changeItem",
                               "getFormatedDate",
                               "getSelectedItemAndAnnotation",
                               "getStackLevel",
                               "getTrack",
                               "getAnnotation",
                               "onWindowResize",
                               "onTimelineResetZoom",
                               "initTrackCreation",
                               "filterItems",
                               "switchFilter",
                               "updateFiltersRender",
                               "disableFilter",
                               "redraw",
                               "reset");
                

                this.playerAdapter = attr.playerAdapter;

                this.filtersManager = new FiltersManager(annotationsTool.filtersManager);
                this.listenTo(this.filtersManager, "switch", this.updateFiltersRender);
                
                // Type use for delete operation
                this.typeForDeleteAnnotation = annotationsTool.deleteOperation.targetTypes.ANNOTATION;
                this.typeForDeleteTrack = annotationsTool.deleteOperation.targetTypes.TRACK;
                
                this.endDate = this.getFormatedDate(this.playerAdapter.getDuration());
                this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate(), 0, 0, 0);
                
                // Options for the links timeline
                this.options = {
                    width:  "100%",
                    height: "auto",
                    style: "box",
                    //scale: links.Timeline.StepDate.SCALE.SECOND,
                    //step: 30,
                    showButtonNew: false,
                    editable: true,
                    start: this.startDate,
                    end: this.endDate,
                    min: this.startDate,
                    max: this.endDate,
                    intervalMin: 1000,
                    showCustomTime: true,
                    showNavigation: true,
                    showMajorLabels: true,
                    stackEvents: true,
                    minHeight: "200",
                    axisOnTop: true,
                    groupsWidth: "150px",
                    animate: true,
                    animateZoom: true,
                    // cluster: true,
                    eventMarginAxis: 0,
                    eventMargin: 0,
                    dragAreaWidth: 10,
                    groupsChangeable: true
                };
                
                // Create the timeline
                this.timeline = new links.Timeline(this.$el.find("#timeline")[0]);
                this.timeline.draw(this.filteredItems, this.options);
                this.listenTo(annotationsTool.dispatcher, "unselect-annotation", this.timeline.unselectItem);
                
                // Ensure that the timeline is redraw on window resize
                $(window).bind("resize", this.onWindowResize);
                $(window).bind("selectTrack", $.proxy(this.onTrackSelected, this));
                $(window).bind("deleteTrack", $.proxy(this.onDeleteTrack, this));
                $(window).bind("updateTrack", $.proxy(this.onUpdateTrack, this));
                $(window).bind("keydown", $.proxy(this.onDeletePressed, this));
                
                $(this.playerAdapter).bind("pa_timeupdate", this.onPlayerTimeUpdate);

                links.events.addListener(this.timeline, "timechanged", this.onTimelineMoved);
                links.events.addListener(this.timeline, "timechange", this.onTimelineMoved);
                links.events.addListener(this.timeline, "change", this.onTimelineItemChanged);
                links.events.addListener(this.timeline, "delete", this.onTimelineItemDeleted);
                links.events.addListener(this.timeline, "select", this.onTimelineItemSelected);
                links.events.addListener(this.timeline, "add", this.onTimelineItemAdded);
                
                this.tracks = annotationsTool.video.get("tracks");
                this.tracks.bind("add", this.addTrack, this);
                
                this.$el.show();
                this.addTracksList(this.tracks);
                this.timeline.setCustomTime(this.startDate);

                // Overwrite the redraw method
                this.timeline.redraw = this.redraw;

                // Add findGroup method to the timeline if missing
                if (!this.timeline.findGroup) {
                    this.timeline.findGroup = this.findGroup;
                    _.bindAll(this.timeline, "findGroup");
                }

                //this.timeline.setAutoScale(true);
                $("div.timeline-group .content").popover({});
                this.timeline.redraw();
            },


            /**
             * Search for the group/track with the given name in the timeline 
             * @alias module:views-timeline.Timeline#findGroup
             * @param {module:models-annotation.Annotation} groupName the name of the group/track to search
             * @return {Object} The search group/track as timeline-group if found, or undefined
             */
            findGroup: function (groupName) {
                    var searchedGroup;

                    _.each(this.groups, function (group) {
                        if ($(group.content).find("div.content").text().toUpperCase() === groupName.toUpperCase()) {
                            searchedGroup = group;
                        } 
                    })

                    return searchedGroup;
            },


            /**
             * Add an annotation to the timeline
             * @alias module:views-timeline.Timeline#redraw
             */
            redraw: function () {
                var selection;
                selection = this.timeline.getSelection(selection);
                this.timeline.draw(this.filteredItems, this.option);

                if (selection.length > 0) {
                    this.timeline.selectItem(selection[0].row);
                }

                $("div.timeline-group .content").popover({});

                /*if (annotationsTool.selectedTrack) {
                    this.onTrackSelected(null, annotationsTool.selectedTrack.id);
                }*/

                console.log("TIMELINE: Redraw");
            },

            /**
             * Add an annotation to the timeline
             * @alias module:views-timeline.Timeline#addAnnotation
             * @param {Annotation} annotation the annotation to add.
             * @param {Track} track  the track where the annotation must be added
             * @param {Boolean} [isList]  define if the insertion is part of a list, Default is false
             */
            addAnnotation: function (annotation, track, isList) {
                if (annotation.get("oldId") && this.ignoreAdd === annotation.get("oldId")) {
                    console.log("TIMELINE: Ignore add");
                    return;
                }
                
                // If annotation has not id, we save it to have an id
                if (!annotation.id) {
                    annotation.bind("ready", this.addAnnotation, this);
                    return;
                }

                this.allItems[annotation.id] = this.generateItem(annotation, track);

                if (!isList) {
                    this.filterItems();
                    this.timeline.redraw();
                    annotationsTool.currentSelection = annotation;
                    this.onPlayerTimeUpdate();
                }
                  
                annotation.bind("destroy", this.onAnnotationDestroyed, this);
            },

            /**
             * Add a track to the timeline
             * @alias module:views-timeline.Timeline#addTrack
             * @param {Track} track The track to add to the timline
             */
            addTrack: function (track) {
                var annotations,
                    proxyToAddAnnotation = function (annotation) {
                        this.addAnnotation(annotation, track, false);
                    },
                    annotationWithList = function (annotation) {
                        this.addAnnotation(annotation, track, true);
                    };

                // If track has not id, we save it to have an id
                if (!track.id) {
                    track.bind("ready", this.addTrack, this);
                    return;
                }
                
                // Add void item
                this.allItems["track_" + track.id] = this.generateVoidItem(track);

                annotations = track.get("annotations"),
                annotations.each(annotationWithList, this);
                annotations.bind("add", proxyToAddAnnotation, this);
                annotations.bind("change", this.changeItem, this);
                annotations.bind("remove", $.proxy(function (annotation) {
                    this.onAnnotationDestroyed(annotation, track);
                }, this), this);

                this.filterItems();
                this.timeline.redraw();
            },
            
            /**
             * Add a list of tracks, creating a view for each of them
             * @alias module:views-timeline.Timeline#addTracksList
             * @param {Array or List} tracks The list of tracks to add
             */
            addTracksList: function (tracks) {
                tracks.each(this.addTrack, this);
            },
            
            /**
             * Get a void timeline item for the given track
             * @alias module:views-timeline.Timeline#generateVoidItem
             * @param {Track} track Given track owning the void item
             * @return {Object} the generated timeline item
             */
            generateVoidItem: function (track) {
                var trackJSON = track.toJSON();

                trackJSON.id = track.id;
                trackJSON.isSupervisor = (annotationsTool.user.get("role") === ROLES.SUPERVISOR);
              
                return {
                    model   : track,
                    trackId : track.id,
                    isMine  : track.get("isMine"),
                    isPublic: track.get("isPublic"),
                    start   : this.startDate - 5000,
                    end     : this.startDate - 4500,
                    content : this.VOID_ITEM,
                    group   : this.groupTemplate(trackJSON)
                };
            },

            /**
             * Get an timeline item from the given annotation
             * @alias module:views-timeline.Timeline#generateItem
             * @param {Annotation}  
             * @param {Track} track Track where the annotation is saved
             * @return {Object} the generated timeline item
             */
            generateItem: function (annotation, track) {
                var videoDuration = this.playerAdapter.getDuration(),
                    annotationJSON,
                    trackJSON,
                    startTime,
                    endTime,
                    start,
                    end;

                annotation.set("level", this.PREFIX_STACKING_CLASS + this.getStackLevel(annotation), {silent: true});

                annotationJSON       = annotation.toJSON();
                annotationJSON.id    = annotation.id;
                annotationJSON.track = track.id;
                annotationJSON.text  = annotation.get("text");

                if (annotationJSON.label && annotationJSON.label.category && annotationJSON.label.category.settings) {
                    annotationJSON.category = annotationJSON.label.category;
                }

                // Prepare track informations
                trackJSON              = track.toJSON();
                trackJSON.id           = track.id;
                trackJSON.isSupervisor = (annotationsTool.user.get("role") === ROLES.SUPERVISOR);

                // Calculate start/end time
                startTime = annotation.get("start");
                endTime   = startTime + annotation.get("duration");
                start     = this.getFormatedDate(startTime);
                end       = this.getFormatedDate(endTime);

                // If annotation is at the end of the video, we mark it for styling
                annotationJSON.atEnd = (videoDuration - endTime) < 3;

                return {
                    model   : track,
                    id      : annotation.id,
                    trackId : track.id,
                    isPublic: track.get("isPublic"),
                    isMine  : track.get("isMine"),
                    start   : start,
                    end     : end,
                    content : this.itemTemplate(annotationJSON),
                    group   : this.groupTemplate(trackJSON)
                };
            },
            
            /**
             * Add a track to the timeline
             *
             * @param {Object} JSON object compose of a name and description properties. Example: {name: "New track", description: "A test track as example"}
             */
            createTrack: function (param) {
                var track;

                if (this.timeline.findGroup(param.name)) {
                    // If group already exist, we do nothing
                    return;
                }

                track = this.tracks.create(param, {wait: true});
                
                // If no track selected, we use the new one
                if (!annotationsTool.selectedTrack) {
                    annotationsTool.selectedTrack = track;
                }
                
                this.timeline.redraw();
                this.onTrackSelected(null, annotationsTool.selectedTrack.id);
            },
            
            /**
             * Load the modal window to add a new track
             */
            initTrackCreation: function () {
                var self = this,
                    access,
                    name,
                    description,
                    insertTrack = function () {
                        name = self.groupModal.find("#name")[0].value;
                        description = self.groupModal.find("#description")[0].value;

                        if (name === "") {
                            self.groupModal.find(".alert #content").html("Name is required!");
                            self.groupModal.find(".alert").show();
                            return;
                        } else if (name.search(/<\/?script>/i) >= 0 || description.search(/<\/?script>/i) >= 0) {
                            self.groupModal.find(".alert #content").html("Scripts are not allowed!");
                            self.groupModal.find(".alert").show();
                            return;
                        }

                        if (self.groupModal.find("#public").length > 0) {
                            access = self.groupModal.find("#public")[0].checked ? ACCESS.PUBLIC : ACCESS.PRIVATE;
                        } else {
                            access = ACCESS.PUBLIC;
                        }

                        self.createTrack({
                            name       : name,
                            description: description,
                            access     : access
                        }, this);
                          
                        self.groupModal.modal("toggle");
                    };
                
                // If the modal is already loaded and displayed, we do nothing
                if ($("div#modal-add-group.modal.in").length > 0) {
                    return;
                } else if (!this.groupModal) {
                    // Otherwise we load the login modal if not loaded
                    $("body").append(this.modalGroupTemplate({isSupervisor: annotationsTool.user.get("role") === ROLES.SUPERVISOR}));
                    this.groupModal = $("#modal-add-group");
                    this.groupModal.modal({show: true, backdrop: false, keyboard: true });
                    this.groupModal.find("a#add-group").bind("click", insertTrack);
                    this.groupModal.bind("keypress", function (event) {
                        if (event.keyCode === 13) {
                            insertTrack();
                        }
                    });
                    
                    this.groupModal.on("shown", $.proxy(function () {
                        this.groupModal.find("#name").focus();
                    }, this));
                    
                    this.groupModal.find("#name").focus();
                }
                else {
                    // if the modal has already been initialized, we reset input and show modal
                    this.groupModal.find(".alert #content").html("");
                    this.groupModal.find(".alert").hide();
                    this.groupModal.find("#name")[0].value = "";
                    this.groupModal.find("#description")[0].value = "";
                    this.groupModal.modal("toggle");
                }
            },

            /**
             * Go through the list of items with the current active filter and save it in the filtered items array.
             * @alias module:views-timeline.Timeline#filterItems
             * @return {Array} The list of filtered items
             */
            filterItems: function () {
                var tempList = _.values(this.allItems);

                _.each(this.filtersManager.getFilters(), function (filter) {
                    if (filter.active) {
                        tempList = filter.filter(tempList);
                    }
                });

                return this.filteredItems = tempList;
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

            updateFiltersRender: function (attr) {
                if (attr.active) {
                    this.$el.find("#filter-" + attr.id).addClass("checked");
                } else {
                    this.$el.find("#filter-" + attr.id).removeClass("checked");
                }

                this.filterItems();
                this.timeline.redraw();
            },

            /**
             * Disable all the list filter
             * @alias module:views-list.List#disableFilter
             */
            disableFilter: function () {
                this.$el.find(".filter").removeClass("checked");

                this.filtersManager.disableFilters();

                this.filterItems();
                this.timeline.redraw();
            },
            
            /**
             * Check the position for the changed item
             *
             * @param {Annotation} the annotation that has been changed
             */
            changeItem: function (annotation) {
                var value = this.getTimelineItemFromAnnotation(annotation);
                this.allItems[annotation.id] = this.generateItem(annotation, value.model);
                this.filterItems();
                this.timeline.redraw();
            },
            
            /**
             * Listener for the player timeupdate
             */
            onPlayerTimeUpdate: function () {
                var newDate = this.getFormatedDate(this.playerAdapter.getCurrentTime()),
                    data;

                this.timeline.setCustomTime(newDate);

                console.log("TIMELINE: Player update");
                
                // Select the good items
                //data = this.timeline.getData();
                data = this.filteredItems;
                
                if (!annotationsTool.currentSelection || !this.isAnnotationSelectedonTimeline(annotationsTool.currentSelection)) {
                    this.timeline.unselectItem();

                    _.each(data, function (item, index) {
                        if (annotationsTool.currentSelection && annotationsTool.currentSelection.get("id") === item.id) {
                            this.timeline.selectItem(index);
                        } else if (!annotationsTool.currentSelection && (item.start <= newDate) && (item.end >= newDate)) {
                            this.timeline.selectItem(index);
                        }
                    }, this);
                } else if (annotationsTool.currentSelection) {
                    this.$el.find("div.timeline-event-selected div.timeline-event-content").one("click", this.onTimelineItemUnselected);
                }
            },
            
            /**
             * Listener for the timeline timeupdate
             *
             * @param {Event} Event object
             */
            onTimelineMoved: function (event) {
                var newTime = this.getTimeInSeconds(event.time) ,
                    hasToPlay = (this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PLAYING);

                console.log("TIMELINE: Timeline update");

                if (hasToPlay) {
                    this.playerAdapter.pause();
                }

                this.playerAdapter.setCurrentTime((newTime < 0 || newTime > this.playerAdapter.getDuration()) ? 0 : newTime);
                
                if (hasToPlay) {
                    this.playerAdapter.play();
                }
            },
            
            /**
             * Listener for item modification
             */
            onTimelineItemChanged: function () {
                var hasToPlay = (this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PLAYING),
                    values = this.getSelectedItemAndAnnotation(),
                    htmlElement,
                    index,
                    newItem,
                    oldItemId,
                    duration,
                    start,
                    annJSON,
                    newAnnotation;

                // Pause the player if needed
                this.playerAdapter.pause();

                console.log("TIMELINE: Item changed");
                
                // Return if no values related to to item
                if (!values) {
                    console.warning("Can not get infos from updated item!");
                    return;
                }

                duration    = this.getTimeInSeconds(values.item.end) - this.getTimeInSeconds(values.item.start);
                start       = this.getTimeInSeconds(values.item.start);
                htmlElement = this.$el.find(".annotation-id:contains(" + values.annotation.id + ")").parent().parent()[0];
                index       = this.timeline.getItemIndex(htmlElement);
                newItem     = this.timeline.getItem(index);

                // If the annotation is not owned by the current user or the annotation is moved outside the timeline,
                // the update is canceled
                if (!values.newTrack.get("isMine") || !values.annotation.get("isMine") ||  this.getTimeInSeconds(values.item.end) > this.playerAdapter.getDuration()) {

                    console.log("TIMELINE: cancel edition");
                    this.timeline.cancelChange();
                    
                    this.allItems[values.annotation.id] = {
                        start  : values.item.start,
                        end    : values.item.end,
                        content: values.item.content,
                        group  : this.groupTemplate(values.oldTrack.toJSON()),
                        id     : values.annotation.id,
                        trackId: values.oldTrack.id,
                        model  : values.oldTrack
                    };

                    this.filterItems();
                    this.timeline.redraw();

                    if (hasToPlay) {
                        this.playerAdapter.play();
                    }

                    return;
                }

                // If the annotations has been moved on another track
                if (values.newTrack.id !== values.oldTrack.id) {

                    this.ignoreAdd    = values.annotation.get("id");
                    this.ignoreDelete = this.ignoreAdd;

                    annJSON          = values.annotation.toJSON();
                    oldItemId        = annJSON.id;
                    annJSON.oldId    = this.ignoreAdd;
                    annJSON.start    = start;
                    annJSON.duration = duration;

                    delete annJSON.id;

                    values.annotation.destroy();
                    console.log("TIMELINE: Destroyed annotation "+oldItemId);

                    newAnnotation = values.newTrack.get("annotations").create(annJSON, {
                      wait: true,
                      success: function (ann) {
                          console.log("TIMELINE: Annotation successfully created with id "+ann.get("id"));
                      }
                    });
                    annotationsTool.currentSelection = newAnnotation;
                    annJSON.id    = newAnnotation.get("id");
                    annJSON.track = values.newTrack.id;
                    annJSON.level = this.PREFIX_STACKING_CLASS + this.getStackLevel(values.annotation);
                    console.log("TIMELINE: Created annotation "+annJSON.id);


                    if (annJSON.label && annJSON.label.category && annJSON.label.category.settings) {
                        annJSON.category = annJSON.label.category;
                    }

                    delete this.allItems[oldItemId];

                    this.allItems[annJSON.id] = {
                        start   : values.item.start,
                        end     : values.item.end,
                        content : this.itemTemplate(annJSON),
                        group   : values.item.group,
                        id      : annJSON.id,
                        trackId : values.newTrack.id,
                        isPublic: values.newTrack.get("isPublic"),
                        isMine  : values.newTrack.get("isMine"),
                        model   : values.newTrack
                    };
                    console.log("TIMELINE: New annotation "+annJSON.id+" equals "+this.allItems[annJSON.id]);

                } else {
                    values.annotation.set({start: start, duration: duration});
                    this.allItems[values.annotation.id] = values.item;
                    values.annotation.save();
                    annotationsTool.currentSelection = values.annotation;
                }


                if (this.playerAdapter.getCurrentTime() !== annotationsTool.currentSelection.get("start")) {
                    this.playerAdapter.setCurrentTime(annotationsTool.currentSelection.get("start"));
                } 

                this.filterItems();
                this.timeline.redraw();
                

                if (hasToPlay) {
                    this.playerAdapter.play();
                }
            },
            
            /**
             * Listener for timeline item deletion
             */
            onTimelineItemDeleted: function () {
                console.log("TIMELINE: Item deleted");
                var annotation = this.getSelectedItemAndAnnotation().annotation;
                this.timeline.cancelDelete();
                annotationsTool.deleteOperation.start(annotation, this.typeForDeleteAnnotation);
            },
            
            /**
             * Listener for item insertion on timeline
             */
            onTimelineItemAdded: function () {
                this.timeline.cancelAdd();
            },
            
            /**
             * Listener for timeline item selection
             */
            onTimelineItemSelected: function () {
                var item = this.getSelectedItemAndAnnotation(),
                    annotation = item.annotation;
                
                if (this.playerAdapter.getStatus() !== PlayerAdapter.STATUS.PLAYING ||
                      Math.abs(this.playerAdapter.getCurrentTime() - this.getTimeInSeconds(item.item.start)) > 1) {
                    this.playerAdapter.pause();
                    annotationsTool.currentSelection = annotation;
                    annotation.trigger("jumpto", annotation.get("start"));
                }
            },

            onTimelineItemUnselected: function (event) {
                var itemAndannotation = this.getSelectedItemAndAnnotation(),
                    annotation;

                if (itemAndannotation || itemAndannotation.annotation) {
                    return;
                } 

                $(event.target).unbind("click", this.onTimelineItemUnselected);

                if (annotationsTool.currentSelection &&
                    annotationsTool.currentSelection.get("id") === annotation.get("id") &&
                    this.isAnnotationSelectedonTimeline(annotation)) {
                    delete annotationsTool.currentSelection;
                    annotationsTool.dispatcher.trigger("unselect-annotation");
                    this.timeline.unselectItem();
                }
            },
            
            /**
             * Listener for annotation suppression
             */
            onAnnotationDestroyed: function (annotation) {
                if (this.ignoreDelete === annotation.get("id")) {
                    console.log("TIMELINE: Ignore delete from annotation "+annotation.get("id"));
                    return;
                }
                
                if (this.allItems[annotation.id]) {
                    console.log("TIMELINE: Delete annotation "+annotation.get("id"));
                    delete this.allItems[annotation.id];
                    this.filterItems();
                    this.timeline.redraw();
                }
            },
            
            /**
             * Reset the timeline zoom to see the whole timeline
             */
            onTimelineResetZoom: function () {
                this.timeline.setVisibleChartRange(this.startDate, this.endDate);
            },
            
            /**
             * Listener for track deletion
             *
             * @param {Event} event the action event
             * @param {Integer} trackId Id of the track to delete
             */
            onDeleteTrack: function (event, trackId) {
                event.stopImmediatePropagation();

                var track = this.tracks.get(trackId),
                    self = this,
                    values,
                    newTrackId,
                    callback;
                
                // If track already deleted
                if (!track) {
                    return;
                }
                
                // Destroy the track and redraw the timeline
                callback = $.proxy(function () {

                    values = _.values(this.allItems);
          
                    _.each(values, function (item) {
                        if (item.trackId === track.id) {
                            delete this.allItems[item.id];
                        }
                    }, this);
                  
                    self.tracks.remove(track);
                    
                    // If the track was selected
                    if (!annotationsTool.selectedTrack || annotationsTool.selectedTrack.id === track.id) {
                        if (self.tracks.length > 0) {  // If there is still other tracks
                            self.tracks.each(function (t) {
                                if (t.get("isMine")) {
                                    newTrackId = t.id;
                                }
                            });
                            self.onTrackSelected(null, newTrackId);
                        }
                    } else {
                        self.onTrackSelected(null, annotationsTool.selectedTrack.id);
                    }

                    if (this.allItems["track_" + track.id]) {
                        delete this.allItems["track_" + track.id];
                    }
                    
                    this.filterItems();
                    this.timeline.redraw();
                }, this);
                
                annotationsTool.deleteOperation.start(track, this.typeForDeleteTrack, callback);
            },

            /**
             * Update the track with the given id
             *
             * @param {Event} event the action event
             * @param {Integer} trackId Id of the track to delete
             */
            onUpdateTrack: function (event, trackId) {
                event.stopImmediatePropagation();

                var track = this.tracks.get(trackId),
                    trackCurrentVisibility,
                    newTrackVisibility,

                    updateListener = function (model) {
                        var newGroup,
                            trackJSON = track.toJSON();

                        trackJSON.isSupervisor = (annotationsTool.user.get("role") === ROLES.SUPERVISOR);
                        newGroup = this.groupTemplate(trackJSON);

                        _.each(this.allItems, function (item) {
                            if (item.trackId === model.id) {
                                item.group = newGroup;
                                item.isPublic = model.get("isPublic");
                            }
                        }, this);

                        this.filterItems();
                        this.timeline.redraw();
                    };

                if (!track) {
                    console.warn("Track " + trackId + " does not exist!");
                    return;
                }

                trackCurrentVisibility = track.get("access");

                if (trackCurrentVisibility === ACCESS.PRIVATE) {
                    newTrackVisibility = ACCESS.PUBLIC;
                } else {
                    newTrackVisibility = ACCESS.PRIVATE;
                }

                track.once("change", updateListener, this);
                track.set({access: newTrackVisibility});
                track.save();
            },

            onDeletePressed: function (event) {
                var values;

                if (event.keyCode !== 8 ||
                    document.activeElement.tagName.toUpperCase() === "TEXTAREA" ||
                    document.activeElement.tagName.toUpperCase() === "INPUT") {
                    return;
                } else {
                    event.preventDefault();

                    values = this.getSelectedItemAndAnnotation();
                    if (values && values.annotationId) {
                        annotationsTool.dispatcher.trigger("deleteAnnotation", values.annotationId, values.trackId);
                    }
                }
            },
            
            /**
             * Listener for track selection
             *
             * @param {Event} event the action event
             * @param {Integer} trackId Id of the selected track
             */
            onTrackSelected: function (event, trackId) {
                var track;

                if (_.isString(trackId) && !annotationsTool.localStorage) {
                    track = this.getTrack(parseInt(trackId, 10));
                } else {
                    track = this.getTrack(trackId);
                }
                
                // If the track does not exist, and it has been thrown by an event
                if ((!track && event) || (!track && trackId)) {
                    return;
                }
                
                annotationsTool.selectedTrack = track;
                this.tracks.trigger("selected_track", track);
                
                this.$el.find("div.selected").removeClass("selected");
                this.$el.find(".timeline-group .track-id:contains(" + trackId + ")").parent().parent().addClass("selected");
            },
            
            /**
             * Listener for window resizing
             */
            onWindowResize: function () {
                this.timeline.redraw();
                if (annotationsTool.selectedTrack) {
                    this.onTrackSelected(null, annotationsTool.selectedTrack.id);
                }
            },
            
            /* --------------------------------------
              Utils functions
            ----------------------------------------*/
            
            /**
             * Get the formated date for the timeline with the given seconds
             *
             * @param {Double} time in seconds
             * @returns {Date} formated date for timeline
             */
            getFormatedDate: function (seconds) {
                var newDate = new Date(seconds * 1000);
                newDate.setHours(newDate.getHours() - 1);
                return newDate;
            },
            
            /**
             * Transform the given date into a time in seconds
             *
             * @param {Date} formated date from timeline
             * @returns {Double} time in seconds
             */
            getTimeInSeconds: function (date) {
                var time = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000;
                return Number(time); // Ensue that is really a number
            },
            
            /**
             * Get the current selected annotion as object containing the timeline item and the annotation
             *
             * @param {Date}
             * @returns {Object} Object containing the annotation and the timeline item. "{item: "timeline-item", annotation: "annotation-object"}"
             */
            getSelectedItemAndAnnotation: function () {
                var itemId = $(".timeline-event-selected .annotation-id").text(),
                    selection = this.timeline.getSelection(),
                    item,
                    newTrackId,
                    oldTrackId,
                    oldTrack,
                    newTrack,
                    annotation;
                
                if (selection.length === 0) {
                    return undefined;
                }

                console.log("TIMELINE: Get selected item "+itemId);
                
                item       = this.timeline.getItem(selection[0].row);
                newTrackId = $(item.group).find(".track-id").text();
                oldTrackId = $(item.content).find(".track-id").text();
                oldTrack   = this.getTrack(oldTrackId);
                newTrack   = this.getTrack(newTrackId);
                annotation = this.getAnnotation(itemId, oldTrack);
                
                return {
                    annotation  : annotation,
                    item        : this.allItems[itemId],
                    index       : selection[0].row,
                    annotationId: itemId, 
                    trackId     : newTrackId,
                    newTrack    : newTrack,
                    oldTrack    : oldTrack
                };
            },

            isAnnotationSelectedonTimeline: function (annotation) {
                return this.$el.find("div.timeline-event-selected div.timeline-item div.annotation-id:contains(\"" + annotation.get("id") + "\")").length !== 0;
            },
            
            /**
             * Get annotation from item
             *
             * @param {Object} item related to the target annotation
             */
            getAnnotationFromItem: function (item) {
                var trackId = item.trackId,
                    annotationId = item.id,
                    track,
                    annotation;

                if (trackId && annotationId) {
                    track = this.tracks.get(trackId);
                    annotation = track.get("annotations").get(annotationId);
                    return annotation;
                } else {
                    return undefined;
                }
            },
            
            /**
             * Get the item related to the given annotation
             *
             * @param {Annotation} the annotation
             * @returns {Object} an item object extend by an index parameter
             */
            getTimelineItemFromAnnotation: function (annotation) {
                return this.allItems[annotation.id];
            },
            
            /**
             * Get the top value from the annotations to avoid overlapping
             *
             * @param {Annotation} the target annotation
             * @returns {Integer} top for the target annotation
             */
            getStackLevel: function (annotation) {
                // Target annotation values
                var tStart = annotation.get("start"),
                    tEnd   = tStart + annotation.get("duration"),
                    maxLevel, // Higher stack level
                    elLevel = 0, // stack level for the element in context
                    classesStr,
                    indexClass,

                    // Function to filter annotation
                    rangeForAnnotation = function (a) {
                        var start = a.get("start"),
                            end   = start + a.get("duration");

                        if (start === end) {
                            end += this.DEFAULT_DURATION;
                        }
                        
                        // Test if the annotation is overlapping the target annotation
                        if ((a.id !== annotation.id) && // do not take the target annotation into account
                           // Positions check
                           ((start >= tStart && start <= tEnd) ||
                              (end > tStart && end <= tEnd) ||
                              (start <= tStart && end >= tEnd)) &&
                            this.allItems[a.id] // Test if view exist
                          ) {

                            // Get the stacking level of the current item
                            classesStr = a.get("level");
                            indexClass = classesStr.search(this.PREFIX_STACKING_CLASS) + this.PREFIX_STACKING_CLASS.length;
                            elLevel = parseInt(classesStr.substr(indexClass, classesStr.length - indexClass)) || 0;
                              
                            if (typeof maxLevel === "undefined" && elLevel === 0) {
                                maxLevel = elLevel;
                            } else if (typeof maxLevel !== "undefined") {
                                maxLevel = maxLevel < elLevel ? elLevel : maxLevel;
                            }
                            return true;
                        }
                        return false;
                    };

                if (annotation.get("duration") === 0) {
                    tEnd += this.DEFAULT_DURATION;
                }
                
                if (annotation.collection) {
                    annotation.collection.filter(rangeForAnnotation, this);
                }
                
                return ((typeof maxLevel !== "undefined") ? maxLevel + 1 : 0);
            },
            
            
            /**
             * Get track with the given track id. Fallback method include if issues with the standard one.
             *
             * @param {int} trackId The id from the targeted track
             * @return {Track} a track if existing, or undefined.
             */
            getTrack: function (trackId) {
                var rTrack = this.tracks.get(trackId);
                
                if (!rTrack) {
                    // Fallback method
                    this.tracks.each(function (track) {
                        if (track.id === trackId) {
                            rTrack = track;
                        }
                    }, this);
                }
                return rTrack;
            },

            /**
             * Get annotation with the given annotation id. Fallback method include if issues with the standard one.
             *
             * @param {int} annotationId The id from the targeted annotation
             * @param {Track} track track containing the targeted annotation
             * @return {Annotation} a track if existing, or undefined.
             */
            getAnnotation: function (annotationId, track) {
                var rAnnotation = track.get("annotations").get(annotationId);
                
                if (!rAnnotation) {
                    // Fallback method
                    track.get("annotations").each(function (annotation) {
                        if (annotation.id === annotationId) {
                            rAnnotation = annotation;
                        }
                    }, this);
                }
                return rAnnotation;
            },
            
            /**
             * Reset the view
             */
            reset: function () {
                var annotations;

                this.$el.hide();
                
                // Remove all event listener
                $(this.playerAdapter).unbind("pa_timeupdate", this.onPlayerTimeUpdate);
                links.events.removeListener(this.timeline, "timechanged", this.onTimelineMoved);
                links.events.removeListener(this.timeline, "change", this.onTimelineItemChanged);
                links.events.removeListener(this.timeline, "delete", this.onTimelineItemDeleted);
                links.events.removeListener(this.timeline, "select", this.onTimelineItemSelected);
                $(window).unbind("selectTrack");
                $(window).unbind("updateTrack");
                $(window).unbind("deleteTrack");
                $(window).unbind("deleteAnnotation");
                $(window).unbind("resize", this.onWindowResize);
                  
                this.undelegateEvents();

                if (this.groupModal) {
                    this.groupModal.remove();
                }
                
                this.tracks.each(function (track) {
                    annotations = track.get("annotations");
                    annotations.unbind("add");
                }, this);
                
                // Remove all elements
                this.allItems = {};
                this.$el.find("#timeline").empty();
                this.timeline.deleteAllItems();
                this.timeline = null;
                delete this.timeline;
                this.filteredItems = [];
            }
        });
              
        return Timeline;
    }
);
