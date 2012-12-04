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
        "order!models/user",
        "order!access",
        "order!underscore",
        "order!backbone"],
       
    function($,User, ACCESS){

        "use strict";
    
        /**
         * Annotation model
         * @class
         */
        var Annotation = Backbone.Model.extend({
            
            defaults: {
                access: ACCESS.PRIVATE,
                created_at: null,
                created_by: null,
                updated_at: null,
                updated_by: null,
                deleted_at: null,
                deleted_by: null,
                start: 0,
                duration: 5
            },
            
            // Logs

            
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
                
                // Add backbone events to the model 
                _.extend(this, Backbone.Events);
                
                this.set(attr);
            },
            
            parse: function(data) {    
                var attr = data.attributes ? data.attributes : data;

                attr.created_at = attr.created_at !== null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at !== null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at !== null ? Date.parse(attr.deleted_at): null;

                var tempSettings;

                // Parse tags if present
                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }

                if (attr.label) {
                    if (attr.label.category && (tempSettings = this.parseJSONString(attr.label.category.settings))) {
                        attr.label.category.settings = tempSettings;
                    } 

                    if (tempSettings = this.parseJSONString(attr.label.settings)) {
                        attr.label.settings = tempSettings;
                    }
                }

                if (!annotationsTool.localStorage &&  attr.label_id && (_.isNumber(attr.label_id) || _.isString(attr.label_id))) {
                    var categories = annotationsTool.video.get('categories');
                    var tempLabel, label;

                    categories.each(function(cat, index){

                        if((tempLabel = cat.attributes.labels.get(attr.label_id))){
                            label = tempLabel;
                            return true;
                        }

                    },this);

                    attr.label = label;
                }

                if(!annotationsTool.localStorage &&  attr.scale_value)
                    attr.scaleValue = attr.scale_value;

                if(data.attributes)
                    data.attributes = attr;
                else
                    data = attr;

                return data;
            },
            
            validate: function(attr){
                var tmpCreated;
                
                if (attr.id) {
                    if (this.get('id') !== attr.id) {
                        this.id = attr.id;
                        this.attributes['id'] = attr.id;
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
            
                if (!_.isNull(attr.created_at)) {
                    if ((tmpCreated=this.get('created_at')) && tmpCreated!==attr.created_at) {
                        return "'created_at' attribute can not be modified after initialization!";
                    } else if (!_.isNumber(attr.created_at)) {
                        return "'created_at' attribute must be a number!";
                    }
                }
        
                if (!_.isNull(attr.updated_at) && !_.isNumber(attr.updated_at)) {
                    return "'updated_at' attribute must be a number!";
                }

                if (!_.isNull(attr.deleted_at) && !_.isNumber(attr.deleted_at)) {
                    return "'deleted_at' attribute must be a number!";
                }
                
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

            /**
             * @override
             * 
             * Override the default toJSON function to ensure complete JSONing.
             *
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function(){
                var json = $.proxy(Backbone.Model.prototype.toJSON,this)();
                if(json.label && json.label.toJSON)
                    json.label = json.label.toJSON();

                if(json.scaleValue){
                    if(json.scaleValue.attributes)
                        json.scale_value_id = json.scaleValue.attributes.id
                    else if(json.scaleValue.id)
                        json.scale_value_id = json.scaleValue.id;
                }

                delete json.annotations;

                return json;
            }
        });
        
        return Annotation;
    
}); 