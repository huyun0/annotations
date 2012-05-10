define(["order!jquery",
        "order!models/track",
        "order!underscore",
        "order!backbone",
        "order!localstorage"],
       
    function($,Track){
    
        /**
         * Tracks collection
         * @class
         */
        var Tracks = Backbone.Collection.extend({
            model: Track,
            localStorage: new Backbone.LocalStorage("Tracks"),
            
            /**
             * @constructor
             */
            initialize: function(models,video){
        
                    _.bindAll(this,"setUrl");
                    
                    this.setUrl(video);
            },
            
            /**
             * Define the url from the collection with the given video
             *
             * @param {Video} video containing the tracks
             */
            setUrl: function(video){
                if(!video || !video.id || !video.collection)
                     throw "The parent video of the tracks must be given!";
                
                
                this.url = video.url() + "/tracks";  
            }
        });
        
        return Tracks;

});
    
    