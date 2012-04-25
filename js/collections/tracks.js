define(["jquery","models/track","underscore","backbone","localstorage"],function($,Track){
    
    /**
     * Tracks collection
     * @class
     */
    var Tracks = Backbone.Collection.extend({
        model: Track,
        localStorage: new Backbone.LocalStorage("Tracks")
    });
    
    return Tracks;

});
    
    