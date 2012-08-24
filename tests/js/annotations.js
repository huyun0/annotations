require(['domReady',
         'order!jquery',
         'order!models/annotation',
         'order!collections/annotations',
         'order!access'],
                    
        function(domReady,$,Annotation,Annotations,ACCESS){
        
            domReady(function(){
                
                var annotations,annotation = null;
                
                window.annotationsTool = {
                    localStorage: true
                }

                module("Annotations",  {
                        setup: function() {
                            annotations = new Annotations([],{id: 123, collection:{}, url:function(){return 'test';}});
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
                
                  
            });
            
});