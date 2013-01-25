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
 * A module representing the label model
 * @module Label
 */
define(["jquery",
        "access",
        "backbone"],
       
    function($, ACCESS, Backbone){
    
        /**
         * @constructor
         * @alias module:Comment
         */
        var Comment = Backbone.Model.extend({
            
            defaults: {
                access: ACCESS.PUBLIC,
                created_at: null,
                created_by: null,
                updated_at: null,
                updated_by: null,
                deleted_at: null,
                deleted_by: null
            },
            
            /**
             * Constructor
             * @param {Object} attr Object literal containing the model initialion attribute. 
             *                      Must contain at least the following attribute: text and annotation.
             */
            initialize: function(attr){
                if(!attr || _.isUndefined(attr.text))
                    throw "'text' attribute is required";
                
                // Check if the comment has been initialized 
                if(!attr.id){
                    // If local storage, we set the cid as id
                    if(window.annotationsTool.localStorage)
                        attr['id'] = this.cid;
                        
                    this.toCreate = true;
                }
                
                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }

                this.set(attr);
            },
            
            parse: function(data) {                 
                var attr = data.attributes ? data.attributes : data;

                attr.created_at = attr.created_at != null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at != null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at != null ? Date.parse(attr.deleted_at): null;
                
                // Parse tags if present
                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }

                if(data.attributes)
                    data.attributes = attr;
                else
                    data = attr;

                return data;
            },
            
            validate: function(attr){
                var tmpCreated;
                
                if(attr.id){
                    if(this.get('id') != attr.id){
                        this.id = attr.id;
                        this.attributes.id = attr.id;
                        this.toCreate = false;
                    }
                }
                
                if(attr.text &&  !_.isString(attr.text))
                    return "'text' attribute must be a string!";
                
                if (attr.tags && _.isUndefined(this.parseJSONString(attr.tags))) {
                    return "'tags' attribute must be a string or a JSON object";
                }
                
                if(attr.access && !_.include(ACCESS,attr.access))
                    return "'access' attribute is not valid.";
                
                if(!_.isNull(attr.created_at)){
                    if((tmpCreated=this.get('created_at')) && tmpCreated!==attr.created_at)
                        return "'created_at' attribute can not be modified after initialization!";
                    if(!_.isNumber(attr.created_at))
                        return "'created_at' attribute must be a number!";
                }
        
                if(!_.isNull(attr.updated_at)){
                    if(!_.isNumber(attr.updated_at))
                        return "'updated_at' attribute must be a number!";
                }

                if(!_.isNull(attr.deleted_at)){
                    if(!_.isNumber(attr.deleted_at))
                        return "'deleted_at' attribute must be a number!";
                }
                
            },
            
            /**
             * Parse the given parameter to JSON if given as String
             * @alias module:models-video.Video#parseJSONString
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
                if (json.tags) {
                    json.tags = JSON.stringify(json.tags);
                }
                return json;
            }
            
        });
        
        return Comment;
        
}); 