define(["jquery",
        "models/user",
        "order!underscore",
        "order!backbone",
        "order!localstorage"],
       
       function($,User){
    
        /**
         * Users collection
         * @class
         */
        var Users = Backbone.Collection.extend({
            model: User,
            localStorage: new Backbone.LocalStorage("Users"),
            
            initialize: function(){
                this.url = window.annotationsTool.restEndpointsUrl + "/users";
            },
            
            parse: function(resp, xhr) {
              return resp.users;
            }
        });
        
        return Users;

});
    
    