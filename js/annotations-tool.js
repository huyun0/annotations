define(['order!jquery',
        'order!underscore',
        'order!views/main'],
       
       function($, _undefined_, MainView) {
            
            return {
                start: function() {
                    var playerAdapter = annotations.playerAdapter;
                    
                    var mainView = new MainView(playerAdapter);
                }
            };

});