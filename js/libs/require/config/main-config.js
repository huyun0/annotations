// RequireJS configuration for main app
require.config({
    baseUrl: "js",
    paths: {
        'root': 'libs',
        'backbone':'libs/backbone/backbone-min',
        'loader': 'libs/backbone/loader',
        'localstorage': 'libs/backbone/backbone.localStorage',
        'jquery': 'libs/jquery-1.7.2.min',
        'underscore': 'libs/underscore-min',
        'templates': '../templates',
        'order':'libs/require/config/order',
        'domReady':'libs/require/config/domReady',
        'text':'libs/require/config/text'
    },
    waitSeconds: 10
});

// Bootstrap function for main app
require(['order!domReady',
         'order!annotations-tool',
         'order!annotations-tool-configuration'],
              
        function (domReady,app,config) {
            domReady(function(){
                app.start();
            });
        }
);
    
