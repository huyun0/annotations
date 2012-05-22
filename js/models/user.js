define(["order!jquery",
        "order!access",
        "order!underscore",
        "order!backbone"],
       
    function($, ACCESS){
    
        /**
         * User model
         * @class
         */
        var User = Backbone.Model.extend({
            
            defaults: {
                access: ACCESS.PUBLIC,
                created_at: null,
                created_by: null,
                updated_at: null,
                updated_by: null,
                deleted_at: null,
                deleted_by: null
            },
            
            initialize: function(attr){
                if(_.isUndefined(attr.user_extid) || attr.user_extid == "" ||
                   _.isUndefined(attr.nickname) || attr.nickname == "")
                    throw "'user_extid' and 'nickanme' attributes are required";
                
                this.set(attr);
                
                if(!attr.id){
                    this.toCreate = true;
                }
                
                // Define that all post operation have to been done through PUT method
                // see in wiki
                this.noPOST = true;
                //    this.set({id:this.cid});
            },
            
            /*parse: function(response, xhr) {
                // Get the id of the created resource through the url
                var newId = parseInt(_.last(location.split("/")));
                                        
                // Set the resource id and return  
                var attrs = {};
                attrs.id = newId;
                return attrs;
            },*/
            
            parse: function(attr) {    
                attr.created_at = attr.created_at != null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at != null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at != null ? Date.parse(attr.deleted_at): null;
                return attr;
            },
            
            validate: function(attr){
                /*if(attr.id){
                    if((tmpId=this.get('id')) && tmpId!==attr.id)
                        return {attribute: "id", message: "'id' attribute can not be modified after initialization!"};
                    if(!_.isNumber(attr.created_at))
                        return {attribute: "created_at", message: "'id' attribute must be a number!"};
                }*/
                
                if(_.isUndefined(attr.user_extid) || (!_.isString(attr.nickname) && !_.isNumber(attr.user_extid)))
                    return {attribute: "user_extid", message: "'user_extid' must be a valid string or number."};
                
                if(_.isUndefined(attr.nickname) || !_.isString(attr.nickname))
                    return {attribute: "nickname", message: "'nickanme' must be a valid string!"};
    
                if(attr.email && !User.validateEmail(attr.email))
                    return {attribute: "email", message: "Given email is not valid!"};
                
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
        
                if(attr.updated_at){
                    if(!_.isNumber(attr.updated_at))
                        return "'updated_at' attribute must be a number!";
                }

                if(attr.deleted_at){
                    if(!_.isNumber(attr.deleted_at))
                        return "'deleted_at' attribute must be a number!";
                }
            }
            
        },
        // Class properties and functions
        {
            /**
             * Check if the email address has a valid structure
             *
             * @param {String} email the email address to check
             * @return {Boolean} true if the address is valid
             */
            validateEmail: function(email) { 
                var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(email);
            }
        });
        
        return User;
    
});