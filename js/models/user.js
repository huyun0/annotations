define(["jquery","underscore","backbone"],function($){
    
    /**
     * User model
     * @class
     */
    var User = Backbone.Model.extend({
        id: 0,
        user_id: "",
        nickname: "",
        email: "",
        
        initialize: function(attr){
            if(_.isUndefined(attr.user_id) || _.isUndefined(attr.nickname))
                throw "'user_id' and 'nickanme' attributes are required";
            
            this.set(attr); 
        },
        
        validateEmail: function(email) { 
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        },
        
        validate: function(attr){
            if(attr.id){
                if((tmpId=this.get('id')) && tmpId!==attr.id)
                    return "'id' attribute can not be modified after initialization!";
                if(!_.isNumber(attr.created_at))
                    return "'id' attribute must be a number!";
            }
            
            if(_.isUndefined(attr.user_id) || _.isUndefined(attr.nickname))
                return "'user_id' and 'nickanme' attributes are required";

            
            if(attr.email && !this.validateEmail(attr.email))
                return "Given email is not valid!";   
        }
        
    });
    
    return User;
    
});