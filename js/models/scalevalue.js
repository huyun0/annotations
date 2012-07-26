define(["jquery",
        "order!access",
        "order!underscore",
        "order!backbone"],
       
    function($, ACCESS){
    
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
        
                if(attr.updated_at && !_.isNumber(attr.updated_at))
                    return "'updated_at' attribute must be a number!";

                if(attr.deleted_at && !_.isNumber(attr.deleted_at))
                    return "'deleted_at' attribute must be a number!";
            }
        });
        
        return ScaleValue;
    
});