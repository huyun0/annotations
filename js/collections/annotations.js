define(["jquery","models/annotation","underscore","backbone","localstorage"],function($,Annotation){
    
    /**
     * Annotation collection
     * @class
     */
    var Annotations = Backbone.Collection.extend({
        model: Annotation,
        localStorage: new Backbone.LocalStorage("Annotations")
    });
    
    return Annotations;

});
    
    