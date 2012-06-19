define(["order!jquery",
        "order!models/scalevalue",
        "order!underscore",
        "order!backbone",
        "order!localstorage"],
       
    function($,ScaleValue){
    
        /**
         * Scale values collection
         * @class
         */
        var ScaleValues = Backbone.Collection.extend({
            model: ScaleValue,
            localStorage: new Backbone.LocalStorage("ScaleValue"),
            
            initialize: function(models, scale){
                _.bindAll(this, "setUrl");
                
                this.setUrl(scale);
            },
            
            parse: function(resp, xhr) {
              return resp.scaleValues;
            },
            
            /**
             * Define the url from the collection with the given video and scale
             *
             * @param {Scale} scale containing the scale value
             */
            setUrl: function(scale){
                if(!scale || !scale.collection)
                    throw "The parent scale of the scale value must be given!";
                
                this.url = scale.url() + "/scalevalues";
            }
        });
        
        return ScaleValues;

});
    
    