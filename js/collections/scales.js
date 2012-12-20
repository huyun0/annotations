/**
 *  Copyright 2012, Entwine GmbH, Switzerland
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 *
 */
    
define(["order!jquery",
        "order!models/scale",
        "order!use!backbone",
        "order!use!localstorage"],
       
    function($,Scale, Backbone){
    
        /**
         * Scales collection
         * @class
         */
        var Scales = Backbone.Collection.extend({
            model: Scale,
            localStorage: new Backbone.LocalStorage("Scales"),

            /**
             * @constructor
             * 
             * @param  {Array} models List of scales to add to the collection
             * @param  {Video} video  Video supporting the scales collection
             */
            initialize: function(models, video){
                _.bindAll(this, "setUrl","addCopyFromTemplate");
                
                this.setUrl(video);
            },
            
            parse: function(resp, xhr) {
                if(resp.scales && _.isArray(resp.scales))
                    return resp.scales;
                else if(_.isArray(resp))
                    return resp;
                else
                    return null;
            },
            
            /**
             * Define the url from the collection with the given video
             *
             * @param {Video} video containing the scale
             */
            setUrl: function(video){
                if(!video || !video.collection){ // If a template
                    this.url = window.annotationsTool.restEndpointsUrl + "/scales";
                    this.isTemplate = true;
                }
                else{  // If not a template, we add video url      
                    this.url = video.url() + "/scales";
                    this.isTemplate = false;

                    if(annotationsTool.localStorage)
                        this.localStorage = new Backbone.LocalStorage(this.url);
                }
                
                this.each(function(scale){
                    scale.setUrl();
                });
            },
            
            /**
             * Add a copy from the given template to this collection
             *
             * @param {Scale} template to copy 
             */
            addCopyFromTemplate: function(element){
                
                // Test if the given scale is really a template
                if(!this.isTemplate && !_.isArray(element) && element.id){
                    
                    // Copy the element and remove useless parameters 
                    var copyJSON = element.toJSON();
                    delete copyJSON.id;
                    delete copyJSON.created_at;
                    delete copyJSON.created_by;
                    delete copyJSON.updated_at;
                    delete copyJSON.updated_by;
                    delete copyJSON.deleted_by;
                    delete copyJSON.deleted_at;
                    delete copyJSON.labels;
                    
                    // add the copy url parameter for the backend
                    copyJSON['copyUrl'] = "?scale_id="+element.id;
                    
                    return this.create(copyJSON);
                    
                    // TODO add localStorage version
                }
                
                return null;
            }
            
        });
        
        return Scales;

});
    
    