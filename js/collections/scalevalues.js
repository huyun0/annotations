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
    
define(["jquery",
        "models/scalevalue",
        "backbone",
        "localstorage"],
    

    function($,ScaleValue, Backbone){
    
        /**
        * @class Scale values collection
        */
        var ScaleValues = Backbone.Collection.extend({
            model: ScaleValue,
            localStorage: new Backbone.LocalStorage("ScaleValue"),
            
            initialize: function(models, scale){
                _.bindAll(this, "setUrl", "toExportJSON");

                this.scale = scale;
                
                this.setUrl(scale);
            },
            
            parse: function(resp, xhr) {
              if(resp.scaleValues && _.isArray(resp.scaleValues))
                    return resp.scaleValues;
                else if(_.isArray(resp))
                    return resp;
                else
                    return null;
            },

            comparator: function (scaleValue) {
                return scaleValue.get("order");
            },


            toExportJSON: function () {
                var valueForExport = [];

                this.each(function (value) {
                    valueForExport.push(value.toExportJSON());
                });

                return valueForExport;
            },
            
            /**
             * Define the url from the collection with the given video and scale
             *
             * @param {Scale} scale containing the scale value
             */
            setUrl: function(scale){
                var currentScale = scale;

                if (!scale && !this.scale) {
                    throw "The parent scale of the scale value must be given!";
                } else if (scale && scale.collection) {
                    this.url = scale.url() + "/scalevalues";
                } else if (this.scale.collection) {
                    this.url = this.scale.url() + "/scalevalues";
                }

                if(annotationsTool.localStorage)
                    this.localStorage = new Backbone.LocalStorage(this.url);
            }
        });
        
        return ScaleValues;

});
    
    