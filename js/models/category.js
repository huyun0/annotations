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
        "order!collections/labels",
        "order!access",
        "order!underscore",
        "order!backbone"],
    
    function($, Labels, ACCESS){
        
        /**
         * Category model
         * @class
         */
        var Category = Backbone.Model.extend({
            
            defaults: {
                access: ACCESS.PUBLIC,
                created_at: null,
                created_by: null,
                updated_at: null,
                updated_by: null,
                deleted_at: null,
                deleted_by: null,
                has_duration: true
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

                attr.settings = this.parseSettings(attr.settings);
                
                if(attr.labels && _.isArray(attr.labels))
                    this.set('labels',new Labels(attr.labels,this));
                else if(!attr.labels)
                    this.set('labels',new Labels([],this));

                if(attr.id && !annotationsTool.localStorage)
                    this.get("labels").fetch({async:false});
                
                // If localStorage used, we have to save the video at each change on the children
                if(window.annotationsTool.localStorage){
                    var saveChange = function(label){
                            this.save();
                            this.trigger("change");
                    }
                    this.attributes.labels.bind('change',saveChange,this);
                    this.attributes.labels.bind('remove',saveChange,this);
                }
                
                this.set(attr);
            },
            
            parse: function(data) {
                var attr = data.attributes ? data.attributes : data;

                attr.created_at = attr.created_at != null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at != null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at != null ? Date.parse(attr.deleted_at): null;
                attr.settings = this.parseSettings(attr.settings);
                if(attr.category)
                    attr.category = this.parseSettings(attr.category.settings);

                if(annotationsTool.localStorage && _.isArray(attr.labels))
                    attr.labels = new Labels(attr.labels,this);

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

                        if(!annotationsTool.localStorage)
                            this.get("labels").fetch({async:false});
                    }
                }

                
                if(attr.description && !_.isString(attr.description))
                    return "'description' attribute must be a string";
                
                if(attr.settings && (!_.isObject(attr.settings) && !_.isString(attr.settings)))
                    return "'description' attribute must be a string or a JSON object";
                
                if(attr.access &&  !_.include(ACCESS,attr.access))
                    return "'access' attribute is not valid.";
                
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
             * Change category color
             * @param  {String} color the new color
             */
            setColor: function(color){
                var settings = this.attributes.settings;
                settings.color = color;

                this.set('settings',settings);

                if(this.attributes.labels){
                    this.get('labels').each(function(value,index){
                        value.set('category',this.toJSON());
                    },this);
                }
            },
            
            /**
             * Modify the current url for the annotations collection
             */
            setUrl: function(){
                if(this.get("labels"))
                    this.get("labels").setUrl(this);
            },

            /**
             * @override
             * 
             * Override the default toJSON function to ensure complete JSONing.
             *
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function(){
                var json = $.proxy(Backbone.Model.prototype.toJSON,this)();
                if(!annotationsTool.localStorage)
                    delete json.labels;
                else
                    json.labels = json.labels.toJSON();


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
            },

            save: function(){
                this.attributes.settings = JSON.stringify(this.attributes.settings);
                $.proxy(Backbone.Model.prototype.save,this)();
            }

        });
        
        return Category;
    
});