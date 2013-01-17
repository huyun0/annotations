require(['jquery',
         'models/label',
         'models/annotation',
         'access'],
                    
        function($,Label,Annotation, ACCESS){
                
            var annotation, comment;
            
            module("Comment",  {
                    setup: function() {
                        annotation = new Annotation({start:12});
                        comment = new Comment({
                            text: "New comment"
                        })
                    }
            });
            
            test("Initial required parameters", 1, function(){
                try{
                    var unvalidComment = new Comment();
                }
                catch(error){
                    ok(true,"Error catched: "+error);
                };
            });
            
            test("Text", 2, function() {
                stop();
                comment.bind('error',function(model,error){
                        ok(true,"Can not be modified, error: " + error);
                        comment.unbind('error');
                        start();
                });
                comment.set({text:12});
                
                var text = "Any comment.";
                comment.set({text:text});
                equal(comment.get('text'), text, "Comment should have '"+text+"' as text.");
            });
            
            test("Category", 2, function() {
                stop();
                label.bind('error',function(model,error){
                        ok(true,"Can not be modified, error: " + error);
                        label.unbind('error');
                        start();
                });
                label.set({category:"wrong category"});
                
                label.set({category:category});
                equal(label.get('category'), category, "Label  should have "+category.get("name")+" as category.");
            });
            
            test("Access", function() {
                stop();
                comment.bind('error',function(model,error){
                        ok(true,"Can not be modified, error: " + error);
                        label.unbind('error');
                        start();
                });
                comment.set({access:"Tata"});
                
                comment.set({access:ACCESS.PRIVATE});
                equal(comment.get('access'), ACCESS.PRIVATE, "Comment should have "+ACCESS.PRIVATE+" as access attribute.");
            });
                
});