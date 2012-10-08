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
        "order!models/annotation",
        "order!underscore",
        "order!backbone",
        "order!localstorage"],
    
    function($,Annotation){
    
        /**
         * Annotation collection
         * @class
         */
        var Annotations = Backbone.Collection.extend({
            model: Annotation,
            localStorage: new Backbone.LocalStorage("Annotations"),
            
            /**
             * @constructor
             */
            initialize: function(models,track){
                _.bindAll(this,"setUrl");
                
                this.setUrl(track);
            },
            
            parse: function(resp, xhr) {
              if(resp.annotations && _.isArray(resp.annotations))
                return resp.annotations;
              else if(_.isArray(resp))
                return resp;
              else
                return null;
            },
            
            /**
             * Define the url from the collection with the given track
             *
             * @param {Track} track containing the annotations
             */
            setUrl: function(track){
                if(!track)
                     throw "The parent track of the annotations must be given!";
                else if(track.collection)
                    this.url = track.url() + "/annotations";  

                if(annotationsTool.localStorage)
                      this.localStorage = new Backbone.LocalStorage(this.url);
            }
        });
        
        return Annotations;

});
    
    