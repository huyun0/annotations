// Bootstrap function for main app
require(['domReady',
         'annotations-tool-configuration',
         'annotations-tool'],
              
        function (domReady,config,app) {
            domReady(function(){
                app.start();
            });
        }
);