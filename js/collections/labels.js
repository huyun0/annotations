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
                if(!category){
                    throw "The parent category of the labels must be given!";
                }
                else if(category.collection){
                    this.url = category.url() + "/labels";  
                }

                if(annotationsTool.localStorage)
                      this.localStorage = new Backbone.LocalStorage(this.url);
            }
        });
        
        return Label;

});
    
    