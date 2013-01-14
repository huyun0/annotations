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
        "access",
        "backbone"],
       
    function($, ACCESS, Backbone){
    
        /**
         * scale value model
         * @class
         */
        var ScaleValue = Backbone.Model.extend({
            
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
                
                if(!attr  || _.isUndefined(attr.name) || attr.name == "" ||
                   _.isUndefined(attr.value) || !_.isNumber(attr.value) ||
                   _.isUndefined(attr.order) || !_.isNumber(attr.order))
                    throw "'name, value, order' attributes are required";

                if(!attr.id){
                    this.toCreate = true;
                }
                
                // Check if the track has been initialized 
                if(!attr.id){
                    // If local storage, we set the cid as id
                    if(window.annotationsTool.localStorage)
                        this.set({id:this.cid});
                        
                    this.toCreate = true;
                }
                
                this.set(attr);
            },
            
            parse: function(attr) {
                attr.created_at = attr.created_at != null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at != null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at != null ? Date.parse(attr.deleted_at): null;
                return attr;
            },
            
            validate: function(attr){
                var tmpCreated;
                
                if(attr.id){
                    if(this.get('id') != attr.id){
                        attr['id'] = this.cid;
                    }
                }
                
                if(attr.name && !_.isString(attr.name))
                    return "'name' attribute must be a string";
                
                if(attr.value && !_.isNumber(attr.value))
                    return "'value' attribute must be a number";
                
                if(attr.order && !_.isNumber(attr.order))
                    return "'order' attribute must be a number";
                
                if(attr.access && !_.include(ACCESS,attr.access))
                    return "'access' attribute is not valid.";
                
                if(attr.created_at){
                    if((tmpCreated=this.get('created_at')) && tmpCreated!==attr.created_at)
                        return "'created_at' attribute can not be modified after initialization!";
                    if(!_.isNumber(attr.created_at))
                        return "'created_at' attribute must be a number!";
                }
        
                if(attr.updated_at && !_.isNumber(attr.updated_at))
                    return "'updated_at' attribute must be a number!";

                if(attr.deleted_at && !_.isNumber(attr.deleted_at))
                    return "'deleted_at' attribute must be a number!";
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
                if (json.scale && json.scale.attributes) {
                    json.scale = this.attributes.scale.toJSON();
                }
                return json;
            },
        });
        
        return ScaleValue;
    
});