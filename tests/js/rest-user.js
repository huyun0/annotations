require(['domReady',
         'order!jquery',
	 'order!models/user',
         'order!libs/tests/qunit'],
                    
        function(domReady,$,User){
        
            domReady(function(){
                QUnit.config.autostart = false;
                
                var user = null;
                
                module("User",  {
                        setup: function() {
                            user = new User({user_extid:'testid',nickname:'pinguin'});
                        }
                });                
                
                
                /**
                 * Test to get an user 
                 */
                var testGetUser = function(url,token){
                    
                    // Get the id of the user through the url
                    var urlArray = url.split("/");
                    var userId  = urlArray[urlArray.length-1];
                    
                    test("Get an user",1, function() {
                        stop();
                
                        $.ajax({
                            type: "GET",
                            url: url,
                            dataType: "json",
                            beforeSend: function(xhr) {
                                xhr.setRequestHeader("Annotations-User-Id", userId);
                                
                                // Only for sprint 2
                                // xhr.setRequestHeader("Annotations-User-Auth-Token", token); 
                            },
                            success: function(data, textStatus, XMLHttpRequest){
                                var newUser;
                                var valid = true;
                                try{
                                    newUser = new User(data);
                                    newUser.bind('error',function(error){
                                        valid = false;
                                        ok(false, error.message);
                                    })
                                }
                                catch(error){
                                    valid = false;
                                    ok(false,error);
                                }
                                
                                if(newUser.get('user_extid')!=user.get('user_extid') ||
                                   newUser.get('nickname')!=user.get('nickname'))
                                    valid = false;
                                
                                if(valid)
                                    ok(true, "Valid user got from REST API");
                            
                                start();                            
                            },
                            
                            error: function(XMLHttpRequest, textStatus, errorThrown){
                                ok(false, "Returned error with status code "+XMLHttpRequest.status+", but should be 200 .");
                                start();
                                
                            }
                        });    
                    });
                }
                
                
                /**
                 * Create or update a user
                 */
                test("Create/Update user",1, function() {
                    stop();
                    
                    $.ajax({
                        type: "PUT",
                        url: window.restUrl+"/users",
                        data: user.toJSON(),
                        /*beforeSend: function(xhr) {
                            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + token);
                        },*/
                        success: function(data, textStatus, XMLHttpRequest){
                            ok((XMLHttpRequest.status === 200 || XMLHttpRequest.status === 201),
                               "Response status code has to be 200 or 201.");

                            token = data;
                            location = XMLHttpRequest.getResponseHeader('LOCATION');
                            
                            if(location === undefined)
                                ok(false, "Location not returned in HEADER");
                            
                            testGetUser(location,data);
                            
                            start();
                        },
                        
                        error: function(XMLHttpRequest, textStatus, errorThrown){
                            ok(false, "Returned error with status code "+XMLHttpRequest.status+", but should be 200 or 201.");
                            start();
                            
                        }
                    });    
                });
                

                

                
            });
            
});