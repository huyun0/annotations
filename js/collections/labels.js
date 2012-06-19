define(["order!jquery",
        "order!models/label",
        "order!underscore",
        "order!backbone",
        "order!localstorage"],
    
    function($,Label){
    
        /**
         * Labels collection
         * @class
         */
        var Label = Backbone.Collection.extend({
            model: Label,
            localStorage: new Backbone.LocalStorage("Labels"),
            
            /**
             * @constructor
             */
            initialize: function(models,category){
                _.bindAll(this,"setUrl");
                
                this.setUrl(category);
            },
            
            parse: function(resp, xhr) {
              if(resp.labels && _.isArray(resp.labels))
                return resp.labels;
              else if(_.isArray(resp))
                return resp;
              else
                return null;
            },
            
            /**
             * Define the url from the collection with the given category
             *
             * @param {Category} category containing the labels
             */
            setUrl: function(category){
                if(!category || !category.collection)
                     throw "The parent category of the labels must be given!";
                
                this.url = category.url() + "/labels";  
            }
        });
        
        return Label;

});
    
    