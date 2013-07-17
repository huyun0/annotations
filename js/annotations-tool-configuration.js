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

/**
 * Module containing the tool configuration
 * @module annotations-tool-configuration
 */
define(["jquery",
        "underscore",
        "roles",
        "player_adapter_HTML5"
        // Add here the files (PlayerAdapter, ...) required for your configuration
        ],

    function ($, _, ROLES, HTML5PlayerAdapter) {

        "use strict";

        /**
         * Annotations tool configuration object
         * @alias module:annotations-tool-configuration.Configuration
         * @enum
         */
        var Configuration =  {

            /**
             * List of possible layout configuration
             * @memberOf module:annotations-tool-configuration.Configuration
             * @type {Object}
             */
            LAYOUT_CONFIGURATION: {
                /** default configuration */
                DEFAULT: {
                    timeline: true,
                    list: true,
                    annotate: true
                }
            },

            /**
             * Define if the localStorage should be used or not
             * @alias module:annotations-tool-configuration.Configuration.localStorage
             * @type {boolean}
             * @readOnly
             */
            localStorage: true,

            /**
             * List of models using only the localStory sync module
             * @type {Array}
             * @readOnly
             */
            localStorageOnlyModel: [],


            /**
             * List of plugins to load,
             * the bootstrap function of each plugin is called once the tool is ready
             * @type {Object}
             * @readOnly
             */
            plugins: {
                Loop: function (callback) {
                        require(["views/loop"], function (Loop) {
                            annotationsTool.loopView = new Loop();
                        });
                    }
            },

            /**
             * Url from the annotations Rest Endpoints
             * @alias module:annotations-tool-configuration.Configuration.restEndpointsUrl
             * @type {string}
             * @readOnly
             */
            restEndpointsUrl: "../../extended-annotations",

            /**
             * Url for redirect after the logout
             * @alias module:annotations-tool-configuration.Configuration.logoutUrl
             * @type {string}
             * @readOnly
             */
            logoutUrl: undefined,

            /**
             * Url from the export function for statistics usage
             * @alias module:annotations-tool-configuration.Configuration.exportUrl
             * @type {string}
             * @readOnly
             */
            exportUrl: "",

            /**
             * Player adapter implementation to use for the annotations tool
             * @alias module:annotations-tool-configuration.Configuration.playerAdapter
             * @type {module:player-adapter.PlayerAdapter}
             */
            playerAdapter: undefined,

            /**
             * Get the tool layout configuration
             * @return {object} The tool layout configuration
             */
            getLayoutConfiguration: function () {
                return this.LAYOUT_CONFIGURATION.DEFAULT;
            },

            /**
             * Define if the structured annotations are or not enabled
             * @alias module:annotations-tool-configuration.Configuration.isStructuredAnnotationEnabled
             * @return {boolean} True if this feature is enabled
             */
            isStructuredAnnotationEnabled: function () {
                return true;
            },

            /**
             * Define if the free text annotations are or not enabled
             * @alias module:annotations-tool-configuration.Configuration.isFreeTextEnabled
             * @return {boolean} True if this feature is enabled
             */
            isFreeTextEnabled: function () {
                return true;
            },

            /**
             * Get the current video id (video_extid)
             * @alias module:annotations-tool-configuration.Configuration.getVideoExtId
             * @return {string} video external id
             */
            getVideoExtId: function () {
                return $("video")[0].id;
            },

            /**
             * Get the user id from the current context (user_extid)
             * @alias module:annotations-tool-configuration.Configuration.getUserExtId
             * @return {string} user_extid
             */
            getUserExtId: function () {
                return "default";
            },

            /**
             * Get the role of the current user
             * @alias module:annotations-tool-configuration.Configuration.getUserRole
             * @return {ROLE} The current user role
             */
            getUserRole: function () {
                return ROLES.USER;
            },

            /**
             * Get the user authentification token if existing
             * @alias module:annotations-tool-configuration.Configuration.getUserAuthToken
             * @return {string} Current user token
             */
            getUserAuthToken: function () {
                return undefined;
            },

            /**
             * Function to load the video
             * @alias module:annotations-tool-configuration.Configuration.loadVideo
             */
            loadVideo: function () {
                annotationsTool.playerAdapter = new HTML5PlayerAdapter($("video")[0]);
            }
        };

        return Configuration;
    }
);