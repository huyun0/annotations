define(["jquery",
        "underscore",
        "backbone"],
       
       function($){
          
            /**
             * Synchronisation module for the annotations tool
             *
             * Has to be used to add persistence with the annotations model and the REST API
             */
            var AnnotationsSync = function(method, model, options, config){
             
               var self = this;
               
               // Sync module configuration
               this.config = $.extend({
                    restEndpointUrl: "http://localhost",
                    headerParams: {
                         userId: "Annotations-User-Id",
                         token: "Annotations-User-Auth-Token"
                    }
               },config);
               
               /**
                * Get the URI for the given resource
                *
                * @param {Model, Collection} model model or collection to 
                */
               this.getURI = function(resource, isPut){
                    if(resource.id !== undefined){
                         var uri = self.config.restEndpointUrl + resource.collection.url;
                         if(!isPut)
                              uri+="/" + resource.id;
                         return uri;
                    }
                    else if(resource.collection !== undefined){
                         return self.config.restEndpointUrl + resource.collection.url;
                    }
                    else{
                         return self.config.restEndpointUrl + resource.url;
                    }
               }
               
               
               /**
                * Errors callback for jQuery Ajax method. 
                */
               this.setError = function(XMLHttpRequest, textStatus, errorThrown){
                                  console.warn("Error during "+method+" of resource, "+XMLHttpRequest.status+", "+textStatus);
                                  options.error(textStatus+", "+errorThrown);
               }
               
               /**
                * Callback related to "beforeSend" from the jQuery Ajax method.
                * Set the HTTP hedaer before to send the request
                */
               this.setHeaderParams = function(xhr) {
                                   if(!_.isUndefined(window.annotationUser))
                                        xhr.setRequestHeader(self.config.headerParams.userId, annotationUser.get('id'));
               
                                   // Only for sprint 2
                                   // xhr.setRequestHeader(self.config.headerParams.token, token); 
               };
                
               /**
                * Method to send a GET request to the given url with the given resource
                *
                * @param {Model, Collection} resource
                */
               var create = function(resource){
                    $.ajax({
                              async: false,
                              type: "POST",
                              url: self.getURI(resource, false),
                              dataType: "json",
                              data: JSON.parse(JSON.stringify(resource)),
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, XMLHttpRequest){
                                   
                                   var location = XMLHttpRequest.getResponseHeader('LOCATION');
                                   
                                   if(location){
                                        // Get the id of the created resource through the url
                                        var newId    = _.last(location.split("/"));
                                        
                                        // Set the resource id and ret
                                        resource.set({id:newId});
                                        options.success(resource.toJSON());
                                   }
                                   else{
                                        options.error("Location not returned after resource creation.");
                                   }
                              },
                              
                              error: self.setError
                    });
               }
               
               /**
                * Find the given resource 
                *
                * @param {Model, Collection} resource
                */
               var find = function(resource){
                    $.ajax({
                              async: false,
                              type: "GET",
                              url: self.getURI(resource, false),
                              dataType: "json",
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, XMLHttpRequest){
                                   options.success(data);
                              },
                              
                              error: self.setError
                    });
               };
               
               /**
                * Find all resource from collection
                *
                * @param {Model, Collection} resource
                */
               var findAll = function(resource){
                    $.ajax({
                              async: false,
                              type: "GET",
                              url: self.getURI(resource, false),
                              dataType: "json",
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, XMLHttpRequest){
                                   /* Get the list from the result
                                    *
                                    * TODO: In the future override the parse method from each collection
                                    *  to have more control on them
                                    */
                                   if(_.isObject(data)){
                                        if(_.each(data,function(element,index){
                                             if(_.isArray(element))
                                                  options.success(element);
                                        }));
                                   }
                                   
                                   if(_.isUndefined(returnValue))
                                        options.error("List not found in response");
                              },
                              
                              error: self.setError
                    });
               };
               
               /**
                * Method to send a PUT request to the given url with the given resource
                *
                * @param {Model, Collection} resource
                */
               var update = function(resource){
                    $.ajax({
                              async: false,
                              type: "PUT",
                              url: self.getURI(resource, true),
                              data: JSON.parse(JSON.stringify(resource)),
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, XMLHttpRequest){
                                   
                                   var action   = (XMLHttpRequest.status == 200 ? "update" : "creation");                          
                                   var location = XMLHttpRequest.getResponseHeader('LOCATION');
                                   
                                   if(location){
                                        // Get the id of the created resource through the url
                                        var newId    = _.last(location.split("/"));
                                        
                                        // Set the resource id and ret
                                        resource.set({id:newId});
                                        
                                        options.success(resource.toJSON()); 
                                   }
                                   else {
                                        options.error("Location not returned after resource "+action+".");
                                   }
                                   
                                   
                              },
                              
                              error: self.setError
                    });
               };
               
               
               /**
                * Delete a resource
                *
                * @param {Model, Collection} resource
                */
               var destroy = function(resource){
                    $.ajax({
                              async: false,
                              type: "DELETE",
                              crossDomain: true,
                              url: self.getURI(resource, false),
                              dataType: "json",
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, XMLHttpRequest){
                                   
                                   if(XMLHttpRequest.status == 200){
                                        returnValue = resource;
                                   }
                                   else{
                                        error = "Waiting for status code 200 but got: "+XMLHttpRequest.status;
                                        console.warn("Error during resource delete, "+XMLHttpRequest.status+", "+textStatus);  
                                   }
                              },
                              error: self.setError
                    });
               };
               
                    
               switch(method){  
                        case "create":  create(model); break;
                        
                        // if model.id exist, it is a model, otherwise a collection so we retrieve all its items
                        case "read":    model.id != undefined ? find(model) : findAll(model); break;  
                        case "update":  update(model); break;
                        case "delete":  destroy(model); break;
               }

                
             
             };
             

             return AnnotationsSync;

});