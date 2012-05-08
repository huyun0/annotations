define(['order!jquery',
        'order!underscore',
        'order!player_adapter_HTML5',
        'order!views/main'],
       
       function($, _, PlayerAdapter, MainView) {

            return {
                start: function() {
                    var playerAdapter = new PlayerAdapter($('video')[0]); 
                    
                    var mainView = new MainView(playerAdapter);
                    
                }
            };

});