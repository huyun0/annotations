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
    
define(["jquery",
        "collections/tracks",
        "collections/categories",
        "order!access",
        "order!underscore",
        "order!backbone"],
       
    function($, Tracks, Categories, ACCESS){
    
        /**
         * video model
         * @class
         */
        var Video = Backbone.Model.extend({
            
            defaults: {
                access: ACCESS.PUBLIC,
                created_at: null,
                created_by: null,
                updated_at: null,
                updated_by: null,
                deleted_at: null,
                deleted_by: null
            },
            
            initialize: function(attr){
                
                // Check if the video has been initialized 
                if(!attr.id){
                    // If local storage, we set the cid as id
                    if(window.annotationsTool.localStorage)
                        attr['id'] = this.cid;
                        
                    this.toCreate = true;
                }
                
                // Check if tracks are given 
                if(attr.tracks && _.isArray(attr.tracks))
                    this.set({tracks: new Tracks(attr.tracks,this)});
                else
                    this.set({tracks: new Tracks([],this)});
                
                // Check if supported categories are given
                if(attr.categories && _.isArray(attr.categories))
                    this.set({categories: new Categories(attr.categories,this)});
                else
                    this.set({categories: new Categories([],this)});
                
                // If localStorage used, we have to save the video at each change on the children
                if(window.annotationsTool.localStorage){
                    this.attributes['tracks'].bind('change',function(){
                            this.save();
                    },this);
                }
                
                // Define that all post operation have to been done through PUT method
                this.noPOST = true;
                
            },
            
            parse: function(data) {
                var attr = data.attributes ? data.attributes : data;

                attr.created_at = attr.created_at != null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at != null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at != null ? Date.parse(attr.deleted_at): null;
                attr.settings = this.parseSettings(attr.settings);

                if(data.attributes)
                    data.attributes = attr;
                else
                    data = attr;

                return data;
            },
            
            validate: function(attr){
                
                if(attr.id){
                    if(this.get('id') != attr.id){
                        this.id = attr.id;
                        this.setUrl();
                    }
                }
                
                if(attr.tracks && !(attr.tracks instanceof Tracks))
                    return "'tracks' attribute must be an instance of 'Tracks'";
                
                if(attr.created_by && !(_.isNumber(attr.created_by) || attr.created_by instanceof User))
                    return "'created_by' attribute must be a number or an instance of 'User'";
                
                if(attr.updated_by && !(_.isNumber(attr.updated_by) || attr.updated_by instanceof User))
                    return "'updated_by' attribute must be a number or an instance of 'User'";
                
                if(attr.deleted_by && !(_.isNumber(attr.deleted_by) || attr.deleted_by instanceof User))
                    return "'deleted_by' attribute must be a number or an instance of 'User'";
                
                if(attr.created_at){
                    if((tmpCreated=this.get('created_at')) && tmpCreated!==attr.created_at)
                        return "'created_at' attribute can not be modified after initialization!";
                    if(!_.isNumber(attr.created_at))
                        return "'created_at' attribute must be a number!";
                }
        
                if(attr.updated_at){
                    if(!_.isNumber(attr.updated_at))
                        return "'updated_at' attribute must be a number!";
                }

                if(attr.deleted_at){
                    if(!_.isNumber(attr.deleted_at))
                        return "'deleted_at' attribute must be a number!";
                }
            },
            
            /**
             * Modify the current url for the tracks collection
             */
            setUrl: function(){
                this.get("tracks").setUrl(this);
                this.get("categories").setUrl(this);
            },

            /**
             * Parse the given settings to JSON if given as String
             * @param  {String} settings the settings as String
             * @return {JSON} settings as JSON object
             */
            parseSettings: function(settings){
                if(settings && _.isString(settings))
                    settings = JSON.parse(settings);

                return settings;
            }    
        });
        
        return Video;
    
});