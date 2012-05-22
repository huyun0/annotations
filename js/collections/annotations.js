define(["order!jquery",
        "order!models/annotation",
        "order!underscore",
        "order!backbone",
        "order!localstorage"],
    
    function($,Annotation){
    
        /**
         * Annotation collection
         * @class
         */
        var Annotations = Backbone.Collection.extend({
            model: Annotation,
            localStorage: new Backbone.LocalStorage("Annotations"),
            
            /**
             * @constructor
             */
            initialize: function(models,track){
                _.bindAll(this,"setUrl");
                
                this.setUrl(track);
            },
            
            parse: function(resp, xhr) {
              return resp.items;
            },
            
            /**
             * Define the url from the collection with the given track
             *
             * @param {Track} track containing the annotations
             */
            setUrl: function(track){
                if(!track || !track.id || !track.collection)
                     throw "The parent track of the annotations must be given!";
                
                this.url = track.url() + "/annotations";  
            }
        });
        
        return Annotations;

});
    
    