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
                
                
                test("Video_extid", function() {
                    var newExtid = "matterhorn1234";
                    video.set({video_extid:newExtid});
                    equal(video.get('video_extid'), newExtid, "video  should have "+newExtid+" as video_extid attribute.");

                });

                
            });
            
});