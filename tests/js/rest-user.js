require(['domReady',
         'jquery',
         'require',
	 'models/user',
         'collections/users',
         'backbone-annotations-sync',
         'order!underscore',
         'order!backbone',
         'order!libs/tests/qunit'],
                    
        function(domReady, $, require, User, Users, AnnotationSync){
            domReady(function(){
                QUnit.config.autostart = false;
                
                var user, base_user, users, config;
                
                users = new Users();
                user  = new User({user_extid:'testid',nickname:'pinguin', email: "test@dot.com"}); 
                users.add(user);
                Backbone.sync = AnnotationSync;
                base_user = user.clone();
                
                module("User");

                test("Save user",function(){
                    stop();
                    
                    AnnotationSync('update',user,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    ok(user.id!==undefined,"Id has been set");
                                    window.annotationsTool.user = user;
                                    start();
                                }
                    });
                })
                
                test("Get user",function(){
                    stop();
                    
                    AnnotationSync('read',user,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got user in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.user_extid, user.get("user_extid"), "Extid is correct");
                                    equal(data.nickname, user.get("nickname"), "Nickname is correct");
                                    equal(data.email, user.get("email"), "Email is correct");
                                    start();
                                }
                    });
                });
                
                 
            });
            
});