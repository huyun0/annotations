require(['domReady',
         'jquery',
         'require',
	 'models/category',
         'models/video',
         'models/user',
         'collections/categories',
         'collections/videos',
         'collections/users',
         'tests/backbone-annotations-sync-test',
         'order!underscore',
         'order!backbone',
         'order!libs/tests/qunit'],
                    
        function(domReady, $, require, Category, Video, User, Categories, Videos, Users, AnnotationsSync){
            
            domReady(function(){
                QUnit.config.autostart = false;
                Backbone.sync = AnnotationsSync;
                
                var category, categories, videos, video, users, user, videoCategories;
                var setupLoaded = false;
                
                var setup = function(){
                    categories = new Categories([]);
                    categories.create({
                            name: "Test category",
                            description: "Category created for the tests"
                    });
                    category = categories.at(0);
                    
                    videos = new Videos();
                    videos.add({video_extid:'matterhorn123'});
                    video = videos.at(0);
                    AnnotationsSync('update',video,{
                                error: function(error){
                                    console.warn(error);
                                },
                                
                                success: function(data){
                                    video.set(data);
                                }
                    });
                    isVideoLoaded = true;
                    
                    videoCategories = video.get("categories");
                    
                    setupLoaded = true;
                }
                
                
                module("Category",{ setup : setup });

                test("Create a 'template' category",function(){
                    stop();
                    
                    AnnotationsSync('create',category,{
                        
                        error: function(error){
                            ok(false, error);
                            start();
                        },
                        
                        success: function(data){
                            ok(true, "Saved successfully");
                            ok(category.id!== undefined,"Id has been set");
                            window.annotationsTool.category = category;
                            start();
                        }
                    });
                })
                
                test("Get a 'template' category",function(){
                    stop();
                    
                    AnnotationsSync('read',category,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got category in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.name, category.get("name"), "Name is correct");
                                    equal(data.description, category.get("description"), "Description is correct");
                                    equal(data.has_duration, category.get("has_duration"), "Duration is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    // equal(data.created_by, user.get('id'), "Created_by category id is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    // equal(data.updated_by, user.get('id'), "Updated_by category is correct");
                                    start();
                                }
                    });
                });

                test("Add a category to a video",function(){
                    stop();
                    
                    var copy = videoCategories.copyTemplate(category);
                                
                    ok(_.isObject(data), "Got category in json");
                    ok(data.id, "Id is "+data.id);
                    notEqual(data.id,category.id, "Id is different as template category");
                    equal(data.name, category.get("name"), "Name is correct");
                    equal(data.description, category.get("description"), "Description is correct");
                    equal(data.has_duration, category.get("has_duration"), "Duration is correct");
                    ok(data.created_at, "Created_at date is set");
                    // equal(data.created_by, user.get('id'), "Created_by category id is correct");
                    ok(data.updated_at, "Updated_at date is set");
                    // equal(data.updated_by, user.get('id'), "Updated_by category is correct");
                    start();

                });
                
                test("Get a category from a video",function(){
                    stop();
                    
                    AnnotationsSync('read',videoCategories.at(0),{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got category in json");
                                    ok(data.id, "Id is "+data.id);
                                    notEqual(data.id,category.id, "Id is different as template category");
                                    equal(data.name, category.get("name"), "Name is correct");
                                    equal(data.description, category.get("descriptoin"), "Description is correct");
                                    equal(data.has_duration, category.get("has_duration"), "Duration is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    // equal(data.created_by, user.get('id'), "Created_by category id is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    // equal(data.updated_by, user.get('id'), "Updated_by category is correct");
                                    start();
                                }
                    });
                });
                
                test("Update a 'template' category",function(){
                    stop();
                    
                    AnnotationsSync('read',category,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got category in json");
                                    ok(data.id, "Id is "+data.id);
                                    notEqual(data.id,category.id, "Id is different as template category");
                                    equal(data.name, category.get("name"), "Name is correct");
                                    equal(data.description, category.get("description"), "Description is correct");
                                    equal(data.has_duration, category.get("has_duration"), "Duration is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    // equal(data.created_by, user.get('id'), "Created_by category id is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    // equal(data.updated_by, user.get('id'), "Updated_by category is correct");
                                    start();
                                }
                    });
                });
                
                test("Update a category from a video",function(){
                    stop();
                    
                    AnnotationsSync('read',videoCategories.at(0),{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got category in json");
                                    ok(data.id, "Id is "+data.id);
                                    notEqual(data.id,category.id, "Id is different as template category");
                                    equal(data.name, category.get("name"), "Name is correct");
                                    equal(data.description, category.get("description"), "Description is correct");
                                    equal(data.has_duration, category.get("has_duration"), "Duration is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    // equal(data.created_by, user.get('id'), "Created_by category id is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    // equal(data.updated_by, user.get('id'), "Updated_by category is correct");
                                    start();
                                }
                    });
                });
            });
            
});