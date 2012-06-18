require(['domReady',
         'jquery',
         'models/user',
         'collections/users',
	 'models/video',
         'collections/videos',
         'models/scale',
         'collections/scales',
         'models/scalevalue',
         'collections/scalevalues',
         'tests/backbone-annotations-sync-test',
         'order!underscore',
         'order!backbone',
         'order!libs/tests/qunit'],
                    
        function(domReady, $, User, Users, Video, Videos, Scale, Scales, ScaleValue, ScaleValues, AnnotationsSync){
        
            domReady(function(){
                QUnit.config.autostart = false;
                Backbone.sync = AnnotationsSync;
                
                var videos, videos, users, user, scales, scale, scale2, scaleValues, scaleValue, scaleValue2;
                var isVideoLoaded, isUserLoaded, isScaleLoaded, isScaleValueLoaded = false;
                
                Backbone.sync = AnnotationsSync;
                
                var loadUser = function(){
                    users = new Users();
                    var userExtId = window.annotationsTool.getUserExtId();
                    users.create({user_extid:userExtId,nickname:'pinguin', email: "test@dot.com"});
                    user = users.at(0);
                    window.annotationsTool.user = user;
                    isUserLoaded = true;
                }
                
                var loadVideo = function(){
                    videos = new Videos();
                    videos.create({video_extid:'matterhorn123'});
                    video = videos.at(0);
                    isVideoLoaded = true;
                };
                
                var loadScale = function(){
                    scales = new Scales(video);
                    scales.add({name:'quality',description:'the quality'});
                    scale = scales.at(0);
                    isScaleLoaded = true;
                };
                
                var loadScaleValue = function() {
                    scaleValues = new ScaleValues(scale);
                    scaleValues.add({name:'schwach',value:0.5,order:1});
                    scaleValue = scaleValues.at(0);
                    isScaleValueLoaded = true;
                }
                
                /* SCALE tests */
                module("Scale", { setup : function(){
                        if(!isUserLoaded)loadUser();
                        if(!isVideoLoaded)loadVideo();
                        if(!isScaleLoaded)loadScale();
                    }
                });
                
                test("Save scale",function(){
                    stop();
                    AnnotationsSync('create',scale,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    ok(scale.get('id')!==undefined,"Id has been set");
                                    start();
                                }
                    });
                })
                
                test("Save scale 2",function(){
                    stop();
                    scales.add({name: "Test2", description:'test scale2'});
                    scale2 = scales.at(1);
                    AnnotationsSync('update',scale2,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    ok(scale2.get('id')!==undefined,"Id has been set");
                                    start();
                                }
                    });
                })
                
                test("Get scale",function(){
                    stop(); 
                    AnnotationsSync('read',scale,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got scale in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.name, scale.get("name"), "Name is correct");
                                    equal(data.description, scale.get("description"), "Description is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by, user.get('id'), "Created_by user id is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by, user.get('id'), "Updated_by user id is correct");
                                    start();
                                }
                    });
                });
                
                test("Update scale",function(){
                    stop();
                    scale.set("name", "quantity");
                    AnnotationsSync('update',scale,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Video updated");
                                    equal("quantity", scale.get("name"), "Name is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by, user.get('id'), "Created_by user id is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by, user.get('id'), "Updated_by user id is correct");
                                    start();
                                }
                    });
                })
                
                test("Get all scales from video", function(){
                    stop();
                    AnnotationsSync('read',scales,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Get all scales successfully");
                                    
                                    ok(_.isArray(data.scales), "Got all scales");
                                    equal(data.scales.length, 2, "Two scales are successfully returned");
                                    start();
                                }
                    });
                })
                
                /* SCALE VALUE tests */
                module("ScaleValue", { setup : function(){
                        if(!isUserLoaded)loadUser();
                        if(!isVideoLoaded)loadVideo();
                        if(!isScaleLoaded)loadScale();
                        if(!isScaleValueLoaded)loadScaleValue();
                    }
                });
                
                test("Save scale value",function(){
                    stop();
                    
                    AnnotationsSync('create',scaleValue,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    ok(scaleValue.get('id')!==undefined,"Id has been set");
                                    start();
                                }
                    });
                })
                
                test("Save scale value 2",function(){
                    stop();
                    scaleValues.add({name:'stark',value:1.5,order:2});
                    scaleValue2 = scaleValues.at(1);
                    AnnotationsSync('update',scaleValue2,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    ok(scaleValue2.get('id')!==undefined,"Id has been set");
                                    start();
                                }
                    });
                })
                
                test("Get scale value",function(){
                    stop();
                    AnnotationsSync('read',scaleValue,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got scale in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.name, scale.get("name"), "Name is correct");
                                    equal(data.value, scale.get("value"), "Value is correct");
                                    equal(data.order, scale.get("order"), "Order is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by, user.get('id'), "Created_by user id is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by, user.get('id'), "Updated_by user id is correct");
                                    start();
                                }
                    });
                });
                
                test("Update scale value",function(){
                    stop();
                    scaleValue.set("name", "schwach");
                    AnnotationsSync('update',scaleValue,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Video updated");
                                    equal("schwach", scale.get("name"), "Name is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by, user.get('id'), "Created_by user id is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by, user.get('id'), "Updated_by user id is correct");
                                    start();
                                }
                    });
                })
                
                test("Get all scale values from a scale", function(){
                    stop();
                    AnnotationsSync('read',scaleValues,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Get all scale values successfully");
                                    
                                    ok(_.isArray(data.scaleValues), "Got all scale Values");
                                    equal(data.scaleValues.length, 1, "Two annotations are successfully returned");
                                    start();
                                }
                    });
                })
                
                /* DELETE tests */
                module("Deletion", {
                    setup: function(){
                        if(!isUserLoaded)loadUser();
                        if(!isVideoLoaded)loadVideo();
                        if(!isScaleLoaded)loadScale();
                        if(!isScaleValueLoaded)loadScaleValue();
                    }
                });
                
                test("Delete scale",1,function(){
                    stop();
                    AnnotationsSync('delete',scale,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Scale deleted.");                                    
                                    start();
                                }
                    });
                })
                
                test("Get deleted scale",1,function(){
                    stop();
                    AnnotationsSync('read',scale,{
                                error: function(error){
                                    ok(true, "Try to get scale but should not exist: "+error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(false, "Got scale");
                                    start();
                                }
                    });
                })
                
                test("Delete scale value",1,function(){
                    stop();
                    AnnotationsSync('delete',scaleValue,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Scale value deleted.");                                    
                                    start();
                                }
                    });
                })
                
                test("Get deleted scale value",1,function(){
                    stop();
                    AnnotationsSync('read',scaleValue,{
                                error: function(error){
                                    ok(true, "Try to get scale value but should not exist: "+error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(false, "Got scale value");
                                    start();
                                }
                    });
                })
        })
});