/* Bootstrap script for require.js */
// RequireJS configuration for main app
require(['config'], function () {
    require(['domReady',
             'jquery',
             'annotations-tool-configuration',
             'tests/rest-user', // User tests file
             'tests/rest-video-and-track',
             'tests/rest-scale-and-scalevalue',
             'tests/rest-category-and-label'
             //... add other test file here, files have to be in directory tests/js
             ],

            
            function(domReady, $){

                domReady(function(){
                    $('button').click(function() {
                        $.ajax({
                              type: 'DELETE',
                              async: false,
                              url: window.annotationsTool.restEndpointsUrl + '/reset'
                        });
                    });
                    
                    QUnit.config.reorder = false;
                    QUnit.start();
                });
            }
    );

});

