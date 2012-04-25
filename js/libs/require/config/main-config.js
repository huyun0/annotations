// RequireJS configuration for main app
require.config({
    baseUrl: "js",
    paths: {
        'root': 'libs',
        'backbone':'libs/backbone/backbone-min',
        'loader': 'libs/backbone/loader',
        'localstorage': 'libs/backbone/backbone.localStorage-min',
        'jquery': 'libs/jquery-1.7.2.min',
        'prototypes': 'prototypes',
        'order':'libs/require/config/order',
        'underscore': 'libs/underscore-min',
        'domReady':'libs/require/config/domReady'
    },
    waitSeconds: 10
});

// Bootstrap function for main app
require(['order!jquery', 
        'app'],
              
        function ($,app) {
            app.start();
        }
);
    
