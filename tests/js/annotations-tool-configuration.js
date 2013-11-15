define(['domReady',
        'jquery',
        'underscore'
        // 'player_adapter_HTML5'
        // Add here the files (PlayerAdapter, ...) required for your configuration
        ],
       
    function(domReady, $, _){

       
            
        /**
         * Annotations tool configuration
         */
        window.annotationsTool =  {
            
            /** Define if the localStorage should be used or not */
            localStorage: true,
            
            /** Url from the annotations Rest Endpoints */
            restEndpointsUrl: "../../../extended-annotations",
            
            
            /* Function to get the current video id (video_extid) */
            getVideoExtId: function(){
                return $('video')[0].id;
            },
            
            /* Function to get the user id from the current context (user_extid) */
            getUserExtId: function(){
                return "default";
            },
            
            /* Function to load the video */
            loadVideo: function(){
                
            },

            user: {
                get: function(id) {
                    return 8;
                }
            },

            onWindowResize: function () {
                // Function without content -> nothing to do for test
            }
        };
            
        domReady(function(){
            /* Player adapter implementation to use for the annotations tool */
            // window.annotationsTool.playerAdapter = new HTML5PlayerAdapter($('video')[0]);
            
        })
        
        return window.annotations;
});