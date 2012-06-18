define(["jquery",
        "order!access",
        "order!underscore",
        "order!backbone"],
       
    function($, ACCESS){
    
        /**
         * scale model
         * @class
         */
        var Scale = Backbone.Model.extend({
            
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
                if(!attr  || _.isUndefined(attr.name) || attr.name == "")
                    throw "'name' attribute is required";
                
                this.set(attr);
                
                if(!attr.id){
                    this.toCreate = true;
                }
            },
            
            parse: function(attr) {
                attr.created_at = attr.created_at != null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at != null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at != null ? Date.parse(attr.deleted_at): null;
                return attr;
            },
            
            validate: function(attr){
                
                if(attr.id){
                    if((tmpId=this.get('id')) && tmpId!==attr.id){
                        this.id = attr.id;
                        this.setUrl();
                    }
                    //    return "'id' attribute can not be modified after initialization!";
                    //if(!_.isNumber(attr.id))
                    //    return "'creat attribute must be a number!";
                }
                
                if(attr.name && !_.isString(attr.name))
                    return "'name' attribute must be a string";
                
                if(attr.description && !_.isString(attr.description))
                    return "'description' attribute must be a string";
                
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
        
        return Scale;
    
});