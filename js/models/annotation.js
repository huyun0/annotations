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
                duration: 0
            },
            
            // Logs

            
            initialize: function(attr){
                if(!attr || _.isUndefined(attr.start))
                    throw "'start' attribute is required";
                
                // Check if the category has been initialized 
                if(!attr.id){
                    // If local storage, we set the cid as id
                    if(window.annotationsTool.localStorage)
                        attr['id'] = this.cid;
                        
                    this.toCreate = true;
                }
                
                // Add backbone events to the model 
                _.extend(this, Backbone.Events);
                
                this.set(attr);
            },
            
            parse: function(data) {    
                var attr = data.attributes ? data.attributes : data;

                attr.created_at = attr.created_at != null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at != null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at != null ? Date.parse(attr.deleted_at): null;

                if(!annotationsTool.localStorage &&  attr.label_id && (_.isNumber(attr.label_id) || _.isString(attr.label_id))){
                    var categories = annotationsTool.video.get('categories');
                    var tempLabel;

                    categories.each(function(cat, index){
                        if(label)
                            return;

                        if((tempLabel = cat.attributes.labels.get(attr.label_id)))
                            label = tempLabel;

                    },this);

                    attr.label = label;
                }

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
                        this.trigger('ready',this);
                    }
                }
                
                if(attr.start &&  !_.isNumber(attr.start))
                    return "'start' attribute must be a number!";
                
                if(attr.text &&  !_.isString(attr.text))
                    return "'text' attribute must be a string!";
                
                if(attr.duration &&  (!_.isNumber(attr.duration) || (_.isNumber(attr.duration) && attr.duration < 0)))
                    return "'duration' attribute must be a positive number";
                
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
                return json;
            },

            save: function(){
                if(!annotationsTool.localStorage && this.attributes.label){
                    if(this.attributes.label.id)
                        this.attributes.label_id = this.attributes.label.id;
                    else if(this.attributes.label.attributes)
                        this.attributes.label_id = this.attributes.label.get('id');
                }

                $.proxy(Backbone.Model.prototype.save,this)();
            }
        });
        
        return Annotation;
    
}); 