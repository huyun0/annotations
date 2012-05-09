require(['domReady',
         'jquery',
	 'models/user',
         'collections/users',
         'backbone-annotations-sync',
         'order!underscore',
         'order!backbone',
         'order!libs/tests/qunit'],
                    
        function(domReady,$,User, Users, AnnotationSync){
        
            domReady(function(){
                QUnit.config.autostart = false;
                
                var user, base_user, users, config;
                
                users = new Users();
                user  = new User({user_extid:'testid',user_id:'testid',nickname:'pinguin', email: "test@dot.com"}); 
                users.add(user);
                Backbone.sync = AnnotationSync;
                base_user = user.clone();
                config = {
                    restEndpointUrl: window.restUrl
                };
                
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
                                    
                                    ok(user.get('id')!==undefined,"Id has been set");
                                    start();
                                }
                    },{
                    restEndpointUrl: window.restUrl});

                })
                
                test("Get user",1,function(){
                    stop();
                    
                    AnnotationSync('read',user,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Got user in json");
                                    start();
                                }
                    },{restEndpointUrl: window.restUrl});
                })
                
                 
            });
            
});