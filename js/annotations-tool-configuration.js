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


define(['domReady',
        'jquery',
        'underscore',
        'roles',
        'player_adapter_HTML5'
        // Add here the files (PlayerAdapter, ...) required for your configuration
        ],
       
    function(domReady, $, _undefined_, ROLES, HTML5PlayerAdapter){

       
            
        /**
         * Annotations tool configuration
         * @namespace  
         */
        window.annotationsTool =  {
            
            /** 
             * Define if the localStorage should be used or not 
             * @type {boolean}
             * @readOnly 
             */
            localStorage: true,
            
            /**
             * Url from the annotations Rest Endpoints 
             * @type {string}
             * @readOnly
             */
            restEndpointsUrl: "../../extended-annotations",

            /**
             * Url from the export function for statistics usage
             * @type {string}
             * @readOnly
             */
            exportURL: "",

            /**
             * Player adapter implementation to use for the annotations tool
             * @type {PlayerAdapter}
             */
            playerAdapter: undefined,

            LAYOUT_CONFIGURATION: {
                DEFAULT: {
                    timeline: true,
                    list: true,
                    annotate: true
                }
            },
            
            getLayoutConfiguration: function () {
                return this.LAYOUT_CONFIGURATION.DEFAULT;
            },

            isStructuredAnnotationEnabled: function () {
                return true;
            },

            isFreeTextEnabled: function () {
                return true;
            },
            
            /**
             * Get the current video id (video_extid) 
             * @return {string} video external id
             */ 
            getVideoExtId: function(){
                return $('video')[0].id;
            },
            
            /**
             * Get the user id from the current context (user_extid)
             * @return {string} user_extid
             */ 
            getUserExtId: function(){
                return "default";
            },

            getUserRole: function(){
                return ROLES.USER;
            },

            /**
             * Get the user authentification token if existing
             * @return {string} Current user token
             */
            getUserAuthToken: function(){
                return undefined;
            },
            
            /* Function to load the video */
            loadVideo: function(){
                //TODO: move code from annotation-tool.js here and call it in bootstrap script.
            }
        };
            
        domReady(function(){
            window.annotationsTool.playerAdapter = new HTML5PlayerAdapter($('video')[0]);
            
        })
        
        return window.annotationsTool;
});