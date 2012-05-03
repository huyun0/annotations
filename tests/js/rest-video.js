require(['domReady',
         'jquery',
	 'models/video',
         'collections/videos',
         'backbone-annotations-sync',
         'order!underscore',
         'order!backbone',
         'order!libs/tests/qunit'],
                    
        function(domReady,$,Video, Videos, AnnotationSync){
        
            domReady(function(){
                QUnit.config.autostart = false;
                
                var videos, base_video, videos;
                
                module("Video",  {
                        setup: function() {
                            videos = new Videos();
                            video  = new Video();
                            video.set({id:undefined}); // force to have no id
                            videos.add(video);
                            Backbone.sync = AnnotationSync;
                            base_video = video.clone();
                            config = {
                                restEndpointUrl: window.restUrl
                            };
                        }
                });
                
                
                test("Save video",function(){
                    stop();
                    
                    AnnotationSync('update',video,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    
                                    ok(video.get('id')!==undefined,"Id has been set");
                                    start();
                                }
                    },config);

                })
                
                test("Get video",1,function(){
                    stop();
                    
                    /**
                     * To test a get all, pass the collection (videos) and not the model
                     * you should receive back
                     */
                    AnnotationSync('read',video,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Got video in json:" + data);
                                    start();
                                }
                    },config);
                })
                
                

                
                 
            });
            
});