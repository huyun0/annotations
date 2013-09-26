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
 * Module containing the tool main object
 * @module annotations-tool
 * @requires jQuery
 * @requires backbone
 * @requires views-main
 * @requires views-alert
 * @requires templates/delete-modal.tmpl
 * @requires templates/delete-warning-content.tmpl
 * @requires player-adapter
 * @requires handlebars
 */
define(["jquery",
        "backbone",
        "views/main",
        "views/alert",
        "text!templates/delete-modal.tmpl",
        "text!templates/delete-warning-content.tmpl",
        "prototypes/player_adapter",
        "handlebars"],

        function ($, Backbone, MainView, AlertView, DeleteModalTmpl, DeleteContentTmpl, PlayerAdapter, Handlebars) {

            "use strict";

            /**
             * The main object of the annotations tool
             * @namespace annotationsTool
             */
            window.annotationsTool = {

                EVENTS: {
                    ANNOTATION_SELECTION: "at:annotation-selection",
                    READY               : "at:ready"
                },

                views: {},

                deleteModalTmpl: Handlebars.compile(DeleteModalTmpl),

                deleteContentTmpl: Handlebars.compile(DeleteContentTmpl),

                deleteOperation: {
                    /**
                     * Function to delete element with warning
                     *
                     * @param {Object} target Element to be delete
                     * @param {TargetsType} type Type of the target to be deleted
                     */
                    start: function (target, type, callback) {
                        var confirm = function () {
                                type.destroy(target, callback);
                                this.deleteModal.modal("toggle");
                            },
                            confirmWithEnter = function (event) {
                                if (event.keyCode === 13) {
                                    confirm();
                                }
                            };

                        confirmWithEnter = _.bind(confirmWithEnter, this);
                        confirm = _.bind(confirm, this);

                        // Change modal title
                        this.deleteModalHeader.text("Delete " + type.name);

                        // Change warning content
                        this.deleteModalContent.html(this.deleteContentTmpl({
                            type: type.name,
                            content: type.getContent(target)
                        }));

                        // Listener for delete confirmation
                        this.deleteModal.find("#confirm-delete").one("click", confirm);

                        // Add possiblity to confirm with return key
                        $(window).bind("keypress", confirmWithEnter);

                        // Unbind the listeners when the modal is hidden
                        this.deleteModal.one("hide", function () {
                            $("#confirm-delete").unbind("click");
                            $(window).unbind("keypress", confirmWithEnter);
                        });

                        // Show the modal
                        this.deleteModal.modal("show");
                    }
                },

                alertModal: new AlertView(),

                /**
                 * Initialize the tool
                 * @alias   annotationsTool.start
                 * @param  {module:annotations-tool-configuration.Configuration} config The tool configuration
                 */
                start: function (config) {
                    _.bindAll(this, "updateSelectionOnTimeUpdate",
                                    "setSelection",
                                    "getSelection",
                                    "hasSelection");

                    _.extend(this, config, _.clone(Backbone.Events));

                    if (this.loadVideo) {
                        this.loadVideo();
                    }

                    /**
                     * Handlebars helper to format a date to the configured format
                     * @alias module:Handlebars#formatDate
                     * @param  {date} date The date to format
                     * @return {string}      The formated date
                     */
                    Handlebars.registerHelper("formatDate", config.formatDate);

                    this.deleteOperation.start = _.bind(this.deleteOperation.start, this);
                    this.initDeleteModal();
                    $(this.playerAdapter).bind(PlayerAdapter.EVENTS.TIMEUPDATE, this.updateSelectionOnTimeUpdate);
                    this.views.main = new MainView(this.playerAdapter);
                },

                /**
                 * Display an alert modal
                 * @alias   annotationsTool.alertError
                 * @param  {String} message The message to display
                 */
                alertError: function (message) {
                    this.alertModal.show(message, this.alertModal.TYPES.ERROR);
                },

                /**
                 * Display an warning modal
                 * @alias   annotationsTool.alertWarning
                 * @param  {String} message The message to display
                 */
                alertWarning: function (message) {
                    this.alertModal.show(message, this.alertModal.TYPES.WARNING);
                },

                /**
                 * Display an information modal
                 * @alias   annotationsTool.alertInfo
                 * @param  {String} message The message to display
                 */
                alertInfo: function (message) {
                    this.alertModal.show(message, this.alertModal.TYPES.INFO);
                },

                /**
                 * Function to init the delete warning modal
                 * @alias   annotationsTool.initDeleteModal
                 */
                initDeleteModal: function () {
                    $("#dialogs").append(this.deleteModalTmpl({type: "annotation"}));
                    this.deleteModal = $("#modal-delete").modal({show: true, backdrop: false, keyboard: true });
                    this.deleteModal.modal("toggle");
                    this.deleteModalHeader  = this.deleteModal.find(".modal-header h3");
                    this.deleteModalContent = this.deleteModal.find(".modal-body");
                },

                /**
                 * Transform time in seconds (i.e. 12.344) into a well formated time (01:12:04)
                 * @alias   annotationsTool.getWellFormatedTime
                 * @param {number} the time in seconds
                 */
                getWellFormatedTime: function (time) {
                    var twoDigit = function (number) {
                            return (number < 10 ? "0" : "") + number;
                        },
                        base    = Math.round(time),
                        seconds = base % 60,
                        minutes = ((base - seconds) / 60) % 60,
                        hours   = (base - seconds - minutes * 60) / 3600;

                    return twoDigit(hours) + ":" + twoDigit(minutes) + ":" + twoDigit(seconds);
                },

                /**
                 * Check if the current browser is Safari 6
                 * @alias   annotationsTool.isBrowserSafari6
                 * @return {boolean} true if the browser is safari 6, otherwise false
                 */
                isBrowserSafari6: function () {
                    return (navigator.appVersion.search("Version/6") > 0 && navigator.appVersion.search("Safari") > 0);
                },

                /**
                 * Check if the current browser is Microsoft Internet Explorer 9
                 * @alias   annotationsTool.isBrowserIE9
                 * @return {boolean} true if the browser is IE9, otherwise false
                 */
                isBrowserIE9: function () {
                    return (navigator.appVersion.search("MSIE 9") > 0);
                },

                ///////////////////////////////////////////////
                // Function related to annotation selection  //
                ///////////////////////////////////////////////

                /**
                 * Set the given annotation as current selection
                 * @alias   annotationsTool.setSelection
                 * @param {Array} selection The new selection
                 * @param {Boolean} moveTo define if the video should be move to the start point of the selection
                 */
                setSelection: function (selection, moveTo, isManualSelected) {
                    this.currentSelection = selection;
                    this.isManualSelected = isManualSelected;

                    // if the selection is not empty, we move the playhead to it
                    if (_.isArray(selection) && selection.length > 0 && moveTo) {
                        this.playerAdapter.setCurrentTime(selection[0].get("start"));
                        this.isManualSelected = isManualSelected;
                    } else {
                        this.isManualSelected = isManualSelected;
                    }

                    // Trigger the selection event
                    this.trigger(this.EVENTS.ANNOTATION_SELECTION, this.currentSelection);
                },

                /**
                 * Returns the current selection of the tool
                 * @alias   annotationsTool.getSelection
                 * @return {Annotation} The current selection or undefined if no selection.
                 */
                getSelection: function () {
                    return this.currentSelection;
                },

                /**
                 * Informs if there is or not some items selected
                 * @alias   annotationsTool.hasSelection
                 * @return {Boolean} true if an annotation is selected or false.
                 */
                hasSelection: function () {
                    return (typeof this.currentSelection !== "undefined" && (_.isArray(this.currentSelection) && this.currentSelection.length > 0));
                },

                /**
                 * Listener for player "timeupdate" event to highlight the current annotations
                 * @alias   annotationsTool.updateSelectionOnTimeUpdate
                 */
                updateSelectionOnTimeUpdate: function () {
                    var currentTime = this.playerAdapter.getCurrentTime(),
                        selection = [],
                        annotations = [],
                        start,
                        duration,
                        end;

                    if (typeof this.video === "undefined" || this.isManualSelected) {
                        return;
                    }

                    this.video.get("tracks").each(function (track) {
                        annotations = annotations.concat(track.get("annotations").models);
                    }, this);

                    _.each(annotations, function (annotation) {

                        start    = annotation.get("start");
                        duration = annotation.get("duration");
                        end      = start + (duration < this.MINIMAL_DURATION ? this.MINIMAL_DURATION : duration);

                        if (_.isNumber(duration) && start <= currentTime && end >= currentTime) {
                            selection.push(annotation);
                        }

                    }, this);

                    this.setSelection(selection, false);
                },


                /**
                 * Delete the annotation with the given id with the track with the given track id
                 * @alias   annotationsTool.deleteAnnotation
                 * @param {Integer} annotationId The id of the annotation to delete
                 * @param {Integer} trackId Id of the track containing the annotation
                 */
                deleteAnnotation: function (annotationId, trackId) {
                    var annotation;

                    if (typeof trackId === "undefined") {
                        annotationsTool.video.get("tracks").each(function (track) {
                            if (track.get("annotations").get(annotationId)) {
                                trackId = track.get("id");
                            }
                        });
                    }

                    annotation = annotationsTool.video.getAnnotation(annotationId, trackId);

                    if (annotation) {
                        this.deleteOperation.start(annotation, this.deleteOperation.targetTypes.ANNOTATION);
                    } else {
                        console.warn("Not able to find annotation %i on track %i", annotationId, trackId);
                    }
                }

            };


            /**
             * Type of target that can be deleted using the delete warning modal
             *
             * Each type object must contain these elements
             *
             * {
             *   name: "Name of the type", // String
             *   getContent: function(target){ // Function
             *       return "Content of the target element"
             *   },
             *   destroy: function(target){ // Function
             *       // Delete the target
             *   }
             * }
             */
            annotationsTool.deleteOperation.targetTypes  = {

                ANNOTATION: {
                    name: "annotation",
                    getContent: function (target) {
                        return target.get("text");
                    },
                    destroy: function (target, callback) {

                        target.destroy({

                            success: function () {
                                if (annotationsTool.localStorage) {
                                    annotationsTool.video.get("tracks").each(function (value) {
                                        if (value.get("annotations").get(target.id)) {
                                            value.get("annotations").remove(target);
                                            value.save({wait: true});
                                            return false;
                                        }
                                    });
                                    annotationsTool.video.save();
                                }
                                if (callback) {
                                    callback();
                                }
                            },
                            error: function (error) {
                                console.warn("Cannot delete annotation: " + error);
                            }
                        });
                    }
                },


                COMMENT: {
                    name: "comment",
                    getContent: function (target) {
                        return target.get("text");
                    },
                    destroy: function (target, callback) {

                        target.destroy({

                            success: function () {
                                if (annotationsTool.localStorage) {
                                     if (target.collection) {
                                        target.collection.remove(target);
                                    }

                                    annotationsTool.video.save();
                                }
                                if (callback) {
                                    callback();
                                }
                            },
                            error: function (error) {
                                console.warn("Cannot delete comment: " + error);
                            }
                        });
                    }
                },

                LABEL: {
                    name: "label",
                    getContent: function (target) {
                        return target.get("value");
                    },
                    destroy: function (target, callback) {
                        target.destroy({

                            success: function () {
                                if (annotationsTool.localStorage) {
                                    if (target.collection) {
                                        target.collection.remove(target);
                                    }
                                    annotationsTool.video.save();
                                }
                                if (callback) {
                                    callback();
                                }
                            },
                            error: function (error) {
                                console.warn("Cannot delete label: " + error);
                            }
                        });
                    }
                },

                TRACK: {
                    name: "track",
                    getContent: function (target) {
                        return target.get("name");
                    },
                    destroy: function (track, callback) {
                        var annotations = track.get("annotations"),
                            /**
                             * Recursive function to delete synchronously all annotations
                             */
                            destroyAnnotation = function () {
                                var annotation;

                                // End state, no more annotation
                                if (annotations.length === 0) {
                                    return;
                                }
                                annotation = annotations.at(0);
                                annotation.destroy({
                                    error: function () {
                                        throw "Cannot delete annotation!";
                                    },
                                    success: function () {
                                        annotations.remove(annotation);
                                        destroyAnnotation();
                                    }
                                });
                            };
                        // Call the recursive function
                        destroyAnnotation();
                        track.destroy({
                            success: function () {
                                if (annotationsTool.localStorage) {
                                    annotationsTool.video.save();
                                }
                                if (callback) {
                                    callback();
                                }
                            },
                            error: function (error) {
                                console.warn("Cannot delete track: " + error);
                            }
                        });
                    }
                },

                CATEGORY: {
                    name: "category",
                    getContent: function (target) {
                        return target.get("name");
                    },
                    destroy: function (category, callback) {
                        var labels = category.get("labels"),
                            /**
                             * Recursive function to delete synchronously all labels
                             */
                            destroyLabels = function () {
                                var label;

                                // End state, no more label
                                if (labels.length === 0) {
                                    return;
                                }

                                label = labels.at(0);
                                label.destroy({
                                    error: function () {
                                        throw "Cannot delete label!";
                                    },
                                    success: function () {
                                        labels.remove(label);
                                        destroyLabels();
                                    }
                                });
                            };
                        // Call the recursive function
                        destroyLabels();
                        category.destroy({
                            success: function () {
                                if (annotationsTool.localStorage) {
                                    annotationsTool.video.save();
                                }
                                if (callback) {
                                    callback();
                                }
                            },
                            error: function (error) {
                                console.warn("Cannot delete category: " + error);
                            }
                        });
                    }
                },

                SCALEVALUE: {
                    name: "scale value",
                    getContent: function (target) {
                        return target.get("name");
                    },
                    destroy: function (target, callback) {

                        target.destroy({

                            success: function () {
                                if (window.annotationsTool.localStorage) {
                                    if (target.collection) {
                                        target.collection.remove(target);
                                    }

                                    annotationsTool.video.save();
                                }
                                if (callback) {
                                    callback();
                                }
                            },

                            error: function (error) {
                                console.warn("Cannot delete scale value: " + error);
                            }
                        });
                    }
                },

                SCALE: {
                    name: "scale",
                    getContent: function (target) {
                        return target.get("name");
                    },
                    destroy: function (scale, callback) {
                        var scaleValues = scale.get("scaleValues"),
                            /**
                             * Recursive function to delete synchronously all scaleValues
                             */
                            destroyScaleValues = function () {
                                var scaleValue;
                                // End state, no more label
                                if (scaleValues.length === 0) {
                                    return;
                                }
                                scaleValue = scaleValues.at(0);
                                scaleValue.destroy({
                                    error: function () {
                                        throw "Cannot delete scaleValue!";
                                    },
                                    success: function () {
                                        scaleValues.remove(scaleValue);
                                        destroyScaleValues();
                                    }
                                });
                            };

                        // Call the recursive function
                        destroyScaleValues();

                        scale.destroy({
                            success: function () {
                                if (window.annotationsTool.localStorage) {
                                    annotationsTool.video.save();
                                }
                                if (callback) {
                                    callback();
                                }
                            },
                            error: function (error) {
                                console.warn("Cannot delete scale: " + error);
                            }
                        });
                    }
                }
            };

            return annotationsTool;
        }
);