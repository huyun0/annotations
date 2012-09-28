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
        "order!collections/annotations",
        "order!access",
        "order!underscore",
        "order!backbone"],
    
    function($,Annotations,ACCESS){
        
        /**
         * Track model
         * @class
         */
        var Track = Backbone.Model.extend({
            
            defaults: {
                access: ACCESS.PRIVATE,
                created_at: null,
                created_by: null,
                updated_at: null,
                updated_by: null,
                deleted_at: null,
                deleted_by: null
            },
            
            initialize: function(attr){
                
                if(!attr || _.isUndefined(attr.name))
                    throw "'name' attribute is required";

                // Check if the track has been initialized 
                if(!attr.id){
                    // If local storage, we set the cid as id
                    if(window.annotationsTool.localStorage)
                        attr['id'] = this.cid;
                        
                    this.toCreate = true;
                }
                
                if(attr.annotations && _.isArray(attr.annotations))
                    this.set({annotations: new Annotations(attr.annotations,this)});
                else
                    this.set({annotations: new Annotations([],this)});
                
                // If localStorage used, we have to save the video at each change on the children
                if(window.annotationsTool.localStorage){
                    this.attributes['annotations'].bind('change',function(annotation){
                            this.save();
                            this.trigger("change");
                    },this);
                }
                
                delete attr.annotations;

                if(attr.id)
                    this.get("annotations").fetch({async:false});
                
                // Add backbone events to the model 
                _.extend(this, Backbone.Events);
                
                this.set(attr);
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
                        this.attributes['id'] = attr.id;
                        this.toCreate = false;
                        this.setUrl();
                        this.trigger('ready',this);

                        var annotations = this.get("annotations");

                        if((annotations.length) == 0)
                            annotations.fetch({async:false});
                    }
                }
                
                if(attr.description && !_.isString(attr.description))
                    return "'description' attribute must be a string";
                
                if(attr.settings && !_.isString(attr.settings))
                    return "'description' attribute must be a string";
                
                if(attr.access &&  !_.include(ACCESS,attr.access))
                    return "'access' attribute is not valid.";
                
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
             * Modify the current url for the annotations collection
             */
            setUrl: function(){
                this.get("annotations").setUrl(this);
            },

            /**
             * @override
             * 
             * Override the default toJSON function to ensure complete JSONing.
             *
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function(){
                var json = Backbone.Model.prototype.toJSON.call(this);
                delete json.annotations;

                return json;
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
        
        return Track;
    
});