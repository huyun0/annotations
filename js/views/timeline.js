define(["jquery",
        "underscore",
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "libs/timeline-min",
        "backbone"],
       
    function($,_not,PlayerAdapter,Annotation,Annotations){

        /**
         * Timeline view
         */
        
        var Timeline = Backbone.View.extend({
          
          /** Main container of the timeline */
          el: $('div#timeline-container'),
          
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
                           'onPlayerTimeUpdate',
                           'onTimelineMoved',
                           'onTimelineItemChanged',
                           'onTimelineItemDeleted',
                           'onTimelineItemSelected',
                           'onAnnotationDestroyed',
                           'getFormatedDate',
                           'getSelectedItemAndAnnotation',
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
              axisOnTop: true
            };
            
            this.timeline = new links.Timeline(this.el);
            this.timeline.draw(this.data,this.options);
            
            $(this.playerAdapter).bind('pa_timeupdate',this.onPlayerTimeUpdate);
            links.events.addListener(this.timeline,'timechanged',this.onTimelineMoved);
            links.events.addListener(this.timeline,'change',this.onTimelineItemChanged);
            links.events.addListener(this.timeline,'delete',this.onTimelineItemDeleted);
            links.events.addListener(this.timeline,'select',this.onTimelineItemSelected);
            
            this.tracks = annotationsTool.video.get("tracks");
            
            this.$el.show();
            this.addList(this.tracks);
            this.timeline.setCustomTime(this.startDate);
          },

          /**
           * Add a tracks to the timeline
           *
           * @param {Annotation} the annotation to add as view
           */
          addOne: function(track){
            var annotations = track.get("annotations");
            var group = track.get("name")+"<div class='group-id'>"+track.get("id")+"</div>";
            
            var addOneAnnotation = function(annotation){
              this.timeline.addItem({
                  start: this.getFormatedDate(annotation.get("start")),
                  end: this.getFormatedDate(annotation.get("start")+5),
                  content: "<div class='item'>"
                              +annotation.get("text")
                              +"<div class='annotation-id'>"+annotation.get("id")+"</div>",
                  group: group
              });
                
                annotation.bind('destroy',this.onAnnotationDestroyed,this);
                
                annotation.bind('selected',function(){
                  var itemId = this.getTimelineItemFromAnnotation(annotation).index;
                  this.timeline.setSelection([{row: itemId}]);
                },this);
                
                this.timeline.redraw();
            }
            
            annotations.each(addOneAnnotation,this);
            
            annotations.bind('add',addOneAnnotation, this);
          },
          
          /**
           * Add a list of tracks, creating a view for each of them
           */
          addList: function(tracks){
            tracks.each(this.addOne,this);
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
          },
          
          /**
           * Listener for the timeline timeupdate
           *
           * @param {Event} Event object
           */
          onTimelineMoved: function(event){
            var newTime = this.getTimeInSeconds(event.time);
            this.playerAdapter.setCurrentTime(newTime);
          },
          
          /**
           * Listener for item modification
           */
          onTimelineItemChanged: function(){
            var values = this.getSelectedItemAndAnnotation();
            
            if(!values)
              return;
            
            values.annotation.set({start: this.getTimeInSeconds(values.item.start)});
            values.annotation.set({duration: this.getTimeInSeconds(values.item.end)-this.getTimeInSeconds(values.item.start)});
            values.annotation.save();
          },
          
          /**
           * Listener for timeline item deletion
           */
          onTimelineItemDeleted: function(){
            var annotation = this.getSelectedItemAndAnnotation().annotation;
            
            this.timeline.cancelDelete();
            
            if(annotation)
              annotation.destroy();
          },
          
          /**
           * Listener for timeline item selection
           */          
          onTimelineItemSelected: function(){
            var annotation = this.getSelectedItemAndAnnotation().annotation;
            annotation.trigger("selected",annotation);
          },
          
          /**
           * Listener for annotation suppression 
           */
          onAnnotationDestroyed: function(annotation){
            var value = this.getTimelineItemFromAnnotation(annotation);
            
            if(value){
              this.timeline.deleteItem(value.index);
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
            var trackId = $(item.group).text();
            
            var track = this.tracks.get(trackId);
            var annotation = track.get('annotations').get(itemId);
            
            if(!annotation)
              return undefined;
            
            return {
                    annotation: annotation,
                    item: item
            };
          },
          
          /**
           * Get the item related to the given annotation
           *
           * @param {Annotation} the annotation
           * @returns {Object} an item object extend by an index parameter
           */
          getTimelineItemFromAnnotation: function(annotation){
            var value = undefined;
            var data = this.timeline.getData();
            
            _.each(data, function(item, idx){
                if($(item.content).find('.annotation-id').text() == annotation.get('id'))
                  value = _.extend(item,{index:idx});
            });
            
            if(this.$el.find('.annotation-id:contains('+annotation.get('id')+')').length == 0)
              return undefined;
            
            return value;
          },
          
          
          reset: function(){
            this.timeline.deleteAllItems();
            this.data = [];
          }
          
        });
            
            
        return Timeline;
    
    
});