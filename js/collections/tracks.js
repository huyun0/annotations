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
            
            parse: function(resp, xhr) {
              return resp.tracks;
            },
            
            /**
             * Define the url from the collection with the given video
             *
             * @param {Video} video containing the tracks
             */
            setUrl: function(video){
                if(!video || !video.collection)
                     throw "Parent video must be given!";
                
                this.url = video.url() + "/tracks";
                
                this.each(function(track){
                    track.setUrl();
                });
            }
        });
        
        return Tracks;

});
    
    