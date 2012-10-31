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

define(["jquery",
        "underscore",
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "text!templates/timeline-group.tmpl",
        "text!templates/timeline-item.tmpl",
        "text!templates/timeline-modal-group.tmpl",
        "libs/handlebars",
        "libs/timeline",
        "libs/bootstrap/tooltip",
        "libs/bootstrap/popover",
        "backbone"],
       
    function($,_not,PlayerAdapter,Annotation,Annotations,GroupTmpl,ItemTmpl,ModalGroupTmpl){

        /**
         * Timeline view
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
            "click #add-track"            : "loadAddTrackModal",
            "click #reset-zoom"           : "onTimelineResetZoom"
          },
          
          /** Constant for void item content */
          VOID_ITEM: "<div style='display:none'></div>",
          
          /** Default duration for annotation */
          DEFAULT_DURATION: 5,
          
          /**
           * @constructor
           */
          initialize: function(attr){
            
            this.data = [];
              
            _.bindAll(this,'addOne',
                           'addList',
                           'addTrack',
                           'onDeleteTrack',
                           'onDeleteAnnotation',
                           'onTrackSelected',
                           'onPlayerTimeUpdate',
                           'onTimelineMoved',
                           'onTimelineItemChanged',
                           'onTimelineItemDeleted',
                           'onTimelineItemSelected',
                           'onTimelineItemAdded',
                           'onAnnotationDestroyed',
                           'onDeletePressed',
                           'getVoidItem',
                           'changeItem',
                           'getFormatedDate',
                           'getSelectedItemAndAnnotation',
                           'getTopForStacking',
                           'getTrackTempFix',
                           'getAnnotationTempFix',
                           'onWindowResize',
                           'onTimelineResetZoom',
                           'reset');
            

            this.playerAdapter = attr.playerAdapter;
            
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
              step: 5,
              showButtonAdd: false,
              editable: true,
              start: this.startDate,
              end: this.endDate,
              min: this.startDate,
              max: this.endDate,
              intervalMin: 5000,
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
              dragAreaWidth: 5,
              groupsChangeable: true
            };
            
            
            // Create the timeline 
            this.timeline = new links.Timeline(this.$el.find("#timeline")[0]);
            this.timeline.draw(this.data,this.options);
            
            // Ensure that the timeline is redraw on window resize
            $(window).bind('resize',this.onWindowResize);
            $(window).bind('selectTrack', $.proxy(this.onTrackSelected,this));
            $(window).bind('deleteTrack', $.proxy(this.onDeleteTrack,this));
            $(window).bind('deleteAnnotation',$.proxy(this.onDeleteAnnotation,this));
            $(window).bind('keydown',$.proxy(this.onDeletePressed,this));
            
            $(this.playerAdapter).bind('pa_timeupdate',this.onPlayerTimeUpdate);
            links.events.addListener(this.timeline,'timechanged',this.onTimelineMoved);
            links.events.addListener(this.timeline,'timechange',this.onTimelineMoved);
            links.events.addListener(this.timeline,'change',this.onTimelineItemChanged);
            links.events.addListener(this.timeline,'delete',this.onTimelineItemDeleted);
            links.events.addListener(this.timeline,'select',this.onTimelineItemSelected);
            links.events.addListener(this.timeline,'add',this.onTimelineItemAdded);
            
            this.tracks = annotationsTool.video.get("tracks");
            this.tracks.bind('add',this.addOne,this);
            
            this.$el.show();
            this.addList(this.tracks);
            this.timeline.setCustomTime(this.startDate);
            this.onTrackSelected(null,annotationsTool.selectedTrack.id);
            
            this.timeline.redraw = $.proxy(function(){
              if(annotationsTool.selectedTrack)
                this.onTrackSelected(null,annotationsTool.selectedTrack.id);
              
              $('div.timeline-group .content').popover({});

              this.timeline.__proto__.redraw.call(this.timeline);
            },this);
            
            this.timeline.setAutoScale(false);
            $('div.timeline-group .content').popover({});
          },

          /**
           * Add a tracks to the timeline
           *
           * @param {Annotation} the annotation to add as view
           */
          addOne: function(track){
            
            // If track has not id, we save it to have an id
            if(!track.id){
              track.bind('ready',this.addOne, this);
              return;
            }
            
            // Add void item
            this.timeline.addItem(this.getVoidItem(track));
            
            var annotations = track.get("annotations");
            
            /// Function to add one annotation in the timeline
            var addOneAnnotation = function(annotation){

              if(annotation.get("oldId") && this.ignoreAdd == annotation.get("oldId"))
                return;
              
              // If annotation has not id, we save it to have an id
              if(!annotation.id){
                annotation.bind('ready',addOneAnnotation, this);
                return;
              }
                
              var annJSON = annotation.toJSON();
              annJSON.id = annotation.id;
              annJSON.track = track.id;
              annJSON.top = this.getTopForStacking(annotation)+"px";
              if(annJSON.label && annJSON.label.category && annJSON.label.category.settings)
                annJSON.category = annJSON.label.category;

              var trackJSON = track.toJSON();
              trackJSON.id = track.id;

              // Calculate start/end time
              var startTime = annotation.get("start");
              var endTime   = startTime + annotation.get("duration");
              var start = this.getFormatedDate(startTime);
              var end = this.getFormatedDate(endTime);
              
              this.timeline.addItem({
                  start: start,
                  end: end,
                  content: this.itemTemplate(annJSON),
                  group: this.groupTemplate(trackJSON)
              });
                
              annotation.bind('destroy',this.onAnnotationDestroyed,this);
                
              annotation.bind('selected',function(){
                  var itemId = this.getTimelineItemFromAnnotation(annotation).index;
                  this.timeline.selectItem(itemId);
              },this);
            }
            
            annotations.each(addOneAnnotation,this);
            annotations.bind('add',addOneAnnotation, this);
            annotations.bind('change',this.changeItem, this);
            annotations.bind('remove',$.proxy(function(annotation){
                this.onAnnotationDestroyed(annotation, track);
            },this), this);
          },
          
          /**
           * Add a list of tracks, creating a view for each of them
           */
          addList: function(tracks){
            tracks.each(this.addOne,this);
          },
          
          /**
           * Get a void item for the given track
           *
           * @param {Track} given track owning the void item
           */
          getVoidItem: function(track){
              var trackJSON = track.toJSON();
              trackJSON.id = track.id;
            
              return {
                start: this.startDate-5000,
                end: this.startDate-4500,
                content: this.VOID_ITEM,
                group: this.groupTemplate(trackJSON)
              }
          },
          
          /**
           * Add a track to the timeline
           *
           * @param {Object} JSON object compose of a name and description properties. Example: {name: "New track", description: "A test track as example"}
           */
          addTrack: function(param){
            // If group already exist, we do nothing
            if(this.timeline.findGroup(param.name))
              return;
            

            if(annotationsTool.localStorage)
              var track = this.tracks.create(param);
            else
              var track = this.tracks.create(param,{wait:true});
            
            
            // If no track selected, we use the new one
            if(!annotationsTool.selectedTrack)
              annotationsTool.selectedTrack = track;
            
            
            this.timeline.redraw();
            this.onTrackSelected(null,annotationsTool.selectedTrack.id);
          },
          
          /**
           * Load the modal window to add a new track
           */
          loadAddTrackModal: function(event){
            
            // If the modal is already loaded and displayed, we do nothing
            if($('div#modal-add-group.modal.in').length > 0){
              return;
            }
            else if(!this.groupModal){
                // Otherwise we load the login modal if not loaded
                this.$el.append(this.modalGroupTemplate);
                this.groupModal = $('#modal-add-group');
                this.groupModal.modal({show: true, backdrop: false, keyboard: true });
                var self = this;
                var insertTrack = function(){
                  if(self.groupModal.find('#name')[0].value == ''){
                      self.groupModal.find('.alert #content').html("Name is required!");
                      self.groupModal.find('.alert').show();
                      return;
                    }
                    
                    self.addTrack({
                      name: _.escape(self.groupModal.find('#name')[0].value),
                      description: _.escape(self.groupModal.find('#description')[0].value)
                    },this)
                    
                    self.groupModal.modal("toggle");
                };
                
                this.groupModal.find('a#add-group').bind("click",insertTrack);
                this.groupModal.bind("keypress",function(event){
                  if(event.keyCode == 13){
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
           * Check the position for the changed item
           *
           * @param {Annotation} the annotation that has been changed
           */
          changeItem: function(annotation){
            var value = this.getTimelineItemFromAnnotation(annotation);
            this.$el.find('.annotation-id:contains('+annotation.id+')').parent().css('margin-top',this.getTopForStacking(annotation)+"px");            
          },
          
            
          
          /**
           * Listener for the player timeupdate 
           */
          onPlayerTimeUpdate: function(){
            var newDate = this.getFormatedDate(this.playerAdapter.getCurrentTime());
            this.timeline.setCustomTime(newDate);
            
            
            // Select the good items
            var data = this.timeline.getData();
            var selection = new Array();
            
            
            this.timeline.unselectItem();            
            _.each(data,function(item,index){
              if((item.start <= newDate) && (item.end >= newDate)){
                this.timeline.selectItem(index);
              }
            },this);
            
          },
          
          /**
           * Listener for the timeline timeupdate
           *
           * @param {Event} Event object
           */
          onTimelineMoved: function(event){
            this.hasToPlay = (this.playerAdapter.getStatus() == PlayerAdapter.STATUS.PLAYING);
            this.playerAdapter.pause();
            
            var newTime = this.getTimeInSeconds(event.time);
            this.playerAdapter.setCurrentTime(newTime);
            
            if(this.hasToPlay)
              this.playerAdapter.play();
          },
          
          /**
           * Listener for item modification
           */
          onTimelineItemChanged: function(){
            // Pause the player if needed
            var hasToPlay = (this.playerAdapter.getStatus() == PlayerAdapter.STATUS.PLAYING);
            this.playerAdapter.pause();
            
            var values = this.getSelectedItemAndAnnotation();
            
            if(!values)
              return;

            var htmlElement = this.$el.find('.annotation-id:contains('+values.annotation.id+')').parent().parent()[0];
            var index = this.timeline.getItemIndex(htmlElement);
            var newItem = this.timeline.getItem(index);
              
            values.annotation.set({start: this.getTimeInSeconds(values.item.start),
                                   duration: this.getTimeInSeconds(values.item.end)-this.getTimeInSeconds(values.item.start)});

            // If the annotations has been moved on another track
            if(values.newTrack.id != values.oldTrack.id){

              this.ignoreAdd = values.annotation.get("id");
              this.ignoreDelete = this.ignoreAdd;

              var annJSON = values.annotation.toJSON();
              delete annJSON.id;
              annJSON.oldId = this.ignoreAdd;

              var options = {}
              if(!annotationsTool.localStorage)
                options.wait = true;

              values.annotation.destroy();
              var newAnnotation = values.newTrack.get('annotations').create(annJSON,options);

              annJSON.id = newAnnotation.get('id');
              annJSON.track = values.newTrack.id;
              annJSON.top = this.getTopForStacking(values.annotation)+"px";
              if(annJSON.label && annJSON.label.category && annJSON.label.category.settings)
                annJSON.category = annJSON.label.category;

              this.timeline.changeItem(index, {
                  start: newItem.start,
                  end: newItem.end,
                  content: this.itemTemplate(annJSON),
                  group: newItem.group
              });
            }

            values.annotation.save();

            this.timeline.redraw();
            if(this.hasToPlay)
              this.playerAdapter.play();
          },
          
          /**
           * Listener for timeline item deletion
           */
          onTimelineItemDeleted: function(){
            var annotation = this.getSelectedItemAndAnnotation().annotation;
            
            console.warn('item deleted');
            
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
          onTimelineItemSelected: function(){
            this.playerAdapter.pause();
            var annotation = this.getSelectedItemAndAnnotation().annotation;
            annotation.trigger("selected_timeline",annotation);
          },
          
          /**
           * Listener for annotation suppression 
           */
          onAnnotationDestroyed: function(annotation, track){

            if(this.ignoreDelete == annotation.get("id"))
                return;

            var value = this.getTimelineItemFromAnnotation(annotation, track);
            
            if(value){
              this.timeline.deleteItem(value.index);
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

            var track = this.tracks.get(trackId);
            
            // If track already deleted
            if(!track)
              return;
            
            // Destroy the track and redraw the timeline
            var self = this;
            var callback = $.proxy(function(){
                var items = self.timeline.getData().slice();
                var newItems = new Array();
      
                _.each(items, function(item, index){
                  if($(item.group).find('.track-id').text() != track.id)
                    newItems.push(item);
                },this);
              
                self.timeline.draw(newItems, self.options);
                self.tracks.remove(track);
                annotationsTool.video.save();
                
                // If the track was selected
                if(!annotationsTool.selectedTrack || annotationsTool.selectedTrack.id == track.id){
                  
                  if(self.tracks.length > 0)  // If there is still other tracks
                    self.onTrackSelected(null,self.tracks.at(0).id);
                  else // if no more tracks
                    self.onTrackSelected(null,undefined);
                }
                else
                  self.onTrackSelected(null,annotationsTool.selectedTrack.id);
                  
                this.timeline.redraw();
            },this);
            
            annotationsTool.deleteOperation.start(track,this.typeForDeleteTrack,callback);
          },
          
          /**
           * Delete the annotation related to the event target element
           * @param {Event} event The event triggered
           * @param {Long} anntationId The id from the annotation to delete
           * @param {Long} trackId The track containing the annotation to delete
           */
          onDeleteAnnotation: function(event,annotationId,trackId){
              
              var track = this.getTrackTempFix(trackId);
              var annotation = this.getAnnotationTempFix(annotationId,track);
              
              if(annotation)
                annotationsTool.deleteOperation.start(annotation,this.typeForDeleteAnnotation);
           },


           onDeletePressed: function(event){
            if(event.keyCode != 8 || 
              document.activeElement.tagName.toUpperCase() == "TEXTAREA" ||
              document.activeElement.tagName.toUpperCase() == "INPUT")
              return;

            event.preventDefault();

            var annotationObject = this.getSelectedItemAndAnnotation();
            if(annotationObject && annotationObject.annotation)
              annotationsTool.deleteOperation.start(annotationObject.annotation,this.typeForDeleteAnnotation);
           },
          
          /**
           * Listener for track selection
           *
           * @param {Event} event the action event
           * @param {Integer} trackId Id of the selected track
           */
          onTrackSelected: function(event,trackId){
            var track = this.getTrackTempFix(trackId);
            
            // If the track does not exist, and it has been thrown by an event
            if((!track && event) || (!track && trackId))
              return;
            
            annotationsTool.selectedTrack = track;
            this.tracks.trigger('selected_track',track);
            
            this.$el.find('div.selected').removeClass('selected');
            this.$el.find('.timeline-group .track-id:contains('+trackId+')').parent().parent().addClass('selected');
          },
          
          /**
           * Listener for window resizing
           */
          onWindowResize: function(){
            this.timeline.redraw();
            if(annotationsTool.selectedTrack)
              this.onTrackSelected(null,annotationsTool.selectedTrack.id);
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
          getFormatedDate: function(seconds){
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
          getTimeInSeconds: function(date){
            var time = date.getHours()*3600+date.getMinutes()*60+date.getSeconds()+date.getMilliseconds()/1000;
            return Number(time); // Ensue that is really a number
          },
          
          /**
           * Get the current selected annotion as object containing the timeline item and the annotation
           *
           * @param {Date}
           * @returns {Object} Object containing the annotation and the timeline item. "{item: 'timeline-item', annotation: 'annotation-object'}"
           */
          getSelectedItemAndAnnotation: function(){
            var itemId = $('.timeline-event-selected .annotation-id').text();
            var selection = this.timeline.getSelection();
            
            if(selection.length == 0)
              return undefined;
            
            var item = this.timeline.getItem(selection[0].row);
            var newTrackId = $(item.group).find('.track-id').text();
            var oldTrackId = $(item.content).find('.track-id').text();
            var oldTrack = this.getTrackTempFix(oldTrackId);
            var newTrack = this.getTrackTempFix(newTrackId);
            var annotation = this.getAnnotationTempFix(itemId,oldTrack);
            
            return {
                    annotation: annotation,
                    item: item,
                    index: selection[0].row,
                    newTrack: newTrack,
                    oldTrack: oldTrack
            };
          },
          
          
          getTimelineItemFromAnnotationId: function(annotationId){
            var baseHtmlElement = this.$el.find('.annotation-id:contains('+annotationId+')');
            
            // If the element exist
            if(baseHtmlElement.length > 0){
              var htmlElement = baseHtmlElement.parent().parent()[0];
              var index = this.timeline.getItemIndex(htmlElement);
            
              if(index){
                var item = this.timeline.getItem(index);
                return _.extend(item,{index:index});
              }
            }
              
            return undefined;
          },
          
          /**
           * Get annotation from item
           *
           * @param {Object} item related to the target annotation
           */
          getAnnotationFromItem: function(item){
            var trackId = $(item.content).find('.track-id').text();
            var annotationId = $(item.content).find('.annotation-id').text();
            
            var track = this.tracks.get('trackId');
            var annotation = track.get("annotations").get(annotationId);
            
            return annotation;
          },
          
          /**
           * Get the item related to the given annotation
           *
           * @param {Annotation} the annotation
           * @returns {Object} an item object extend by an index parameter
           */
          getTimelineItemFromAnnotation: function(annotation, track){
            var value = undefined;
            var data = this.timeline.getData();
            
            _.each(data, function(item, idx){
                if(track && track.id && $(item.content).find('.track-id').text()!=track.id)
                  return;
              
                if($(item.content).find('.annotation-id').text() == annotation.id)
                  value = _.extend(item,{index:idx});
            });
            
            if(this.$el.find('.annotation-id:contains('+annotation.id+')').length == 0)
              return undefined;
            
            
            //var item = this.getTimelineItemFromAnnotationId(annotation.id);
            
            return value;
          },
          
          /**
           * Get the top value from the annotations to avoid overlapping
           * 
           * @param {Annotation} the target annotation
           * @returns {Integer} top for the target annotation
           */
          getTopForStacking: function(annotation){
            
            // Target annotation values
            var tStart = annotation.get('start');
            var tEnd   = tStart + annotation.get('duration');
            if(annotation.get('duration') == 0)
              tEnd += this.DEFAULT_DURATION;
            var maxTop = undefined;
            
            // Function to filer annotation
            var rangeForAnnotation = function(a){
              var start = a.get('start');
              var end   = start + a.get('duration');
              if(start == end)
                end += this.DEFAULT_DURATION;
              var el;
              
              // Test if the annotation is overlapping the target annotation
              if((a.id != annotation.id) && // do not take the target annotation into account
                 // Positions check 
                 ( (start >= tStart && start <= tEnd) ||
                    (end > tStart && end <= tEnd) ||
                    (start <= tStart && end >= tEnd) ) &&
                  ((el = this.$el.find('.annotation-id:contains('+a.id+')')).length > 0) // Test if view exist
                )
              {
                // Calculing max top from all annotations
                var elTop = parseInt(el.parent().css('margin-top'));
                    
                if(maxTop === undefined && elTop == 0)
                  maxTop = elTop;
                else if(maxTop != undefined)
                  maxTop = maxTop > elTop ? elTop : maxTop;
                return true;
              }
              
              return false;
            }
            
            if(annotation.collection)
              annotation.collection.filter(rangeForAnnotation,this);
            
            if(maxTop == undefined)
              return 0;
            else
              return maxTop-10;
          },
          
          
          /**
           * TEMPORARY FUNCTION
           *
           * not optimzed function to get track/annotation not well inserted in collection
           */
          
          getTrackTempFix: function(trackId){
            var rTrack = this.tracks.get(trackId);
            
            if(rTrack)
              return rTrack;
            
            this.tracks.each(function(track){
                if(track.id == trackId){
                  rTrack = track;
                }
            },this);
            
            return rTrack;
          },

          getAnnotationTempFix: function(annotationId,track){
            var rAnnotation = track.get("annotations").get(annotationId);
            
            if(rAnnotation)
              return rAnnotation;  
            
            track.get("annotations").each(function(annotation){
                if(annotation.id == annotationId){
                  rAnnotation = annotation;
                }
            },this);
            
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
            $(window).unbind('deleteTrack');
            $(window).unbind('deleteAnnotation');
            $(window).unbind('resize',this.onWindowResize);
              
            this.undelegateEvents();
            
            this.tracks.each(function(track,item){
              var annotations = track.get("annotations");
              annotations.unbind('add'); 
    
            },this);
            
            // Remove all elements
            this.$el.find('#timeline').empty();
            this.timeline.deleteAllItems();
            this.timeline = null;
            delete this.timeline;
            this.data = [];
          }
          
        });
            
            
        return Timeline;
    
    
});
