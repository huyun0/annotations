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
 * A module representing the scale value editor
 */
define(["jquery",
        "backbone",
        "models/scalevalue",
        "text!templates/scale-value-editor.tmpl",
        "handlebars"],
        function ($, Backbone, ScaleValue, ScaleValueEditorTmpl, Handlebars) {

            "use strict";

            /**
             * @constructor
             * @see {@link http://www.backbonejs.org/#View}
             */
            var ScaleEditor = Backbone.View.extend({

                scaleValueEditorTemplate: Handlebars.compile(ScaleValueEditorTmpl),

                isDeleted: false,

                /**
                 * Events to handle
                 * @type {object}
                 */
                events: {
                    "click .order-up": "up",
                    "click .order-down": "down",
                    "click a.delete-scale-value": "delete",
                    "keydown .scale-value-name": "saveOnInsert",
                    "keydown .scale-value-value": "saveOnInsert",
                    "focusout .scale-value-value": "save",
                    "focusout .scale-value-name": "save"
                },

                initialize: function (attr) {

                    _.bindAll(this, 
                              "render",
                              "up",
                              "down",
                              "saveOnInsert",
                              "getSortedCollection",
                              "delete");

                    _.extend(this, Backbone.Events);

                    this.model    = attr.model;
                    this.isNew    = attr.isNew;
                    this.next     = attr.next;
                    this.previous = attr.previous;
                    this.onChange = attr.onChange;

                    this.scaleValueDeleteType = annotationsTool.deleteOperation.targetTypes.SCALEVALUE;
                    this.setElement(this.scaleValueEditorTemplate(this.model.toJSON()));                    
                },

                render: function() {
                    var modelJSON = this.model.toJSON();

                    this.setElement(this.scaleValueEditorTemplate(modelJSON));
                    this.delegateEvents(this.events);

                    return this;
                },

                up: function () {
                    var currentOrder = this.model.get("order"),
                        sortedCollection = this.getSortedCollection(),
                        previous;

                    if (currentOrder > 0) {
                        previous = sortedCollection[currentOrder-1];
                        previous.set("order", currentOrder);
                        this.model.set("order",currentOrder-1);
                        previous.save();
                        this.model.save();
                    } 

                    this.onChange();
                },                

                down: function () {
                    var currentOrder = this.model.get("order"),
                        sortedCollection = this.getSortedCollection(),
                        next;

                    if (currentOrder < (sortedCollection.length - 1)) {
                        next =sortedCollection[currentOrder+1];
                        next.set("order", currentOrder);
                        this.model.set("order",currentOrder+1);
                        next.save();
                        this.model.save();
                    } 

                    this.onChange();
                },

                saveOnInsert: function (event) {
                    if (event.keyCode === 13) {
                        this.save();
                    }
                },


                save: function () {
                    var name = this.$el.find(".scale-value-name").val(),
                        $value = this.$el.find(".scale-value-value"),
                        value = parseFloat($value.val());

                    if (_.isNumber(value)) {
                        $value.removeClass("error");
                        this.model.set({
                            name: name,
                            value: value
                        });

                        this.model.save();
                    } else {
                        $value.val("");
                        $value.addClass("error");
                    }
                },

                delete: function (event) {
                    var self = this,
                        sortedCollection = self.getSortedCollection();

                    event.stopImmediatePropagation();
                    annotationsTool.deleteOperation.start(this.model, this.scaleValueDeleteType, function () {
                        var currentOrder = self.model.get("order"),
                            next,
                            i;

                        // Update order for following item
                        if (currentOrder < (sortedCollection.length - 1)) {
                            for (i=currentOrder+1; i<sortedCollection.length; i++) {
                                sortedCollection[i].set("order", i-1);
                                sortedCollection[i].save();
                            }
                        } 

                        self.isDeleted = true;
                        self.onChange();
                        self.remove();
                    });
                },

                getSortedCollection: function () {
                    // Sort the model in the right scale value order
                    return this.model.collection.sortBy(function (scaleValue) {
                            return scaleValue.get("order");
                    })
                }

            });

            return ScaleEditor;

        }
);