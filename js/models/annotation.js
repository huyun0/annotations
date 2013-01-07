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
 * A module representing the annotation model
 * @module models-Annotation
 * @requires jQuery
 * @requires underscore
 * @requires models-user
 * @requires ACCESS
 * @requires backbone
 */
define(["jquery",
        "models/user",
        "access",
        "backbone",
        "localstorage"],
       
    function($,User, ACCESS, Backbone){

        "use strict";
    
        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @memberOf module:models-annotation
         * @alias Annotation
         */
        var Annotation = Backbone.Model.extend({
            
            /** 
             * Default models value 
             * @alias module:models-track.Track#defaults
             */
            defaults: {
                access: ACCESS.PRIVATE,
                start: 0,
                duration: 5
            },
            
            /**
             * Constructor
             * @alias module:models-track.Track#initialize
             * @param {Object} attr Object literal containing the model initialion attribute. 
             */
            initialize: function(attr){ 

                if (!attr || _.isUndefined(attr.start)) {
                    throw "'start' attribute is required";
                }
                
                // Check if the category has been initialized 
                if (!attr.id) {
                    // If local storage, we set the cid as id
                    if (window.annotationsTool.localStorage) {
                        attr.id = this.cid;
                    }
                        
                    this.toCreate = true;
                }

                // If localStorage used, we have to save the video at each change on the children
                if (window.annotationsTool.localStorage){
                    if (!attr.created_by) {
                        attr.created_by = annotationsTool.user.get("id");
                        attr.created_by_nickname = annotationsTool.user.get("nickname");
                    }
                }
                
                // Add backbone events to the model 
                _.extend(this, Backbone.Events);
                
                this.set(attr);
            },
            
            /**
             * Parse the attribute list passed to the model
             * @alias module:models-track.Track#parse
             * @param  {Object} data Object literal containing the model attribute to parse.
             * @return {Object}  The object literal with the list of parsed model attribute.
             */
            parse: function(data) {    
                var attr = data.attributes ? data.attributes : data,
                    tempSettings,
                    categories,
                    tempLabel,
                    label;

                attr.created_at = attr.created_at !== null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at !== null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at !== null ? Date.parse(attr.deleted_at): null;

                // Parse tags if present
                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }

                if (attr.scaleValue) {
                    attr.scalevalue = attr.scaleValue;
                    delete attr.scaleValue;
                }

                if (annotationsTool.user.get("id") === attr.created_by) {
                    attr.isMine = true;
                } else {
                    attr.isMine = false;
                }

                if (attr.label) {
                    if (attr.label.category && (tempSettings = this.parseJSONString(attr.label.category.settings))) {
                        attr.label.category.settings = tempSettings;
                    } 

                    if ((tempSettings = this.parseJSONString(attr.label.settings))) {
                        attr.label.settings = tempSettings;
                    }
                }

                if (!annotationsTool.localStorage &&  attr.label_id && (_.isNumber(attr.label_id) || _.isString(attr.label_id))) {
                    categories = annotationsTool.video.get('categories');

                    categories.each(function(cat, index){

                        if((tempLabel = cat.attributes.labels.get(attr.label_id))){
                            label = tempLabel;
                            return true;
                        }

                    },this);

                    attr.label = label;
                }

                if (!annotationsTool.localStorage &&  attr.scalevalue) {
                    attr.scaleValue = attr.scalevalue;
                }

                if (data.attributes) {
                    data.attributes = attr;
                } else {
                    data = attr;
                }

                return data;
            },
            
            /**
             * Validate the attribute list passed to the model
             * @alias module:models-track.Track#validate
             * @param  {Object} data Object literal containing the model attribute to validate.
             * @return {String}  If the validation failed, an error message will be returned.
             */
            validate: function(attr){
                var tmpCreated;
                
                if (attr.id) {
                    if (this.get('id') !== attr.id) {
                        this.id = attr.id;
                        this.attributes.id = attr.id;
                        this.toCreate = false;
                        this.trigger('ready',this);
                    }
                }

                if (!annotationsTool.localStorage && attr.label) {
                    if (attr.label.id) {
                        this.attributes.label_id = attr.label.id;
                    } else if (attr.label.attributes) {
                        this.attributes.label_id = attr.label.get('id');
                    }
                }
                
                if (attr.start &&  !_.isNumber(attr.start)) {
                    return "'start' attribute must be a number!";
                }

                if (attr.tags && _.isUndefined(this.parseJSONString(attr.tags))) {
                    return "'tags' attribute must be a string or a JSON object";
                }
                
                if (attr.text &&  !_.isString(attr.text)) {
                    return "'text' attribute must be a string!";
                }
                
                if (attr.duration &&  (!_.isNumber(attr.duration) || (_.isNumber(attr.duration) && attr.duration < 0))) {
                    return "'duration' attribute must be a positive number";
                }
                
                if (attr.access && !_.include(ACCESS,attr.access)) {
                    return "'access' attribute is not valid.";
                }
            
                if (attr.created_at) {
                    if ((tmpCreated=this.get('created_at')) && tmpCreated !== attr.created_at) {
                        return "'created_at' attribute can not be modified after initialization!";
                    } else if (!_.isNumber(attr.created_at)) {
                        return "'created_at' attribute must be a number!";
                    }
                }
        
                if (attr.updated_at && !_.isNumber(attr.updated_at)) {
                    return "'updated_at' attribute must be a number!";
                }

                if (attr.deleted_at && !_.isNumber(attr.deleted_at)) {
                    return "'deleted_at' attribute must be a number!";
                }
                
            },

            /**
             * Parse the given parameter to JSON if given as String
             * @alias module:models-track.Track#parseJSONString
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

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-track.Track#toJSON
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function(){
                var json = $.proxy(Backbone.Model.prototype.toJSON,this)();
                if (json.label && json.label.toJSON) {
                    json.label = json.label.toJSON();
                }

                if (json.scalevalue){

                    if (json.scalevalue.attributes) {
                        json.scale_value_id = json.scalevalue.attributes.id;
                    } else if (json.scalevalue.id) {
                        json.scale_value_id = json.scalevalue.id;
                    }
                }

                delete json.annotations;

                return json;
            }
        });
        
        return Annotation;
    
}); 