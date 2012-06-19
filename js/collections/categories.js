define(["order!jquery",
        "order!models/category",
        "order!underscore",
        "order!backbone",
        "order!localstorage"],
    
    function($,Category){
    
        /**
         * Category collection
         * @class
         */
        var Categories = Backbone.Collection.extend({
            model: Category,
            localStorage: new Backbone.LocalStorage("Categories"),
            
            /**
             * @constructor
             */
            initialize: function(models,video){
                _.bindAll(this,"setUrl");
                
                // If is not a template (copy in a video), we modify the url for this category
                if(video)
                    this.setUrl(video);
            },
            
            parse: function(resp, xhr) {
              if(resp.categories && _.isArray(resp.categories))
                return resp.annotations;
              else if(_.isArray(resp))
                return resp;
              else
                return null;
            },
            
            /**
             * Define the url from the collection with the given video
             *
             * @param {Category} video containing the category
             */
            setUrl: function(video){
                if(!video || !video.collection)
                     throw "The parent video of the categories must be given!";
                
                this.url = video.url() + "/categories";  
            }
        });
        
        return Categories;

});
    
    