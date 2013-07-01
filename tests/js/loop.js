require(['jquery',
         'models/loop',
         'collections/loops',
         'backbone-annotations-sync',
         'access'],

        function($, Loop, Loops, AnnotationSync, ACCESS){


                var loops, loop, video;

                module("Loops",  {
                        setup: function() {
                            Backbone.sync = AnnotationSync;

                            // Mockup video
                            video = {
                                collection: {
                                    url: "test"
                                },
                                url: function () {
                                    return this.collection.url;
                                }
                            }

                            loops = new Loops([], video);
                            loops.reset();
                            loop = loops.create({value: "loop 1"});
                        }
                });

                test("Add", 2, function() {
                    equal(loops.size(), 1, "Should have 1 elements");
                    loops.add([{value: "loop 2"}]);
                    equal(loops.size(), 2, "Should have 2 elements");
                });

                test("Get", function() {
                    var newLoop = loops.get(loop.get('id'));
                    newLoop.save();
                    equal(loop.get('id'), newLoop.get('id'),"Loop should have id " + loop.get('id'));
                });

                test("Remove", function() {
                    loop.destroy();
                    equal(loops.size(), 0, "The collection should be empty");
                });

});