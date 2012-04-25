require(['domReady',
         'order!jquery',
         'order!models/track',
         'order!collections/tracks',
         'order!access',
         'order!libs/tests/qunit'],
                    
        function(domReady,$,Track,Tracks,ACCESS){
        
            domReady(function(){
                
                var tracks,track = null;

                module("Tracks",  {
                        setup: function() {
                            tracks = new Tracks;
                            track = new Track({name:"test track"});
                            tracks.add([{name:"test1"},track]);
                        }
                });
                
                test("Add", 2, function() {
                    equal(tracks.size(),2,"Should have 2 elements");                 
                    tracks.add(new Track({name:"test2"}));
                    equal(tracks.size(),3, "Should have 3 elements");
                });
                
                test("Get", function() {
                    var newTrack = tracks.get(track.get('id'));
                    equal(track.get('id'), newTrack.get('id'),"Track should have id "+track.get('id'));                 
                });
                
                test("Remove", function() {
                    tracks.remove(track)
                    equal(tracks.size(),1, "Should have 1 element");
                });
                
                test("Persistence", function() {
                    tracks.fetch();
                    tracks.each(function(t){t.save();});
                    tracks.each(function(track2){track2.destroy()});
                    var savedTrack = new Track({name:"Persistent track"});
                    tracks.add(savedTrack);
                    savedTrack.save();
                    
                    var newTracks = new Tracks;
                    newTracks.fetch();
                    equal(newTracks.size(),1, "Should have 1 element");
                    
                    equal(savedTrack.get("id"),newTracks.pop().get('id'),"The id of the persistent track should be "+savedTrack.get("id"));
                });
                  
            });
            
});