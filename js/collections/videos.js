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
            url: "/videos",
            localStorage: new Backbone.LocalStorage("Videos")
        });
        
        return Videos;

});
    
    