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
                _.bindAll(this,"setUrl","copyTemplate");
                
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
                if(!video || !video.collection){ // If a template
                    this.url = window.annotationsTool.restEndpointsUrl + "/categories";
                    this.isTemplate = true;
                }
                else{  // If not a template, we add video url      
                    this.url = video.url() + "/categories";
                    this.isTemplate = false;
                }
            },
            
            copyTemplate: function(element){

                if(!this.isTemplate && !_.isArray(element) && element.id){
                    var copy = element.toJSON();
                    delete copy.id;
                    
                    if(!window.annotationsTool.localStorage){
                        $.ajax({
                              crossDomain: true,
                              type: "POST",
                              async: false,
                              url: this.url + "?category_id="+element.id,
                              dataType: "json",
                              data: JSON.parse(JSON.stringify(copy)),
                              beforeSend: function(xhr) {
                                            // Use request user id
                                            if(!_.isUndefined(window.annotationsTool) && !_.isUndefined(window.annotationsTool.user))
                                                xhr.setRequestHeader(self.config.headerParams.userId, annotationsTool.user.id);
                                        },
                              success: function(data, textStatus, XMLHttpRequest){
                                   copy.set(data);
                              },
                              
                              error: function(error){
                                console.warn(error);
                            }
                        });
                    }
                    
                    this.add(copy);
                    
                    return copy;
                }
                
                return null;

            }
        });
        
        return Categories;

});
    
    