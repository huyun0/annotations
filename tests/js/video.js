require(['domReady',
         'order!jquery',
         'order!models/video',
         'order!collections/videos',
         'order!libs/tests/qunit'],
                    
        function(domReady, $, Video, Videos){
        
            domReady(function(){
                
                var video, videos;

                
                module("Video",  {
                        setup: function() {
                            videos = new Videos();
                            video = videos.create({video_extid:'matterhorn123'});
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
                    ok(newDate-video.get('created_at')<100, "video  should have around "+newDate+" as created_at attribute.");
                });
                
                test("Video_extid", function() {
                    var newExtid = "matterhorn1234";
                    video.set({video_extid:newExtid});
                    equal(video.get('video_extid'), newExtid, "video  should have "+newExtid+" as video_extid attribute.");

                });

                
            });
            
});