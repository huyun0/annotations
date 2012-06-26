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
            "focusin #new-annotation"   : "onFocusIn"
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){
            if(!attr.playerAdapter || !PlayerAdapter.prototype.isPrototypeOf(attr.playerAdapter))
                throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
              
            _.bindAll(this,'insert','render','reset', 'onFocusIn');
            
            this.continueVideo = false;
            
            this.tracks = annotationsTool.video.get("tracks");
            this.playerAdapter = attr.playerAdapter;
            this.input = this.$('#new-annotation');
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
              console.log('video start again');
            });
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