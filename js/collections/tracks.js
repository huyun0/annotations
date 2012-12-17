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
        "order!models/track",
        "order!underscore",
        "order!backbone",
        "order!localstorage"],
       
    function($,Track){
    
        /**
         * Tracks collection
         * @class
         */
        var Tracks = Backbone.Collection.extend({
            model: Track,
            localStorage: new Backbone.LocalStorage("Tracks"),
            
            /**
             * @constructor
             */
            initialize: function(models,video){
        
                    _.bindAll(this,"setUrl");
                    
                    this.setUrl(video);
            },
            
            parse: function(resp, xhr) {
                if(resp.tracks && _.isArray(resp.tracks))
                    return resp.tracks;
                else if(_.isArray(resp))
                    return resp;
                else
                    return null;
            },

            getPrivateTracks: function(){
                return this.where({isPrivate: true});
            },      
            
            /**
             * Define the url from the collection with the given video
             *
             * @param {Video} video containing the tracks
             */
            setUrl: function(video){
                if(!video || !video.collection)
                     throw "Parent video must be given!";
                
                this.url = video.url() + "/tracks";

                if(annotationsTool.localStorage)
                    this.localStorage = new Backbone.LocalStorage(this.url);

                this.each(function(track){
                    track.setUrl();
                });
            }
        });
        
        return Tracks;

});
    
    