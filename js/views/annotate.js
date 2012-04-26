define(["jquery",
        "underscore",
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "backbone"],
       
    function($,_not,PlayerAdapter,Annotation,Annotations){

        /**
         * Main view of the application
         */
        
        var Annotate = Backbone.View.extend({
          
          /** Main container of the appplication */
          el: $('div#annotate-container'),
          
          /** The player adapter passed during initialization part */
          playerAdapter: null,
          
          /** Events to handle by the main view */
          events: {
            "keypress #new-annotation" : "insertOnEnter",
            "click #insert"            : "insert"     
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){
            if(!attr.playerAdapter || !PlayerAdapter.prototype.isPrototypeOf(attr.playerAdapter))
                throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
            
            if(!attr.annotations)
                throw "The annotations have to be given to the annotate view.";
              
            _.bindAll(this,'insert','render');
            
            this.annotations = attr.annotations;
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
            var time = this.playerAdapter.getCurrentTime();
            
            if(!value || (!_.isNumber(time) || time < 0))
              return;
            
            this.annotations.create({text:value, start:time});
          }
          
        });
            
            
        return Annotate;
    
    
});