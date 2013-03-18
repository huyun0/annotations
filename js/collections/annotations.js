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
 * A module representing an annotations collection
 * @module collections-annotations
 * @requires jQuery
 * @requires models-annotation
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "models/annotation",
        "backbone",
        "localstorage"],

    function ($, Annotation, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-annotations
         * @alias module:collections-annotations.Annotations
         */
        var Annotations = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-annotations.Annotations#initialize
             */
            model       : Annotation,

            /**
             * Localstorage container for the collection
             * @alias module:collections-annotations.Annotations#localStorage
             * @type {Backbone.LocalStorgage}
             */
            localStorage: new Backbone.LocalStorage("Annotations"),

            /**
             * constructor
             * @alias module:collections-annotations.Annotations#initialize
             */
            initialize: function (models, track) {
                _.bindAll(this, "setUrl");
                this.setUrl(track);
            },

            /**
             * Parse the given data
             * @alias module:collections-annotations.Annotations#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the annotations
             */
            parse: function (data) {
                if (data.annotations && _.isArray(data.annotations)) {
                    return data.annotations;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
            },

            /**
             * Define the url from the collection with the given track
             * @alias module:collections-annotations.Annotations#setUrl
             * @param {Track} Track containing the annotations
             */
            setUrl: function (track) {
                if (!track) {
                    throw "The parent track of the annotations must be given!";
                } else if (track.collection) {
                    this.url = track.url() + "/annotations";
                }

                if (window.annotationsTool && annotationsTool.localStorage) {
                    this.localStorage = new Backbone.LocalStorage(this.url);
                }
            }
        });

        return Annotations;
    }
);