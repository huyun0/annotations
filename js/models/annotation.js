define(["jquery","models/user","access","underscore","backbone"],function($,User, ACCESS){
    
    /**
     * Annotation model
     * @class
     */
    var Annotation = Backbone.Model.extend({
        id: 0,
        text: "",
        start: 0.0,
        duration: 0.0,
        
        defaults: {
            access: ACCESS.PUBLIC    
        },
        
        // Logs
        created_at: 0,
        created_by: null,
        
        initialize: function(attr){
            if(!attr || _.isUndefined(attr.start))
                throw "'start' attribute is required";
            
            var newAttr = {};
            $.extend(newAttr,{created_at:(new Date()).getTime(),id:this.cid},attr);
            
            if(newAttr.created_by && _.isObject(attr.created_by))
                newAttr.created_by = new User(attr.created_by);
                
            this.set(newAttr);  
        },
        
        validate: function(attr){
            
            if(attr.id){
                if((tmpId=this.get('id')) && tmpId!==attr.id)
                    return "'id' attribute can not be modified after initialization!";
                if(!_.isNumber(attr.created_at))
                    return "'id' attribute must be a number!";
            }
            
            if(attr.created_at){
                if((tmpCreated=this.get('created_at')) && tmpCreated!==attr.created_at)
                    return "'created_at' attribute can not be modified after initialization!";
                if(!_.isNumber(attr.created_at))
                    return "'created_at' attribute must be a number!";
            }
            
            if(attr.start &&  !_.isNumber(attr.start))
                return "'start' attribute must be a number!";
            
            if(attr.text &&  !_.isString(attr.text))
                return "'text' attribute must be a string!";
            
            if(attr.duration &&  (!_.isNumber(attr.duration) || (_.isNumber(attr.duration) && attr.duration < 0)))
                return "'duration' attribute must be a positive number";
            
            if(attr.access &&  !_.include(ACCESS,attr.access))
                return "'access' attribute is not valid.";
            
            if(attr.created_by && !(_.isNumber(attr.created_by) || attr.created_by instanceof User))
                return "'created_by' attribute must be a number or an instance of 'User'";
            
        } 
    });
    
    return Annotation;
    
});