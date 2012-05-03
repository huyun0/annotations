define(["jquery",
        "models/annotation",
        "models/video",
        "models/track",
        "underscore",
        "backbone",
        "localstorage"],
    
    function($,Annotation,Video,Track){
    
        /**
         * Annotation collection
         * @class
         */
        var Annotations = Backbone.Collection.extend({
            model: Annotation,
            localStorage: new Backbone.LocalStorage("Annotations"),
            
            initialize: function(models,video,track){
                if(!(video && video instanceof Video))
                    throw "The parent video of the annotations must be given!";
                
                this.url = "/videos/"+video.get("id");
                
                if(!(track && track instanceof Track)){
                     throw "The parent track of the annotations must be given!";
                }
                
                this.url += "/tracks/"+track.get("id")+"/annotations";
                
                this.video = video;
            }
        });
        
        return Annotations;

});
    
    