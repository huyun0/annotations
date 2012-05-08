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
            url: "/users",
            localStorage: new Backbone.LocalStorage("Users")
        });
        
        return Users;

});
    
    