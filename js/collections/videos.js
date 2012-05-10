define(["order!jquery",
        "order!models/video",
        "order!underscore",
        "order!backbone",
        "order!localstorage"],
       
    function($,Video){
    
        /**
         * Videos collection
         * @class
         */
        var Videos = Backbone.Collection.extend({
            model: Video,
            localStorage: new Backbone.LocalStorage("Videos"),
            
            initialize: function(){
                this.url = window.annotationsTool.restEndpointsUrl + "/videos";
            }
        });
        
        return Videos;

});
    
    