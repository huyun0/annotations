require(['domReady',
         'jquery',
         'require',
	 'models/user',
         'collections/users',
         'tests/backbone-annotations-sync-test',
         'order!underscore',
         'order!backbone',
         'order!libs/tests/qunit'],
                    
        function(domReady, $, require, User, Users, AnnotationsSync){
            domReady(function(){
                QUnit.config.autostart = false;
                Backbone.sync = AnnotationsSync;
                
                var user, users;
                
                users = new Users();
                var userExtId = window.annotationsTool.getUserExtId();
                user = new User({user_extid:userExtId,nickname:'pinguin', email: "test@dot.com"}); 
                users.add(user);
                
                module("User");

                test("Save user",function(){
                    stop();
                    
                    AnnotationsSync('update',user,{
                        error: function(error){
                            ok(false, error);
                            start();
                        },
                        
                        success: function(data){
                            ok(true, "Saved successfully");
                            ok(user.id!==undefined,"Id has been set");
                            start();
                        }
                    });
                })
                
                test("Get user",function(){
                    stop();
                    
                    AnnotationsSync('read',user,{
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
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by, user.get('id'), "Created_by user id is correct");
                                    equal(data.updated_at, null, "Updated_at date is correct (null)");
                                    equal(data.updated_by, null, "Updated_by user is correct (null)");
                                    start();
                                }
                    });
                });
                
                test("Delete user",1,function(){
                    stop();
                    AnnotationsSync('delete',user,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "User deleted.");
                                    start();
                                }
                    });
                })
                
                test("Get deleted user",1,function(){
                    stop();
                    AnnotationsSync('read',user,{
                                error: function(error){
                                    ok(true, "Try to get user but should not exist: "+error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(false, "Got deleted user");
                                    start();
                                }
                    });
                })
                
                 /* USERS tests */
                module("Users", {
                    
                    setup: function(){
                        users.create({user_extid:'user1', nickname:'pinguin1', email: "test@dot.com"});
                        users.create({user_extid:'user2', nickname:'pinguin2', email: "test@dot.com"});
                        users.create({user_extid:'user3', nickname:'pinguin3', email: "test@dot.com"});
                        users.create({user_extid:'user4', nickname:'pinguin4', email: "test@dot.com"});
                    },
                
                    teardown: function() {                        
                        users.at(1).destroy();
                        users.at(1).destroy();
                        users.at(1).destroy();
                        users.at(1).destroy();
                    }
                });
                
                test("Get all users", function(){
                    stop();
                
                    AnnotationsSync('read',users,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Get all users successfully");
                                    ok(_.isArray(data.users), "Got all users");
                                    equal(data.users.length, 4, "Four users are successfully returned");
                                    start();
                                }
                    });
                })
            });
            
});