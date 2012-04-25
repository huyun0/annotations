require(['domReady',
         'order!jquery',
         'order!models/annotation',
         'order!collections/annotations',
         'order!access',
         'order!libs/tests/qunit'],
                    
        function(domReady,$,Annotation,Annotations,ACCESS){
        
            domReady(function(){
                
                var annotations,annotation = null;

                module("Annotations",  {
                        setup: function() {
                            annotations = new Annotations;
                            annotation = new Annotation({start:5});
                            annotations.add([{start:4},annotation]);
                        }
                });
                
                test("Add", 2, function() {
                    equal(annotations.size(),2,"Should have 2 elements");                 
                    annotations.add(new Annotation({start:11}));
                    equal(annotations.size(),3, "Should have 3 elements");
                });
                
                test("Get", function() {
                    var newAnnotation = annotations.get(annotation.get('id'));
                    equal(annotation.get('id'), newAnnotation.get('id'),"annotation should have id "+annotation.get('id'));                 
                });
                
                test("Remove", function() {
                    annotations.remove(annotation)
                    equal(annotations.size(),1, "Should have 1 element");
                });
                
                test("Persistence", function() {
                    annotations.fetch();
                    annotations.each(function(a){a.save();});
                    annotations.each(function(a){a.destroy()});
                    var savedAnnotation = new Annotation({start:12});
                    annotations.add(savedAnnotation);
                    savedAnnotation.save();
                    
                    var newAnnotations = new Annotations;
                    newAnnotations.fetch();
                    equal(newAnnotations.size(),1, "Should have 1 element");
                    
                    equal(savedAnnotation.get("id"),newAnnotations.pop().get('id'),"The id of the persistent annotation should be "+savedAnnotation.get("id"));
                });
                  
            });
            
});