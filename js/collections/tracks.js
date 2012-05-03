define(["jquery", "require", "models/track", "underscore","backbone","localstorage"],function($,require){
    
    var Track = require("models/track");
    
    /**
     * Tracks collection
     * @class
     */
    var Tracks = Backbone.Collection.extend({
        model: Track,
        localStorage: new Backbone.LocalStorage("Tracks"),
        
        initialize: function(models,video){     
                var Video = require("models/video");
    
                if(!(video && video instanceof Video))
                    throw "The parent video of the annotations must be given!";
                
                this.url = "/videos/"+video.get("id")+"/tracks";
                
                this.video = video;
        }
    });
    
    return Tracks;

});
    
    