define(["order!jquery",
        "order!models/scale",
        "order!underscore",
        "order!backbone",
        "order!localstorage"],
       
    function($,Scale){
    
        /**
         * Scales collection
         * @class
         */
        var Scales = Backbone.Collection.extend({
            model: Scale,
            localStorage: new Backbone.LocalStorage("Scales"),
            
            initialize: function(video){
                _.bindAll(this, "setUrl");
                
                this.setUrl(video);
            },
            
            parse: function(resp, xhr) {
              return resp.scales;
            },
            
            /**
             * Define the url from the collection with the given video
             *
             * @param {Video} video containing the scale
             */
            setUrl: function(video){
                if(!video || !video.collection) {
                    this.url = window.annotationsTool.restEndpointsUrl + "/scales";
                } else {
                    this.url = video.url() + "/scales";
                }
            }
        });
        
        return Scales;

});
    
    