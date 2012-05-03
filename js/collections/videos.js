define(["jquery","models/video","underscore","backbone","localstorage"],function($,Video){
    
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
    
    