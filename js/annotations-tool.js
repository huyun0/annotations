define(['order!jquery',
        'order!underscore',
        'order!views/main'],
       
       function($, _undefined_, MainView) {
            
            return {
                start: function() {
                    var playerAdapter = annotationsTool.playerAdapter;
                    
                    var mainView = new MainView(playerAdapter);
                }
            };

});