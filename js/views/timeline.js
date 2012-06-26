define(["jquery",
        "underscore",
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "text!templates/timeline-group.tmpl",
        "text!templates/timeline-item.tmpl",
        "text!templates/timeline-modal-group.tmpl",
        "libs/handlebars",
        "libs/timeline-min",
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
            "click #add-track"            : "loadAddTrackModal"
          },
          
          /** Constant for void item content */
          VOID_ITEM: "_",
          
          /**
           * @constructor
           */
          initialize: function(attr){
            if(!attr.playerAdapter || !PlayerAdapter.prototype.isPrototypeOf(attr.playerAdapter))
                throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
            
            //if(!attr.annotations)
            //   throw "The annotations have to be given to the annotate view.";
            
            this.data = [];
              
            _.bindAll(this,'addOne',
                           'addList',
                           'addTrack',
                           'onDeleteTrack',
                           'onTrackSelected',
                           'onPlayerTimeUpdate',
                           'onTimelineMoved',
                           'onTimelineItemChanged',
                           'onTimelineItemDeleted',
                           'onTimelineItemSelected',
                           'onTimelineItemAdded',
                           'onAnnotationDestroyed',
                           'getVoidItem',
                           'getFormatedDate',
                           'getSelectedItemAndAnnotation');
            

            this.playerAdapter = attr.playerAdapter;
            
            
            this.endDate = this.getFormatedDate(this.playerAdapter.getDuration());
            this.startDate = new Date(this.endDate.getFullYear(),this.endDate.getMonth(),this.endDate.getDate(),0,0,0);
            
            this.options = {
              width:  "100%",
              height: "auto",
              style: "box",
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
              eventMarginAxis: 0,
              eventMargin: 0,
              groupsChangeable: true
            };
            
            this.timeline = new links.Timeline(this.$el.find("#timeline")[0]);
            this.timeline.draw(this.data,this.options);
            
            // Ensure that the timeline is redraw on window resize
            var self = this;
            $(window).resize(function(){
              self.timeline.redraw();
              if(annotationsTool.selectedTrack)
                self.onTrackSelected(null,annotationsTool.selectedTrack.id);
            })
            
            $(window).bind('selectTrack', $.proxy(this.onTrackSelected,self));
            $(window).bind('deleteTrack', $.proxy(this.onDeleteTrack,self));
            
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
            
            this.timeline.redraw = function(){
              if(annotationsTool.selectedTrack)
                self.onTrackSelected(null,annotationsTool.selectedTrack.id);
            }
            
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
            
            var addOneAnnotation = function(annotation){
              
              // If annotation has not id, we save it to have an id
              if(!annotation.id){
                annotation.bind('ready',addOneAnnotation, this);
                return;
              }
                
              var annJSON = annotation.toJSON();
              annJSON.id = annotation.id;
              annJSON.track = track.id;
              var trackJSON = track.toJSON();
              trackJSON.id = track.id;
              
              this.timeline.addItem({
                  start: this.getFormatedDate(annotation.get("start")),
                  end: this.getFormatedDate(annotation.get("start")+5),
                  content: this.itemTemplate(annJSON),
                  group: this.groupTemplate(trackJSON)
              });
                
                annotation.bind('destroy',this.onAnnotationDestroyed,this);
                
                annotation.bind('selected',function(){
                  var itemId = this.getTimelineItemFromAnnotation(annotation).index;
                  this.timeline.setSelection([{row: itemId}]);
                },this);
                
                //this.timeline.redraw();
            }
            
            annotations.each(addOneAnnotation,this);
            annotations.bind('add',addOneAnnotation, this);
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
            
            var track = this.tracks.create(param);
            
            track.save();
            annotationsTool.video.save();
            
            // If no track selected, we use the new one
            if(!annotationsTool.selectedTrack)
              annotationsTool.selectedTrack = track;
            
            
            this.timeline.redraw();
            this.onTrackSelected(null,annotationsTool.selectedTrack.id);
          },
          
          /**
           * Load the modal window to add a new track
           */
          loadAddTrackModal: function(){
            
            // Test if the modal window has already been initialized
            if(!this.groupModal){
                // Otherwise we load the login modal
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
                      name: self.groupModal.find('#name')[0].value,
                      description: self.groupModal.find('#description')[0].value
                    },this)
                    
                    self.groupModal.modal("toggle");
                };
                
                this.groupModal.find('a#add-group').bind("click",insertTrack);
                this.groupModal.bind("keypress",function(event){
                  if(event.keyCode == 13){
                    insertTrack();  
                  }
                });
            }
            else{
              this.groupModal.find('.alert #content').html("");
              this.groupModal.find('.alert').hide();
              this.groupModal.find('#name')[0].value = '';
              this.groupModal.find('#description')[0].value = '';
              this.groupModal.modal("toggle");
            }
          },
          
          
          /* --------------------------------------
            Listeners
          ----------------------------------------*/
          
          /**
           * Listener for the player timeupdate 
           */
          onPlayerTimeUpdate: function(){
            var newDate = this.getFormatedDate(this.playerAdapter.getCurrentTime());
            this.timeline.setCustomTime(newDate);
            
            
            // Select the good items
            var data = this.timeline.getData();
            var selection = new Array();
            
            _.each(data,function(item,index){
              if((item.start <= newDate) && (item.end >= newDate)){
                selection.push({row:index});
              }
            },this);
            
            this.timeline.setSelection(selection);
            
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
            var hasToPlay = (this.playerAdapter.getStatus() == PlayerAdapter.STATUS.PLAYING);
            this.playerAdapter.pause();
            
            var values = this.getSelectedItemAndAnnotation();
            
            if(!values)
              return;
            
            values.annotation.set({start: this.getTimeInSeconds(values.item.start),
                                   duration: this.getTimeInSeconds(values.item.end)-this.getTimeInSeconds(values.item.start)});

            // Function called when all changed have been applied
            var finalizeChanges = $.proxy(function(){
              var htmlElement = this.$el.find('.annotation-id:contains('+values.annotation.id+')').parent().parent()[0];
              var index = this.timeline.getItemIndex(htmlElement);
              var newItem = this.timeline.getItem(index);
              this.timeline.setSelection([{row: index}]);
              this.playerAdapter.setCurrentTime(this.getTimeInSeconds(newItem.start));
              
              values.oldTrack.save();
              annotationsTool.video.save();
              this.timeline.redraw();
              if(hasToPlay)
                this.playerAdapter.play();             
            },this);
            
            if(values.newTrack.id != values.oldTrack.id){
              var annJSON = values.annotation.toJSON();
              delete annJSON.id;
              
              values.annotation.destroy({
                success: $.proxy(function(){
                    values.oldTrack.get('annotations').remove(values.annotation);
                    values.annotation = values.newTrack.get('annotations').create(annJSON);
                    if(!values.annotation.id)
                      values.annotation.bind('ready',finalizeChanges,this);
                    else
                      finalizeChanges();
                },this)
              });
            }
            else{
              finalizeChanges();
              values.annotation.save();
            }
            
            
          },
          
          /**
           * Listener for timeline item deletion
           */
          onTimelineItemDeleted: function(){
            var annotation = this.getSelectedItemAndAnnotation().annotation;
            
            this.timeline.cancelDelete();
            
            if(annotation){
              annotation.destroy();
              
              if(annotationsTool.localStorage)
                annotationsTool.video.save();
            }
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
            annotation.trigger("selected",annotation);
          },
          
          /**
           * Listener for annotation suppression 
           */
          onAnnotationDestroyed: function(annotation, track){
            var value = this.getTimelineItemFromAnnotation(annotation, track);
            
            if(value){
              this.timeline.deleteItem(value.index);
            }
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
            
            var annotations = track.get("annotations");
            
            /**
             * Recursive function to delete synchronously all annotations
             */
            var destroyAnnotation = function(){
              // End state, no more annotation
              if(annotations.length == 0)
                return;
              
              var annotation = annotations.at(0);
              annotation.destroy({
                error: function(){
                  throw "Cannot delete annotation!";
                },
                success: function(){
                  annotations.remove(annotation);
                  destroyAnnotation();
                }
              });
            };
            
            // Call the recursive function 
            destroyAnnotation();
            
            var items = this.timeline.getData().slice();
            var newItems = new Array();
  
            _.each(items, function(item, index){
              if($(item.group).find('.track-id').text() != track.id)
                newItems.push(item);
            },this);
            
            // Destroy the track and redraw the timeline
            var self = this;
            track.destroy({
              success: function(){
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
              }
            });            
          },
          
          /**
           * Listener for track selection
           *
           * @param {Event} event the action event
           * @param {Integer} trackId Id of the selected track
           */
          onTrackSelected: function(event,trackId){
            var track = this.tracks.get(trackId);
            
            // If the track does not exist, and it has been thrown by an event
            if(!track && event)
              return;
            
            annotationsTool.selectedTrack = track;
            this.tracks.trigger('selected_track',track);
            
            this.$el.find('div.selected').removeClass('selected');
            this.$el.find('.timeline-group .track-id:contains('+trackId+')').parent().parent().addClass('selected');
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
            var oldTrack = this.tracks.get(oldTrackId);
            var newTrack = this.tracks.get(newTrackId);
            var annotation = oldTrack.get('annotations').get(itemId);
            
            if(!annotation){
               /* If annotation has been had shortly before in the collection, can get id with "get" function
                  So a loop is needed
                  TODO find a better solution
                  */
               oldTrack.get('annotations').each(function(ann){
                if(ann.id == itemId){
                  annotation = ann;
                  return;
                }
               });
            }
            
            if(!newTrack){
              this.tracks.each(function(track){
                if(track.id == newTrackId){
                  newTrack = track;
                  return;
                }
              })
            }
            
            return {
                    annotation: annotation,
                    item: item,
                    newTrack: newTrack,
                    oldTrack: oldTrack
            };
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
            
            return value;
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