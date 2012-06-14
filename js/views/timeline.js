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
          
          /** Events to handle by the main view */
          events: {
            //"keypress #new-annotation" : "insertOnEnter",
            //"click #insert"            : "insert"     
          },
          
          data: [],
          
          /**
           * @constructor
           */
          initialize: function(attr){
            if(!attr.playerAdapter || !PlayerAdapter.prototype.isPrototypeOf(attr.playerAdapter))
                throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
            
            //if(!attr.annotations)
            //   throw "The annotations have to be given to the annotate view.";
              
            _.bindAll(this,'addOne',
                           'addList',
                           'onPlayerTimeUpdate',
                           'onTimelineMoved',
                           'onTimelineItemChanged',
                           'onTimelineItemDeleted',
                           'onTimelineItemSelected',
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
              //intervalMin: 5000,
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
              this.timeline.addItem(
                {
                  start: this.getFormatedDate(annotation.get("start")),
                  end: this.getFormatedDate(annotation.get("start")+5),
                  content: annotation.get("text")+"<div class='item-id'>"+annotation.get("id")+"</div>",
                  group: group
                }
              );
            }
            
            annotations.each(addOneAnnotation,this);
            
            annotations.bind('add',addOneAnnotation, this);
            
            this.timeline.redraw();
          },
          
          /**
           * Add a list of tracks, creating a view for each of them
           */
          addList: function(tracks){
            tracks.each(this.addOne,this);
          },
          
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
          
          onTimelineItemChanged: function(){
            var values = this.getSelectedItemAndAnnotation();
            
            if(!values)
              return;
            
            values.annotation.set({start: this.getTimeInSeconds(values.item.start)});
            values.annotation.set({duration: this.getTimeInSeconds(values.item.end)-this.getTimeInSeconds(values.item.start)});
            values.annotation.save();
          },
          
          onTimelineItemDeleted: function(){
            var annotation = this.getSelectedItemAndAnnotation().annotation;
            
            if(annotation)
              annotation.destroy();
          },
          
          onTimelineItemSelected: function(){
            var annotation = this.getSelectedItemAndAnnotation().annotation;
            annotation.trigger("selected",annotation);
          },
          
          
          
          /**
           * Get the formated date for the timeline with the given seconds
           *
           * @param {Double} time in seconds
           */
          getFormatedDate: function(seconds){
            var newDate = new Date(seconds*1000);
            newDate.setHours(newDate.getHours()-1);
            return newDate;
          },
          
          getTimeInSeconds: function(date){
            var time = date.getHours()*3600+date.getMinutes()*60+date.getSeconds()+date.getMilliseconds()/1000;
            return Number(time); // Ensue that is really a number
          },
          
          getSelectedItemAndAnnotation: function(){
            var itemId = $('.timeline-event-selected .item-id').text();
            var selection = this.timeline.getSelection();
            
            if(selection.length == 0)
              return undefined;
            
            var item = this.timeline.getItem(selection[0].row);
            var trackId = $(item.group).text();
            
            var track = this.tracks.get(trackId);
            var annotation = track.get('annotations').get(itemId);
            
            return {
                    annotation: annotation,
                    item: item
            };
          }
          

          
        });
            
            
        return Timeline;
    
    
});