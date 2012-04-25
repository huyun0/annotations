require(['domReady',
         'order!jquery',
         'order!models/track',
         'order!access',
         'order!libs/tests/qunit'],
                    
        function(domReady,$,Track,ACCESS){
        
            domReady(function(){
                
                var track = null;

                module("Track",  {
                        setup: function() {
                            track = new Track({name:'My test track'});
                        }
                });
                
                test("Initial required parameters", 1, function() {
                    try{
                        var unvalidTrack = new Track();
                    }
                    catch(error){
                        ok(true,"Error catched: "+error);
                    };

                });
                
                test("Created_at", function() {
                    stop();
                    track.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            track.unbind('error');
                            start();
                    });
                    track.set({created_at:12});
                    
                    var newDate = new Date().getTime();
                    ok(newDate-track.get('created_at')<100, "Track  should has around "+newDate+" as created_at attribute.");
                });
                
                test("Description", function() {
                    stop();
                    track.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            track.unbind('error');
                            start();
                    });
                    track.set({description:12});
                    
                    var desc = "Simple track created for unit tests.";
                    track.set({description:desc});
                    equal(track.get('description'), desc, "Track  should has "+desc+" as description attribute.");

                });
                
                test("Settings", function() {
                    stop();
                    track.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            track.unbind('error');
                            start();
                    });
                    track.set({settings:12});
                    
                    var newSettings = {color:"blue"};
                    track.set({settings:newSettings});
                    equal(track.get('settings'), newSettings, "Track  should has "+newSettings+" as settings attribute.");

                });
                
                test("Access", function() {
                    stop();
                    track.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            track.unbind('error');
                            start();
                    });
                    track.set({access:"Tata"});

                    track.set({access:ACCESS.PRIVATE});
                    equal(track.get('access'), ACCESS.PRIVATE, "track  should has "+ACCESS.PRIVATE+" as access attribute.");
                });   
            });
            
});