require(['domReady',
         'order!jquery',
         'order!models/video',
         'order!libs/tests/qunit'],
                    
        function(domReady,$,Video){
        
            domReady(function(){
                
                var video = null;

                
                module("Video",  {
                        setup: function() {
                            video = new Video({video_extid:'matterhorn123'});
                        }
                });
                
                
                test("Created_at", function() {
                    stop();
                    video.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            video.unbind('error');
                            start();
                    });
                    video.set({created_at:12});
                    
                    var newDate = new Date().getTime();
                    ok(newDate-video.get('created_at')<100, "video  should has around "+newDate+" as created_at attribute.");
                });
                
                test("Video_extid", function() {
                    var newExtid = "matterhorn1234";
                    video.set({video_extid:newExtid});
                    equal(video.get('video_extid'), newExtid, "video  should has "+newExtid+" as video_extid attribute.");

                });

                
            });
            
});