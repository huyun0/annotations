define(["jquery","access","underscore","backbone"],function($,ACCESS){
    
    /**
     * Track model
     * @class
     */
    var Track = Backbone.Model.extend({
        id: 0,
        name: "",
        description: "",
        settings: {},
        
        // Logs
        created_at: 0,
        created_by: null,
        
        defaults: {
            access: ACCESS.PUBLIC    
        },
        
        initialize: function(attr){
            if(!attr || _.isUndefined(attr.name))
                throw "'name' attribute is required";
            
            var newAttr = {};
            $.extend(newAttr,{created_at:(new Date()).getTime(),id:this.cid},attr);
            this.set(newAttr);  
        },
        
        validate: function(attr){
            
            if(attr.id){
                if((tmpId=this.get('id')) && tmpId!==attr.id)
                    return "'id' attribute can not be modified after initialization!";
                //if(!_.isNumber(attr.id))
                //    return "'id' attribute must be a number!";
            }
            
            if(attr.created_at){
                if((tmpCreated=this.get('created_at')) && tmpCreated!==attr.created_at)
                    return "'created_at' attribute can not be modified after initialization!";
                if(!_.isNumber(attr.created_at))
                    return "'created_at' attribute must be a number!";
            }
            
            if(attr.description && !_.isString(attr.description))
                return "'description' attribute must be a string";
            
            if(attr.settings && !_.isObject(attr.settings))
                return "'description' attribute must be an JSON Object";
            
            if(attr.access &&  !_.include(ACCESS,attr.access))
                return "'access' attribute is not valid.";
            
            if(attr.created_by && !(_.isNumber(attr.created_by) || attr.created_by instanceof User))
                return "'created_by' attribute must be a number or an instance of 'User'";
            
        } 
    });
    
    return Track;
    
});