define(["jquery","models/user","underscore","backbone","localstorage"],function($,User){
    
    /**
     * Users collection
     * @class
     */
    var Users = Backbone.Collection.extend({
        model: User,
        localStorage: new Backbone.LocalStorage("Users")
    });
    
    return Users;

});
    
    