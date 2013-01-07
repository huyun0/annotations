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

/**
 * A module representing the category model
 * @module Category
 */
define(["jquery",
        "collections/labels",
        "access",
        "backbone",
        "localstorage"],
    
    function($, Labels, ACCESS, Backbone){

        "use strict";
        
        /**
         * @constructor
         * @alias module:Category
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
                has_duration: true,
                labels: new Labels([],this)
            },
            
            /**
             * Constructor
             * @param {Object} attr Object literal containing the model initialion attribute. Should contain a name attribute. 
             */
            initialize: function (attr) {
                var saveChange;
                
                if (!attr || _.isUndefined(attr.name)) {
                    throw "'name' attribute is required";
                }
                
                // Check if the track has been initialized 
                if (!attr.id) {
                    // If local storage, we set the cid as id
                    if (window.annotationsTool.localStorage) {
                        attr.id = this.cid;
                    }
                        
                    this.toCreate = true;
                }

                attr.settings = this.parseJSONString(attr.settings);
                
                if (attr.labels && _.isArray(attr.labels)) {
                    this.attributes.labels  = new Labels(attr.labels, this);
                    delete attr.labels;
                } else if (!attr.labels) {
                    this.attributes.labels  = new Labels([], this);
                } else if (_.isObject(attr.labels) && !attr.labels.url && attr.labels.models) {
                    attr.labels = new Labels(attr.labels.models, this);
                } else {
                    this.attributes.labels = attr.labels;
                    delete attr.labels;
                }

                if (attr.id) {
                    this.attributes.labels.fetch({async:false});
                }
                
                // If localStorage used, we have to save the video at each change on the children
                if (window.annotationsTool.localStorage) {
                    saveChange = function (label) {
                            this.save();
                            this.trigger("change");
                    }
                    this.attributes.labels.bind('change', saveChange, this);
                    this.attributes.labels.bind('remove', saveChange, this);
                }
                
                this.set(attr);
            },
            
            /**
             * Parse the attribute list passed to the model
             * @param  {Object} data Object literal containing the model attribute to parse.
             * @return {Object}  The object literal with the list of parsed model attribute.
             */
            parse: function(data) {
                var attr = data.attributes ? data.attributes : data;

                attr.created_at = attr.created_at != null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at != null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at != null ? Date.parse(attr.deleted_at): null;

                if (attr.settings) {
                    attr.settings = this.parseJSONString(attr.settings);
                }

                // Parse tags if present
                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }
                
                if (attr.category) {
                    attr.category = this.parseJSONString(attr.category.settings);
                }

                if (annotationsTool.localStorage && _.isArray(attr.labels)) {
                    attr.labels = new Labels(attr.labels,this);
                }

                if (!annotationsTool.localStorage &&  attr.scale_id && (_.isNumber(attr.scale_id) || _.isString(attr.scale_id))) {
                    attr.scale = annotationsTool.video.get("scales").get(attr.scale_id);
                }

                if(data.attributes) {
                    data.attributes = attr;
                } else {
                    data = attr;
                }

                return data;
            },
            
            /**
             * Validate the attribute list passed to the model
             * @param  {Object} data Object literal containing the model attribute to validate.
             * @return {String}  If the validation failed, an error message will be returned.
             */
            validate: function(attr){
                var tmpCreated,
                    labels,
                    self = this;
                
                if (attr.id) { 
                    if (this.get('id') !== attr.id) {
                        this.id = attr.id;
                        this.setUrl();
                    }
                }

                if (!this.ready && attr.labels && attr.labels.url && (attr.labels.length) === 0) {
                    attr.labels.fetch({
                        async:false,
                        success: function () {
                            self.ready = true;
                        }
                    });
                
                }
                
                if (attr.description && !_.isString(attr.description)) {
                    return "'description' attribute must be a string";
                }
                
                if (attr.settings && (!_.isObject(attr.settings) && !_.isString(attr.settings))) {
                    return "'description' attribute must be a string or a JSON object";
                }

                if (attr.tags && _.isUndefined(this.parseJSONString(attr.tags))) {
                    return "'tags' attribute must be a string or a JSON object";
                }
                
                if (attr.access &&  !_.include(ACCESS,attr.access)) {
                    return "'access' attribute is not valid.";
                }
                
                if (attr.created_by && !(_.isNumber(attr.created_by) || attr.created_by instanceof User)) {
                    return "'created_by' attribute must be a number or an instance of 'User'";
                }
                
                if (attr.updated_by && !(_.isNumber(attr.updated_by) || attr.updated_by instanceof User)) {
                    return "'updated_by' attribute must be a number or an instance of 'User'";
                }
                
                if (attr.deleted_by && !(_.isNumber(attr.deleted_by) || attr.deleted_by instanceof User)) {
                    return "'deleted_by' attribute must be a number or an instance of 'User'";
                }
                
                if (attr.created_at) {
                    if ((tmpCreated=this.get('created_at')) && tmpCreated!==attr.created_at) {
                        return "'created_at' attribute can not be modified after initialization!";
                    } else if (!_.isNumber(attr.created_at)) {
                        return "'created_at' attribute must be a number!";
                    }
                }
        
                if (attr.updated_at && !_.isNumber(attr.updated_at)) {
                    return "'updated_at' attribute must be a number!";
                }

                if(attr.deleted_at && !_.isNumber(attr.deleted_at)) {
                    return "'deleted_at' attribute must be a number!";
                }

                if (attr.labels) {
                    attr.labels.each(function(value,index){
                        var parseValue = value.parse({category: this.toJSON()});
                        
                        if(parseValue.category) {
                            parseValue = parseValue.category;
                        }

                        value.category = parseValue;
                    },this);
                }
            },

            /**
             * Change category color
             * @method 
             * @param  {String} color the new color
             */
            setColor: function(color){
                var settings = this.attributes.settings;
                settings.color = color;

                this.set('settings',settings);
            },
            
            /**
             * Modify the current url for the annotations collection
             */
            setUrl: function(){
                if(this.get("labels"))
                    this.get("labels").setUrl(this);
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             *
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function(){
                var json = Backbone.Model.prototype.toJSON.call(this);
                delete json.labels;

                if(this.attributes.scale){
                    if (this.attributes.scale.attributes) {
                        json.scale_id = this.attributes.scale.get("id");
                    } else {
                        json.scale_id = this.attributes.scale.id;
                    }
                }

                return json;
            },

            /**
             * Parse the given parameter to JSON if given as String
             * @param  {String} parameter the parameter as String
             * @return {JSON} parameter as JSON object
             */
            parseJSONString: function(parameter) {
                if (parameter && _.isString(parameter)) {
                    try {
                        parameter = JSON.parse(parameter);
                        
                    } catch (e) {
                        console.warn("Can not parse parameter '"+parameter+"': "+e);
                        return undefined; 
                    }
                } else if (!_.isObject(parameter) || _.isFunction(parameter)) {
                    return undefined;
                }

                return parameter;
            },

            save: function(options){
                this.attributes.settings = JSON.stringify(this.attributes.settings);

                Backbone.Model.prototype.save.call(this,options);
            }

        });
        
        return Category;
    
});