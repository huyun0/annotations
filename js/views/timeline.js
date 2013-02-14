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
        "libs/timeline",
        "tooltip",
        "popover"],
       
    function ($, PlayerAdapter, Annotation, Annotations, GroupTmpl, ItemTmpl, ModalGroupTmpl, ACCESS, ROLES, FiltersManager, Backbone, Handlebars) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-timeline
         * @alias Timeline
         */
        var Timeline = Backbone.View.extend({
          
          /** Main container of the timeline */
          el: $('div#timeline-container'),
          
          /** group template */
          groupTemplate: Handlebars.compile(GroupTmpl),
          
          /** item template */
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
          
          /** Constant for void item content */
          VOID_ITEM: "<div style='display:none'></div>",
          
          /** Default duration for annotation */
          DEFAULT_DURATION: 5,

          /**
           * Array containing all the items
           * @type {Array}
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
          initialize: function(attr){
              
            _.bindAll(this,'addTrack',
                           'addList',
                           'createTrack',
                           'onDeleteTrack',
                           'onDeleteAnnotation',
                           'onTrackSelected',
                           'onPlayerTimeUpdate',
                           'onTimelineMoved',
                           'onTimelineItemChanged',
                           'onTimelineItemDeleted',
                           'onTimelineItemSelected',
                           'onTimelineItemUnselected',
                           'isAnnotationSelectedonTimeline',
                           'onTimelineItemAdded',
                           'onAnnotationDestroyed',
                           'onDeletePressed',
                           'generateVoidItem',
                           'generateItem',
                           'changeItem',
                           'getFormatedDate',
                           'getSelectedItemAndAnnotation',
                           'getTopForStacking',
                           'getTrack',
                           'getAnnotation',
                           'onWindowResize',
                           'onTimelineResetZoom',
                           'initTrackCreation',
                           'filterItems',
                           'switchFilter',
                           'updateFiltersRender',
                           'disableFilter',
                           'redraw',
                           'reset');
            

            this.playerAdapter = attr.playerAdapter;

            this.filtersManager = new FiltersManager(annotationsTool.filtersManager);
            this.listenTo(this.filtersManager, "switch", this.updateFiltersRender);
            
            // Type use for delete operation
            this.typeForDeleteAnnotation = annotationsTool.deleteOperation.targetTypes.ANNOTATION;
            this.typeForDeleteTrack = annotationsTool.deleteOperation.targetTypes.TRACK;
            
            
            this.endDate = this.getFormatedDate(this.playerAdapter.getDuration()+2);
            this.startDate = new Date(this.endDate.getFullYear(),this.endDate.getMonth(),this.endDate.getDate(),0,0,3);
            
            this.options = {
              width:  "100%",
              height: "auto",
              style: "box",
              scale: links.Timeline.StepDate.SCALE.MILLISECOND,
              step: 1,
              showButtonAdd: false,
              editable: true,
              start: this.startDate,
              end: this.endDate,
              min: this.startDate,
              max: this.endDate,
              intervalMin: 100,
              showCustomTime: true,
              showNavigation: true,
              showMajorLabels: false,
              minHeight: "200",
              axisOnTop: true,
              groupsWidth: "150px",
              animate: true,
              animateZoom: true,
              eventMarginAxis: 0,
              eventMargin: 0,
              dragAreaWidth: 1,
              groupsChangeable: true
            };
            
            
            // Create the timeline 
            this.timeline = new links.Timeline(this.$el.find("#timeline")[0]);
            this.timeline.draw(this.filteredItems,this.options);
            this.listenTo(annotationsTool.dispatcher, "unselect-annotation", this.timeline.unselectItem);
            
            // Ensure that the timeline is redraw on window resize
            $(window).bind('resize',this.onWindowResize);
            $(window).bind('selectTrack', $.proxy(this.onTrackSelected, this));
            $(window).bind('deleteTrack', $.proxy(this.onDeleteTrack, this));
            $(window).bind('updateTrack', $.proxy(this.onUpdateTrack, this));
            $(window).bind('deleteAnnotation', $.proxy(this.onDeleteAnnotation, this));
            $(window).bind('keydown', $.proxy(this.onDeletePressed, this));
            
            $(this.playerAdapter).bind('pa_timeupdate', this.onPlayerTimeUpdate);
            links.events.addListener(this.timeline,'timechanged', this.onTimelineMoved);
            links.events.addListener(this.timeline,'timechange', this.onTimelineMoved);
            links.events.addListener(this.timeline,'change', this.onTimelineItemChanged);
            links.events.addListener(this.timeline,'delete', this.onTimelineItemDeleted);
            links.events.addListener(this.timeline,'select', this.onTimelineItemSelected);
            links.events.addListener(this.timeline,'add', this.onTimelineItemAdded);
            
            this.tracks = annotationsTool.video.get("tracks");
            this.tracks.bind('add', this.addTrack,this);
            
            this.$el.show();
            this.addList(this.tracks);
            this.timeline.setCustomTime(this.startDate);
            
            this.timeline.redraw = this.redraw;
            
            this.timeline.setAutoScale(false);
            $('div.timeline-group .content').popover({});

            this.timeline.redraw();
          },

          redraw: function() {
              var selection;
              selection = this.timeline.getSelection(selection);
              this.timeline.draw(this.filteredItems,this.option);

              if (selection.length > 0) {
                this.timeline.selectItem(selection[0].row);
              }

              $('div.timeline-group .content').popover({});

              if(annotationsTool.selectedTrack) {
                this.onTrackSelected(null,annotationsTool.selectedTrack.id);
              }
          },

          /**
           * Add an annotation to the timeline
           * @alias module:views-timeline.Timeline#addAnnoation
           * @param {module:models-annotation.Annotation} annotation the annotation to add
           * @param {module:models-track.Track} track  the track where the annotation must be added    
           */
          addAnnotation: function(annotation, track, isList) {

            if (annotation.get("oldId") && this.ignoreAdd === annotation.get("oldId")) {
              return;
            }
            
            // If annotation has not id, we save it to have an id
            if (!annotation.id) {
              annotation.bind('ready',this.addAnnotation, this);
              return;
            }

            this.allItems[annotation.id] = this.generateItem(annotation, track);

            this.filterItems();
            this.timeline.redraw();

            if (!isList) {
              annotationsTool.currentSelection = annotation;
              this.onPlayerTimeUpdate();
            }
              
            annotation.bind('destroy', this.onAnnotationDestroyed, this);
          },

          /**
           * Add a tracks to the timeline
           *
           * @param {Annotation} the annotation to add as view
           */
          addTrack: function(track) {
            var annotations,
                proxyToAddAnnotation = function(annotation) {
                  this.addAnnotation(annotation, track, false);
                };

            // If track has not id, we save it to have an id
            if(!track.id){
              track.bind('ready',this.addTrack, this);
              return;
            }
            
            // Add void item
            this.allItems['track_'+track.id] = this.generateVoidItem(track);
            this.filterItems();
            this.timeline.redraw();

            annotations = track.get("annotations"),
            annotations.each(proxyToAddAnnotation,this);
            annotations.bind('add',proxyToAddAnnotation, this);
            annotations.bind('change',this.changeItem, this);
            annotations.bind('remove',$.proxy(function(annotation){
              this.onAnnotationDestroyed(annotation, track);
            },this), this);

          },
          
          /**
           * Add a list of tracks, creating a view for each of them
           */
          addList: function(tracks) {
            tracks.each(this.addTrack, this, true);
          },
          
          /**
           * Get a void item for the given track
           *
           * @param {Track} given track owning the void item
           */
          generateVoidItem: function(track){
              var trackJSON = track.toJSON();
              trackJSON.id = track.id;
              trackJSON.isSupervisor = (annotationsTool.user.get("role") === ROLES.SUPERVISOR);
            
              return {
                model: track,
                trackId: track.id,
                isMine: track.get("isMine"),
                isPublic: track.get("isPublic"),
                start: this.startDate-5000,
                end: this.startDate-4500,
                content: this.VOID_ITEM,
                group: this.groupTemplate(trackJSON)
              };
          },


          generateItem: function (annotation, track) {
              var annotationJSON, 
                  trackJSON,
                  startTime,
                  endTime,
                  start,
                  end;

              annotationJSON = annotation.toJSON();
              annotationJSON.id = annotation.id;
              annotationJSON.track = track.id;
              annotationJSON.top = this.getTopForStacking(annotation)+"px";
              if (annotationJSON.label && annotationJSON.label.category && annotationJSON.label.category.settings) {
                annotationJSON.category = annotationJSON.label.category;
              }

              trackJSON = track.toJSON();
              trackJSON.id = track.id;
              trackJSON.isSupervisor = (annotationsTool.user.get("role") === ROLES.SUPERVISOR);

              // Calculate start/end time
              startTime = annotation.get("start");
              endTime   = startTime + annotation.get("duration");
              start = this.getFormatedDate(startTime);
              end = this.getFormatedDate(endTime);

              return {
                  model: track,
                  id: annotation.id,
                  trackId: track.id,
                  isPublic: track.get("isPublic"),
                  isMine: track.get("isMine"),
                  start: start,
                  end: end,
                  content: this.itemTemplate(annotationJSON),
                  group: this.groupTemplate(trackJSON)
              };
          },
          
          /**
           * Add a track to the timeline
           *
           * @param {Object} JSON object compose of a name and description properties. Example: {name: "New track", description: "A test track as example"}
           */
          createTrack: function(param) {

            var track;

            if (this.timeline.findGroup(param.name)) {
              // If group already exist, we do nothing
              return;
            }

            track = this.tracks.create(param,{wait:true});
            
            // If no track selected, we use the new one
            if (!annotationsTool.selectedTrack) {
              annotationsTool.selectedTrack = track;
            }
            
            this.timeline.redraw();
            this.onTrackSelected(null,annotationsTool.selectedTrack.id);
          },
          
          /**
           * Load the modal window to add a new track
           */
          initTrackCreation: function(event) {

            var self = this,
                access,
                insertTrack = function() {
                  if (self.groupModal.find('#name')[0].value === '') {
                      self.groupModal.find('.alert #content').html("Name is required!");
                      self.groupModal.find('.alert').show();
                      return;
                  }

                  if (self.groupModal.find('#public').length > 0) {
                    access = self.groupModal.find('#public')[0].checked ? ACCESS.PUBLIC : ACCESS.PRIVATE;
                  } else {
                    access = ACCESS.PUBLIC;
                  }

                  self.createTrack({
                      name: _.escape(self.groupModal.find('#name')[0].value),
                      description: _.escape(self.groupModal.find('#description')[0].value),
                      access: access
                  },this);
                    
                  self.groupModal.modal("toggle");
                };
            
            // If the modal is already loaded and displayed, we do nothing
            if ($('div#modal-add-group.modal.in').length > 0) { 
              return;
            }
            else if (!this.groupModal) {
                // Otherwise we load the login modal if not loaded
                $("body").append(this.modalGroupTemplate({isSupervisor: annotationsTool.user.get('role') === ROLES.SUPERVISOR}));
                this.groupModal = $('#modal-add-group');
                this.groupModal.modal({show: true, backdrop: false, keyboard: true });                
                this.groupModal.find('a#add-group').bind("click",insertTrack);
                this.groupModal.bind("keypress",function(event){
                  if(event.keyCode === 13){
                    insertTrack();  
                  }
                });
                
                this.groupModal.on("shown",$.proxy(function(){
                  this.groupModal.find('#name').focus();
                },this));
                
                this.groupModal.find('#name').focus();
            }
            else{
              // if the modal has already been initialized, we reset input and show modal
              this.groupModal.find('.alert #content').html("");
              this.groupModal.find('.alert').hide();
              this.groupModal.find('#name')[0].value = '';
              this.groupModal.find('#description')[0].value = '';
              this.groupModal.modal("toggle");
            }
          },

          /**
           * Go through the list of items with the current active filter and save it in the filtered items array.
           * @alias module:views-timeline.Timeline#filterItems
           * @return {Array} The list of filtered items
           */
          filterItems: function() {
            var tempList = _.values(this.allItems);

            _.each(this.filtersManager.getFilters(),function(filter) {
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
          switchFilter: function(event) {
            var active = !$(event.target).hasClass('checked'),
                id = event.target.id.replace("filter-","");

            this.filtersManager.switchFilter(id, active);
          },

          updateFiltersRender: function(attr) {
            if (attr.active) {
                this.$el.find("#filter-"+attr.id).addClass("checked");
            } else {
                this.$el.find("#filter-"+attr.id).removeClass("checked");
            }

            this.filterItems();
            this.timeline.redraw();
          },

          /**
           * Disable all the list filter
           * @alias module:views-list.List#disableFilter
           */
          disableFilter: function(){
            this.$el.find('.filter').removeClass('checked');

            this.filtersManager.disableFilters();

            this.filterItems();
            this.timeline.redraw();
          },
          
          /**
           * Check the position for the changed item
           *
           * @param {Annotation} the annotation that has been changed
           */
          changeItem: function(annotation){
            var value = this.getTimelineItemFromAnnotation(annotation);
            this.allItems[annotation.id] = this.generateItem(annotation, value.model);
            this.filterItems();
            this.timeline.redraw();
            this.$el.find('.annotation-id:contains('+annotation.id+')').parent().css('margin-top',this.getTopForStacking(annotation)+"px");            
          },
          
          /**
           * Listener for the player timeupdate 
           */
          onPlayerTimeUpdate: function(){
            var newDate = this.getFormatedDate(this.playerAdapter.getCurrentTime()),
                data;

            this.timeline.setCustomTime(newDate);
            
            // Select the good items
            data = this.timeline.getData();
            
            if (!annotationsTool.currentSelection || !this.isAnnotationSelectedonTimeline(annotationsTool.currentSelection)) {
              this.timeline.unselectItem();    

              _.each(data,function(item,index) {
                  if (annotationsTool.currentSelection && annotationsTool.currentSelection.get("id") === item.id) {
                      this.timeline.selectItem(index);
                  } else if (!annotationsTool.currentSelection && (item.start <= newDate) && (item.end >= newDate)) {
                      this.timeline.selectItem(index);
                  }
              },this);     
            } else if (annotationsTool.currentSelection) {
                this.$el.find('div.timeline-event-selected div.timeline-event-content').one("click", this.onTimelineItemUnselected);
            }

          },
          
          /**
           * Listener for the timeline timeupdate
           *
           * @param {Event} Event object
           */
          onTimelineMoved: function(event){
            var newTime = this.getTimeInSeconds(event.time),
                hasToPlay = (this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PLAYING);

            this.filterItems();
            this.timeline.redraw();

            this.playerAdapter.pause();
            this.playerAdapter.setCurrentTime(newTime);
            
            if (hasToPlay) {
              this.playerAdapter.play();
            }
          },
          
          /**
           * Listener for item modification
           */
          onTimelineItemChanged: function(){
            // Pause the player if needed
            var hasToPlay = (this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PLAYING),
                values = this.getSelectedItemAndAnnotation(),
                options = {},
                htmlElement,
                index,
                newItem,
                oldItemId,
                duration,
                start,
                annJSON,
                newAnnotation;

            this.playerAdapter.pause();
            
            if (!values) {
              return;
            }

            duration = this.getTimeInSeconds(values.item.end)-this.getTimeInSeconds(values.item.start);
            start = this.getTimeInSeconds(values.item.start);

            htmlElement = this.$el.find('.annotation-id:contains('+values.annotation.id+')').parent().parent()[0];
            index = this.timeline.getItemIndex(htmlElement);
            newItem = this.timeline.getItem(index);

            if (!values.newTrack.get("isMine") || !values.annotation.get("isMine")) { 

                this.timeline.cancelChange();
                
                this.allItems[values.annotation.id] = {
                  start: values.item.start,
                  end: values.item.end,
                  content: values.item.content,
                  group: this.groupTemplate(values.oldTrack.toJSON()),
                  id: values.annotation.id,
                  trackId: values.oldTrack.id,
                  model: values.oldTrack
                };


                if (this.hasToPlay) {
                  this.playerAdapter.play();
                }

                this.filterItems();
                this.timeline.redraw();

                return;
            }

              

            // If the annotations has been moved on another track
            if (values.newTrack.id !== values.oldTrack.id) {

              this.ignoreAdd = values.annotation.get("id");
              this.ignoreDelete = this.ignoreAdd;

              annJSON = values.annotation.toJSON();
              oldItemId = annJSON.id;
              annJSON.oldId = this.ignoreAdd;
              annJSON.start = start;
              annJSON.duration = duration;

              delete annJSON.id;

              values.annotation.destroy();
              newAnnotation = values.newTrack.get('annotations').create(annJSON,{wait:true});

              annJSON.id = newAnnotation.get('id');
              annJSON.track = values.newTrack.id;
              annJSON.top = this.getTopForStacking(values.annotation)+"px";

              if (annJSON.label && annJSON.label.category && annJSON.label.category.settings) {
                annJSON.category = annJSON.label.category;
              }

              delete this.allItems[oldItemId];

              this.allItems[annJSON.id] = {
                start: values.item.start,
                end: values.item.end,
                content: this.itemTemplate(annJSON),
                group: values.item.group,
                id: annJSON.id,
                trackId: values.newTrack.id,
                isPublic: values.newTrack.get("isPublic"),
                isMine: values.newTrack.get("isMine"),
                model: values.newTrack
              };

            } else {
                values.annotation.set({start: start, duration: duration});
                this.allItems[values.annotation.id] = values.item;
                values.annotation.save();
            }

            this.filterItems();
            this.timeline.redraw();
            if (this.hasToPlay) {
              this.playerAdapter.play();
            }
          },
          
          /**
           * Listener for timeline item deletion
           */
          onTimelineItemDeleted: function(){
            var annotation = this.getSelectedItemAndAnnotation().annotation;
            this.timeline.cancelDelete();
            annotationsTool.deleteOperation.start(annotation,this.typeForDeleteAnnotation);
          },
          
          /**
           * Listener for item insertion on timeline
           */
          onTimelineItemAdded: function(){
            this.timeline.cancelAdd();
          },
          
          /**
           * Listener for timeline item selection
           */          
          onTimelineItemSelected: function(event){
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
            var annotation = this.getSelectedItemAndAnnotation().annotation;

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
          onAnnotationDestroyed: function(annotation, track){

            if (this.ignoreDelete === annotation.get("id")) {
                return;
            }
            
            if (this.allItems[annotation.id]) {
              delete this.allItems[annotation.id];
              this.filterItems();
              this.timeline.redraw();
            }
          },
          
          /**
           * Reset the timeline zoom to see the whole timeline
           */
          onTimelineResetZoom: function(){
            this.timeline.setVisibleChartRange(this.startDate, this.endDate);
          },
          
          /**
           * Listener for track deletion
           *
           * @param {Event} event the action event
           * @param {Integer} trackId Id of the track to delete
           */
          onDeleteTrack: function(event,trackId){

            event.stopImmediatePropagation();

            var track = this.tracks.get(trackId),
                self = this,
                items,
                values,
                newTrackId,
                callback;
            
            // If track already deleted
            if (!track) {
              return;
            } 
            
            // Destroy the track and redraw the timeline
            callback = $.proxy(function(){

                values = _.values(this.allItems);
      
                _.each(values, function(item, index){
                  if (item.trackId === track.id) {
                    delete this.allItems[item.id];
                  }
                },this);
              
                self.tracks.remove(track);
                
                // If the track was selected
                if (!annotationsTool.selectedTrack || annotationsTool.selectedTrack.id === track.id) {
                  if (self.tracks.length > 0) {  // If there is still other tracks
                    self.tracks.each(function (t) {
                      if (t.get("isMine")) {
                        newTrackId = t.id;
                      }
                    });
                    self.onTrackSelected(null,newTrackId);
                  }
                } else {
                  self.onTrackSelected(null,annotationsTool.selectedTrack.id);
                }

                if (this.allItems['track_'+track.id]) {
                  delete this.allItems['track_'+track.id];
                }
                
                this.filterItems();  
                this.timeline.redraw();
            },this);
            
            annotationsTool.deleteOperation.start(track,this.typeForDeleteTrack,callback);
          },

          /**
           * Update the track with the given id
           * 
           * @param {Event} event the action event
           * @param {Integer} trackId Id of the track to delete
           */
          onUpdateTrack: function(event,trackId){

            event.stopImmediatePropagation();

            var track = this.tracks.get(trackId),
                currentTrackJSON,
                currentGroup,
                newTrackJSON,
                trackCurrentVisibility,
                newTrackVisibility,

                updateListener = function(model) {
                  var item,
                      newGroup,
                      trackJSON = track.toJSON();

                  trackJSON.isSupervisor = (annotationsTool.user.get("role") === ROLES.SUPERVISOR);

                  newGroup = this.groupTemplate(trackJSON);

                  _.each(this.allItems, function(item,index){
                    if (item.trackId === model.id) {
                      item.group = newGroup;
                      item.isPublic = model.get('isPublic');
                    }
                  },this);

                  this.filterItems();
                  this.timeline.redraw();
                };

            if (!track) {
              console.warn("Track "+trackId+" does not exist!");
              return;
            }

            trackCurrentVisibility = track.get('access');

            if (trackCurrentVisibility === ACCESS.PRIVATE) {
              newTrackVisibility = ACCESS.PUBLIC;
            } else {
              newTrackVisibility = ACCESS.PRIVATE;
            }

            track.once("change", updateListener,this);
            track.set({access:newTrackVisibility});
            track.save();
          },
          
          /**
           * Delete the annotation related to the event target element
           * @param {Event} event The event triggered
           * @param {Long} anntationId The id from the annotation to delete
           * @param {Long} trackId The track containing the annotation to delete
           */
          onDeleteAnnotation: function(event,annotationId,trackId){
              
              var track = this.getTrack(trackId),
                  annotation = this.getAnnotation(annotationId,track);
              
              if (annotation) {
                annotationsTool.deleteOperation.start(annotation,this.typeForDeleteAnnotation);
              }
           },

           onDeletePressed: function(event){

            if (event.keyCode !== 8 || 
                document.activeElement.tagName.toUpperCase() === "TEXTAREA" ||
                document.activeElement.tagName.toUpperCase() === "INPUT") {
              return;
            } else {
              event.preventDefault();

              var annotationObject = this.getSelectedItemAndAnnotation();
              if (annotationObject && annotationObject.annotation) {
                annotationsTool.deleteOperation.start(annotationObject.annotation,this.typeForDeleteAnnotation);
              }
            }
           },
          
          /**
           * Listener for track selection
           *
           * @param {Event} event the action event
           * @param {Integer} trackId Id of the selected track
           */
          onTrackSelected: function(event,trackId){
            var track;

            if (_.isString(trackId) && !annotationsTool.localStorage) {
              track = this.getTrack(parseInt(trackId,10));
            } else {
              track = this.getTrack(trackId);
            }
            
            // If the track does not exist, and it has been thrown by an event
            if ((!track && event) || (!track && trackId)) {
              return;
            }
            
            annotationsTool.selectedTrack = track;
            this.tracks.trigger('selected_track',track);
            
            this.$el.find('div.selected').removeClass('selected');
            this.$el.find('.timeline-group .track-id:contains('+trackId+')').parent().parent().addClass('selected');
          },
          
          /**
           * Listener for window resizing
           */
          onWindowResize: function() {
            this.timeline.redraw();
            if ( annotationsTool.selectedTrack) {
              this.onTrackSelected(null,annotationsTool.selectedTrack.id);
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
          getFormatedDate: function(seconds) {
            var newDate = new Date(seconds*1000);
            newDate.setHours(newDate.getHours()-1);
            return newDate;
          },
          
          /**
           * Transform the given date into a time in seconds
           *
           * @param {Date} formated date from timeline
           * @returns {Double} time in seconds
           */
          getTimeInSeconds: function(date) {
            var time = date.getHours()*3600+date.getMinutes()*60+date.getSeconds()+date.getMilliseconds()/1000;
            return Number(time); // Ensue that is really a number
          },
          
          /**
           * Get the current selected annotion as object containing the timeline item and the annotation
           *
           * @param {Date}
           * @returns {Object} Object containing the annotation and the timeline item. "{item: 'timeline-item', annotation: 'annotation-object'}"
           */
          getSelectedItemAndAnnotation: function() {
            var itemId = $('.timeline-event-selected .annotation-id').text(),
                selection = this.timeline.getSelection(),
                item,
                newTrackId,
                oldTrackId,
                oldTrack,
                newTrack,
                annotation;
            
            if(selection.length === 0) {
              return undefined;
            }
            
            item = this.timeline.getItem(selection[0].row);
            newTrackId = $(item.group).find('.track-id').text();
            oldTrackId = $(item.content).find('.track-id').text();
            oldTrack = this.getTrack(oldTrackId);
            newTrack = this.getTrack(newTrackId);
            annotation = this.getAnnotation(itemId,oldTrack);
            
            return {
                    annotation: annotation,
                    item: this.allItems[itemId],
                    index: selection[0].row,
                    newTrack: newTrack,
                    oldTrack: oldTrack
            };
          },

          isAnnotationSelectedonTimeline: function (annotation) {
            return this.$el.find("div.timeline-event-selected div.timeline-item div.annotation-id:contains('"+annotation.get("id")+"')").length !== 0;
          },
          
          /**
           * Get annotation from item
           *
           * @param {Object} item related to the target annotation
           */
          getAnnotationFromItem: function(item){
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
          getTimelineItemFromAnnotation: function(annotation){
            return this.allItems[annotation.id];
          },
          
          /**
           * Get the top value from the annotations to avoid overlapping
           * 
           * @param {Annotation} the target annotation
           * @returns {Integer} top for the target annotation
           */
          getTopForStacking: function(annotation){
            
            // Target annotation values
            var tStart = annotation.get('start'),
                tEnd   = tStart + annotation.get('duration'),
                maxTop,
                elTop, 
                // Function to filer annotation
                rangeForAnnotation = function(a) {

                  var start = a.get('start'),
                      end   = start + a.get('duration'),
                      el,
                      elTop;

                  if (start === end) {
                    end += this.DEFAULT_DURATION;
                  }
                  
                  // Test if the annotation is overlapping the target annotation
                  if ((a.id !== annotation.id) && // do not take the target annotation into account
                     // Positions check 
                     ( (start >= tStart && start <= tEnd) ||
                        (end > tStart && end <= tEnd) ||
                        (start <= tStart && end >= tEnd) ) &&
                      ((el = this.$el.find('.annotation-id:contains('+a.id+')')).length > 0) // Test if view exist
                    ) {
                    // Calculing max top from all annotations
                    elTop = parseInt(el.parent().css('margin-top'),10);
                        
                    if( maxTop === undefined && elTop === 0) {
                      maxTop = elTop;
                    } else if (maxTop !== undefined) {
                      maxTop = maxTop > elTop ? elTop : maxTop;
                    }
                    return true;
                  }
                  
                  return false;
                };

            if (annotation.get('duration') === 0) {
              tEnd += this.DEFAULT_DURATION;
            }
            
            if (annotation.collection) {
              annotation.collection.filter(rangeForAnnotation,this);
            }
            
            if (maxTop === undefined) {
              return 0;
            } else {
              return maxTop-10;
            }
          },
          
          
          /**
           * Get track with the given track id. Fallback method include if issues with the standard one. 
           * 
           * @param {int} trackId The id from the targeted track
           * @return {Track} a track if existing, or undefined.
           */
          getTrack: function(trackId){
            var rTrack = this.tracks.get(trackId);
            
            if (!rTrack) {
              // Fallback method
              this.tracks.each(function(track){
                  if (track.id === trackId) {
                    rTrack = track;
                  }
              },this);
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
          getAnnotation: function(annotationId,track){
            var rAnnotation = track.get("annotations").get(annotationId);
            
            if (!rAnnotation) {
              // Fallback method
              track.get("annotations").each(function(annotation){
                  if(annotation.id === annotationId){
                    rAnnotation = annotation;
                  }
              },this);
            } 
            
            return rAnnotation;
          },
          
          /**
           * Reset the view
           */
          reset: function(){
            
            this.$el.hide();
            
            // Remove all event listener
            $(this.playerAdapter).unbind('pa_timeupdate',this.onPlayerTimeUpdate);
            links.events.removeListener(this.timeline,'timechanged',this.onTimelineMoved);
            links.events.removeListener(this.timeline,'change',this.onTimelineItemChanged);
            links.events.removeListener(this.timeline,'delete',this.onTimelineItemDeleted);
            links.events.removeListener(this.timeline,'select',this.onTimelineItemSelected);
            $(window).unbind('selectTrack');
            $(window).unbind('updateTrack');
            $(window).unbind('deleteTrack');
            $(window).unbind('deleteAnnotation');
            $(window).unbind('resize',this.onWindowResize);
              
            this.undelegateEvents();

            if (this.groupModal) {
              this.groupModal.remove();
            }
            
            this.tracks.each(function(track,item){
              var annotations = track.get("annotations");
              annotations.unbind('add'); 
    
            },this);
            
            // Remove all elements
            this.allItems = {};
            this.$el.find('#timeline').empty();
            this.timeline.deleteAllItems();
            this.timeline = null;
            delete this.timeline;
            this.filteredItems = [];
          }
          
        });
            
            
        return Timeline;
});
