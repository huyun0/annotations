require(['domReady',
         'jquery',
	 'models/video',
         'collections/videos',
         'models/track',
         'collections/tracks',
         'models/annotation',
         'collections/annotations',
         'backbone-annotations-sync',
         'order!underscore',
         'order!backbone',
         'order!libs/tests/qunit'],
                    
        function(domReady,$,Video, Videos, Track, Tracks, Annotatoin, Annotations, AnnotationsSync){
        
            domReady(function(){
                QUnit.config.autostart = false;
                
                var videos, videos, track, tracks, annotation, annotations;
                var isVideoLoaded, isTrackLoaded, isAnnotationLoaded = false;
                
                var loadVideo = function(){
                        videos = new Videos();
                        videos.add({video_extid:'matterhorn123'});
                        video = videos.at(0);
                        isVideoLoaded = true;
                };
                
                var loadTrack = function(){                    
                        tracks = new Tracks([],video);
                        tracks.add({name: "Test", description:'test track', settings: "test"});
                        track = tracks.at(0);
                        isTrackLoaded = true;
                };
                
                var loadAnnotation = function(){                    
                        annotations = track.get("annotations");
                        annotations.add({text: "Test", start: 12.0});
                        annotation = annotations.at(0);
                        isAnnotationLoaded = true;
                };
                
                
                /* VIDEO tests */
                
                module("Video", { setup : function(){if(!isVideoLoaded)loadVideo();}});

                Backbone.sync = AnnotationsSync;
                
                test("Save video",function(){
                    stop();
                    
                    AnnotationsSync('update',video,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    ok(video.get('id')!==undefined,"Id has been set");
                                    start();
                                }
                    });

                })
                
                test("Get video",function(){
                    stop();
                    
                    /**
                     * To test a get all, pass the collection (videos) and not the model
                     * you should receive back
                     */
                    AnnotationsSync('read',video,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got video in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.video_extid, video.get("video_extid"), "Extid is correct");
                                    start();
                                }
                    });
                });

            
                /* TRACK tests */
                module("Track", { setup: function(){if(!isTrackLoaded)loadTrack();}});
                        
                test("Save track",function(){
                    stop();
                
                    AnnotationsSync('create',track,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    
                                    ok(track.get('id')!==undefined,"Id has been set");
                                    start();
                                }
                    });
    
                })
                
                test("Get track",function(){
                    stop();
                    
                    AnnotationsSync('read',track,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got track in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.name, track.get("name"), "Name is correct");
                                    equal(data.description, track.get("description"), "Description is correct");
                                    equal(data.settings, track.get("settings"), "Settings are correct");
                                    start();
                                }
                    });
                })
                
                test("Update track",1,function(){
                    stop();
                    
                    AnnotationsSync('update',track,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Track updated");
                                    start();
                                }
                    });
                })
                
                /*test("Delete track",1,function(){
                    stop();
                    
                    AnnotationsSync('delete',track,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Track deleted.");
                                    
                                    AnnotationSync('read',track,{
                                        
                                                error: function(error){
                                                    ok(true, error);
                                                    start();
                                                },
                                                
                                                success: function(data){
                                                    ok(false, "Got track in json:" + data);
                                                    start();
                                                }
                                    },config);
                                    
                                    start();
                                }
                    });
                    
                })*/
                
                 /* TRACKS tests */
                module("Tracks", { setup: function(){if(!isTrackLoaded)loadTrack();}});
                
                test("Get all track from video", function(){
                    stop();
                
                    AnnotationsSync('read',video.get("tracks"),{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Get all track successfully");
                                    
                                    ok(_.isArray(data), "Got all tracks");
                                    start();
                                }
                    });
                })
                
                 /* ANNOTATION tests */
                module("Annotation", { setup: function(){if(!isAnnotationLoaded)loadAnnotation();}});
                        
                test("Save annotations",function(){
                    stop();
                
                    AnnotationsSync('create',annotation,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    
                                    ok(annotation.get('id')!==undefined,"Id has been set");
                                    start();
                                }
                    });
                })
                
                test("Get annotation",function(){
                    stop();
                    
                    AnnotationsSync('read',annotation,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got annotation in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.text, annotation.get("text"), "Text is correct");
                                    equal(data.start, annotation.get("start"), "Start is correct");
                                    start();
                                }
                    });
                })
                
                test("Update annotation",1,function(){
                    stop();
                    
                    AnnotationsSync('update',annotation,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Updated annotation");
                                    test("Delete annotation",2,function(){
                                        stop();
                                        AnnotationsSync('delete',annotation,{
                                                    error: function(error){
                                                        ok(false, error);
                                                        start();
                                                    },
                                                    
                                                    success: function(data){
                                                        ok(true, "Annotation deleted.");
                                                        
                                                        AnnotationsSync('read',annotation,{
                                                                    
                                                                    error: function(error){
                                                                        ok(true, "Try to get annotation but should not exist: "+error);
                                                                    },
                                                                    
                                                                    success: function(data){
                                                                        ok(false, "Got annotation");
                                                                    }
                                                        });
                                                        
                                                        start();
                                                    }
                                        });
                                    })
                                    start();
                                }
                    });
                })
                
                 /* ANNOTATIONS tests */
                module("Annotations", {
                    
                    setup: function(){
                        annotations.create({text: "annotation1", start: 1});
                        annotations.create({text: "annotation2", start: 2});
                        annotations.create({text: "annotation3", start: 3});
                        annotations.create({text: "annotation4", start: 4});  
                    },
                
                    teardown: function() {
                        _.each(annotations, function(an){
                            an.destroy();  
                        });
                    }
                });
                
                test("Get all track from video", function(){
                    stop();
                
                    AnnotationsSync('read',annotations,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Get all track successfully");
                                    
                                    ok(_.isArray(data), "Got all tracks");
                                    start();
                                }
                    });
                })
                  
        })
});