require(['domReady',
         'order!jquery',
         'order!models/annotation',
         'order!access',
         'order!libs/tests/qunit'],
                    
        function(domReady,$,Annotation,ACCESS){
        
            domReady(function(){
                
                var annotation = null;

                
                module("Annotation",  {
                        setup: function() {
                            annotation = new Annotation({start:12});
                        }
                });
                
                test("Initial required parameters", 1, function() {
                    try{
                        var unvalidAnnotation = new Annotation();
                    }
                    catch(error){
                        ok(true,"Error catched: "+error);
                    };

                });
                
                
                test("Created_at", function() {
                    stop();
                    annotation.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            annotation.unbind('error');
                            start();
                    });
                    annotation.set({created_at:12});
                    
                    var newDate = new Date().getTime();
                    ok(newDate-annotation.get('created_at')<100, "annotation  should has around "+newDate+" as created_at attribute.");
                });
                
                test("Text", function() {
                    stop();
                    annotation.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            annotation.unbind('error');
                            start();
                    });
                    annotation.set({text:12});
                    
                    var text = "Simple text created for unit tests.";
                    annotation.set({text:text});
                    equal(annotation.get('text'), text, "annotation  should has "+text+" as text attribute.");

                });
                
                test("Start", function() {
                    stop();
                    annotation.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            annotation.unbind('error');
                            start();
                    });
                    annotation.set({start:"Tata"});
                    
                    var newStart = 12;
                    annotation.set({start:newStart});
                    equal(annotation.get('start'), newStart, "annotation  should has "+newStart+" as start attribute.");
                });
                
                test("Duration", 3, function() {
                    stop();
                    var nbError=0;
                    annotation.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error); 
                            if(nbError++ > 0)
                                annotation.unbind('error');
                            start();
                    });
                    annotation.set({duration:"Tata"});
                    annotation.set({duration:-12});
                    
                    var newDuration = 12;
                    annotation.set({duration:newDuration});
                    equal(annotation.get('duration'), newDuration, "annotation  should has "+newDuration+" as duration attribute.");
                });
                
                test("Access", function() {
                    stop();
                    annotation.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            annotation.unbind('error');
                            start();
                    });
                    annotation.set({access:"Tata"});

                    annotation.set({access:ACCESS.PRIVATE});
                    equal(annotation.get('access'), ACCESS.PRIVATE, "annotation  should has "+ACCESS.PRIVATE+" as access attribute.");
                });

                
            });
            
});