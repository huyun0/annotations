define(['order!jquery',
        'order!underscore',
        'order!player_adapter_HTML5'
        // Add here the files (PlayerAdapter, ...) required for your configuration
        ],
       
    function($, _undefined_, HTML5PlayerAdapter){

        
        /**
         * Annotations tool configuration
         */
        window.annotations =  {
            
            /* Player adapter implementation to use for the annotations tool */
            playerAdapter: new HTML5PlayerAdapter($('video')[0]),
            
            
            /** Url from the annotations Rest Endpoints */
            restEndpointsUrl: "../../extended-annotations",
            
            
            /* Function to get the current video id (video_extid) */
            getVideoId: function(){
                return _.last($('video')[0].src.split("/"));
            },
            
            /* Function to get the user id from the current context (user_extid) */
            getUserId: function(){
                return "default";
            }
        };
        
        return window.annotations;
});