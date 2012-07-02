define(["jquery",
        "underscore",
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "backbone"],
       
    function($,_not,PlayerAdapter,Annotation,Annotations){

        /**
         * View to add annotation
         */
        
        var Annotate = Backbone.View.extend({
          
          /** Main container of the appplication */
          el: $('div#annotate-container'),
          
          /** The player adapter passed during initialization part */
          playerAdapter: null,
          
          /** Events to handle by the main view */
          events: {
            "keypress #new-annotation" : "insertOnEnter",
            "click #insert"            : "insert",
            "keydown #new-annotation"  : "onFocusIn",
            "focusout #new-annotation" : "onFocusOut"
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){
            if(!attr.playerAdapter || !PlayerAdapter.prototype.isPrototypeOf(attr.playerAdapter))
                throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
              
            // Set the current context for all these functions
            _.bindAll(this,'insert','render','reset', 'onFocusIn','changeTrack');
            
            // Parameter for stop on write
            this.continueVideo = false;
            
            // New annotation input
            this.input = this.$('#new-annotation');
            
            // Print selected track
            this.trackDIV = this.$el.find('.currentTrack')
            this.changeTrack(annotationsTool.selectedTrack);
            
            this.tracks = annotationsTool.video.get("tracks");
            this.tracks.bind('selected_track',this.changeTrack,this);
            this.playerAdapter = attr.playerAdapter;
          },
          
          /**
           * Proxy function for insert through 'enter' keypress
           */
          insertOnEnter: function(e){
            if(e.keyCode == 13)
              this.insert();
          },
          
          /**
           * Insert a new annotation
           */
          insert: function(){
            var value = this.input.val();
            this.input.val('');
            var time = this.playerAdapter.getCurrentTime();
            
            if(!value || (!_.isNumber(time) || time < 0))
              return;
            
            var annotation = new Annotation({text:value, start:time});
            
            if(annotationsTool.user)
              annotation.set({created_by: annotationsTool.user.id});
              
            annotationsTool.selectedTrack.get("annotations").add(annotation);
            annotation.save({
              success: function(){console.log("saved");}  
            });
            
            if(this.continueVideo)
              this.playerAdapter.play();
          },
          
          /**
           * Change the current selected track by the given one
           */
          changeTrack: function(track){
            // If the track is valid, we set it
            if(track){
              this.input.attr("disabled", false);
              this.trackDIV.html('<b>Selected track: </b>'+track.get("name"));
            }
            else{
              // Otherwise, we disable the input and inform the user that no track is set
              this.input.attr("disabled", true);
              this.trackDIV.html("<span class='notrack'>Select a track!</span>");
            }
          },
          
          /**
           * Listener for when a user start to write a new annotation,
           * manage if the video has to be or not paused.
           */
          onFocusIn: function(){
            if(!this.$el.find('#pause-video').attr('checked') || (this.playerAdapter.getStatus() == PlayerAdapter.STATUS.PAUSED))
              return;
              
            this.continueVideo = true;
            this.playerAdapter.pause();
            
            // If the video is moved, or played, we do no continue the video after insertion
            $(this.playerAdapter).one(PlayerAdapter.EVENTS.TIMEUPDATE,function(){
              this.continueVideo = false;
            });
          },
          
          /**
           * Listener for when we leave the annotation input
           */
          onFocusOut: function(){
            if(this.continueVideo){
              this.continueVideo = false;
              this.playerAdapter.play();
            }
          },
          
          /**
           * Reset the view
           */
          reset: function(){
            this.$el.hide();
            delete this.tracks;
            this.undelegateEvents();
          }
          
        });
            
            
        return Annotate;
    
    
});