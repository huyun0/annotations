define(['jquery',
        'underscore',
        'player_adapter_HTML5',
        'models/annotation',
        'views/main'],
       
       function($, _, PlayerAdapter, Annotation, MainView) {

    return {
        start: function() {
            var playerAdapter = new PlayerAdapter($('video')[0]); 
            
            var mainView = new MainView(playerAdapter);
            
        }
    };

});