define(["jquery",
        "underscore",
        "prototypes/player_adapter",
        "collections/annotations",
        "views/annotate",
        "views/list",
        "backbone",
        "libs/bootstrap/bootstrap.min"],
       
       function($,_,PlayerAdapter,Annotations,Annotate,List){

    /**
     * Main view of the application
     */
    
    var MainView = Backbone.View.extend({
      
      /** Main container of the appplication */
      el: $('div#main-container'),
      
      /** The player adapter passed during initialization part */
      playerAdapter: null,
      
      /** Events to handle by the main view */
      events: {
        
      },
      
      initialize: function(playerAdapter){
        
        if(!PlayerAdapter.prototype.isPrototypeOf(playerAdapter))
            throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
        
        this.playerAdapter = playerAdapter;
        
        this.annotations = new Annotations();
        this.annotations.fetch();   
        
        var annotations = this.annotations;
        this.annotations.bind('destroy',function(annotation){
            annotations.remove(annotation);
            console.log('annotation destroyed');
        });
        
        this.annotations.bind('jumpto',function(start){
            console.log('jump To '+start );
            playerAdapter.setCurrentTime(start);
        });
        
        this.annotations.bind('add',function(annotation){
            annotation.save();
        });
       
        
        new Annotate({playerAdapter: this.playerAdapter, annotations: this.annotations});
        new List({annotations: this.annotations});
        

      }
      
    });
        
        
    return MainView;
    
    
});