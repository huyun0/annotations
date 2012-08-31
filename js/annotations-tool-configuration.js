/**
 *  Copyright 2012, Entwine GmbH, Switzerland
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 *
 */

define(['order!domReady',
        'order!jquery',
        'order!underscore',
        'order!player_adapter_HTML5'
        // Add here the files (PlayerAdapter, ...) required for your configuration
        ],
       
    function(domReady, $, _undefined_, HTML5PlayerAdapter){

       
            
        /**
         * Annotations tool configuration
         */
        window.annotationsTool =  {
            
            /** Define if the localStorage should be used or not */
            localStorage: true,
            
            /** Url from the annotations Rest Endpoints */
            restEndpointsUrl: "../../extended-annotations",
            
            
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
                
            }
        };
            
        domReady(function(){
            /* Player adapter implementation to use for the annotations tool */
            window.annotationsTool.playerAdapter = new HTML5PlayerAdapter($('video')[0]);
            
        })
        
        return window.annotations;
});