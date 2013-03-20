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
 * A module representing the main view
 * @module views-main
 * @requires jQuery
 * @requires prototype-player_adapter
 * @requires collections-annotations
 * @requires views-annotate
 * @requires views-list
 * @requires views-timeline
 * @requires views-login
 * @requires views-scale-editor
 * @requires models-user
 * @requires models-track
 * @requires models-video
 * @requires backbone-annotations-sync
 * @requires roles
 * @requires filters-manager
 * @requires backbone
 * @requires localstorage
 * @requires bootstrap
 * @requires bootstrap.carousel
 * @requires boutstrap.tab
 */
define(["jquery",
        "prototypes/player_adapter",
        "views/annotate",
        "views/list",
        "views/timeline",
        "views/login",
        "views/scale-editor",
        "collections/annotations",
        "collections/users",
        "collections/videos",
        "models/user",
        "models/track",
        "models/video",
        "backbone-annotations-sync",
        "roles",
        "FiltersManager",
        "backbone",
        "localstorage",
        "bootstrap",
        "carousel",
        "tab"],

    function ($, PlayerAdapter, AnnotateView, ListView, TimelineView, LoginView, ScaleEditorView,
              Annotations, Users, Videos, User, Track, Video, AnnotationSync, ROLES, FiltersManager, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-main
         * @alias module:views-main.MainView
         */
        var MainView = Backbone.View.extend({

            /**
             * Main container of the appplication
             * @alias module:views-main.MainView#el
             * @type {Dom Element}
             */
            el: $("body"),

            /**
             * The player adapter passed during initialization part
             * @alias module:views-main.MainView#playerAdapter
             * @type {playerAdapter}
             */
            playerAdapter: null,

            /**
             * jQuery element for the loading box
             * @alias module:views-main.MainView#loadingBox
             * @type {jQuery Object}
             */
            loadingBox: $("div#loading"),

            /**
             * Events to handle by the main view
             * @alias module:views-main.MainView#event
             * @type {Map}
             */
            events: {
                "click #logout": "logout",
                "click #print" : "print"
            },

            /**
             * Constructor
             * @alias module:views-main.MainView#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (playerAdapter) {
                if ((annotationsTool.isBrowserIE9() && !(playerAdapter.__proto__ instanceof PlayerAdapter)) ||
                    (!annotationsTool.isBrowserIE9() && !(playerAdapter instanceof PlayerAdapter))) {
                    throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
                }

                _.bindAll(this, "logout",
                                "checkUserAndLogin",
                                "initModels",
                                "createViews",
                                "setLoadingProgress",
                                "onDeletePressed",
                                "onWindowResize",
                                "print");

                this.setLoadingProgress(10, "Starting tool.");

                // Load the good storage module
                if (window.annotationsTool.localStorage) {
                    // Local storage module
                    Backbone.sync = Backbone.localSync;

                    // Remove link for statistics exports, work only with backend implementation
                    this.$el.find("#export").parent().remove();
                } else {
                    this.$el.find("#export").attr("href", annotationsTool.exportUrl);
                    // REST annotations storage module
                    Backbone.sync = AnnotationSync;
                }

                this.playerAdapter = playerAdapter;

                this.setLoadingProgress(20, "Get users saved locally.");

                // Create a new users collection and get exciting local user
                annotationsTool.users = new Users();

                Backbone.localSync("read", annotationsTool.users, {
                    success: function (data) {
                        annotationsTool.users.add(data);
                    },
                    error: function (error) {
                        console.warn(error);
                    }
                });

                this.loginView              = new LoginView();
                annotationsTool.scaleEditor = new ScaleEditorView();

                annotationsTool.dispatcher  = _.clone(Backbone.Events);

                this.listenTo(annotationsTool.users, "login", this.createViews);
                this.listenTo(annotationsTool.dispatcher, "deleteAnnotation", this.deleteAnnotation);

                this.checkUserAndLogin();

                $(window).resize(this.onWindowResize);
                $(window).bind("keydown", $.proxy(this.onDeletePressed, this));

                annotationsTool.filtersManager   = new FiltersManager();
                annotationsTool.importCategories = this.importCategories;

                this.onWindowResize();
            },

            /**
             * Create the views for the annotations
             * @alias module:views-main.MainView#createViews
             */
            createViews: function () {
                this.setLoadingProgress(40, "Start creating views.");

                $("#video-container").show();

                this.setLoadingProgress(45, "Start loading video.");

                this.initModels($.proxy(function () {

                    /**
                     * Loading the video dependant views
                     */
                    var loadVideoDependantView = $.proxy(function () {
                        $(this.playerAdapter).off(PlayerAdapter.EVENTS.READY + " " + PlayerAdapter.EVENTS.PAUSE, loadVideoDependantView);

                        this.setLoadingProgress(60, "Start creating views.");


                        if (annotationsTool.getLayoutConfiguration().timeline) {
                            // Create views with Timeline
                            this.setLoadingProgress(70, "Creating timeline.");
                            this.timelineView = new TimelineView({playerAdapter: this.playerAdapter});
                        }

                        if (annotationsTool.getLayoutConfiguration().annotate) {
                            // Create view to annotate
                            this.setLoadingProgress(80, "Creating annotate view.");
                            this.annotateView = new AnnotateView({playerAdapter: this.playerAdapter});
                            this.listenTo(this.annotateView, "change-layout", this.onWindowResize);
                            this.annotateView.$el.show();
                        }

                        if (annotationsTool.getLayoutConfiguration().list) {
                            // Create annotations list view
                            this.setLoadingProgress(90, "Creating list view.");
                            this.listView = new ListView();
                            this.listenTo(this.listView, "change-layout", this.onWindowResize);
                            this.listView.$el.show();
                        }

                        this.setLoadingProgress(100, "Ready.");
                        this.loadingBox.hide();

                        this.onWindowResize();

                        // Show logout button
                        $("a#logout").css("display", "block");
                        this.timelineView.redraw();
                    }, this);

                    this.playerAdapter.load();

                    // Initialize the player
                    this.loadingBox.find(".info").text("Initializing the player.");

                    if (this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED) {
                        loadVideoDependantView();
                    } else {
                        $(this.playerAdapter).on(PlayerAdapter.EVENTS.READY + " " + PlayerAdapter.EVENTS.PAUSE, loadVideoDependantView);
                    }

                }, this));
            },

            /**
             * Check if an user are logged into the tool, otherwise display the login modal
             * @alias module:views-main.MainView#checkUserAndLogin
             */
            checkUserAndLogin: function () {
                this.setLoadingProgress(30, "Get current user.");

                // If a user has been saved locally, we take it as current user
                if (annotationsTool.users.length > 0) {
                    annotationsTool.user = annotationsTool.users.at(0);
                    this.createViews();
                } else {
                    this.loginView.show();
                }
            },

            /**
             * Logout from the tool
             * @alias module:views-main.MainView#logout
             */
            logout: function () {
                // Stop the video
                this.playerAdapter.pause();

                 // Hide logout button
                $("a#logout").hide();

                // Hide/remove the views
                annotationsTool.playerAdapter.pause();
                annotationsTool.playerAdapter.setCurrentTime(0);
                $("#video-container").hide();

                if (annotationsTool.getLayoutConfiguration().timeline) {
                    this.timelineView.reset();
                }

                if (annotationsTool.getLayoutConfiguration().annotate) {
                    this.annotateView.reset();
                }

                if (annotationsTool.getLayoutConfiguration().list) {
                    this.listView.reset();
                }

                this.loginView.reset();

                // Delete the different objects
                delete annotationsTool.tracks;
                delete annotationsTool.video;
                delete annotationsTool.user;

                this.loadingBox.find(".bar").width("0%");
                this.loadingBox.show();
                this.loginView.show();

                annotationsTool.users.each(function (user) {

                    Backbone.localSync("delete", user, {
                        success: function () {
                            console.log("current session destroyed.");
                        },
                        error: function (error) {
                            console.warn(error);
                        }
                    });

                });

                if (annotationsTool.logoutUrl) {
                    document.location = annotationsTool.logoutUrl;
                }
            },

            /**
             * Print the annotations
             * @alias module:views-main.MainView#print
             */
            print: function () {
                window.focus();
                if (document.readyState === "complete") {
                    window.print();

                    // If is Chrome, we need to refresh the window
                    if (/chrome/i.test(navigator.userAgent)) {
                        document.location.reload(false);
                    }
                } else {
                    setTimeout(this.print, 1000);
                }
            },

            /**
             * Get all the annotations for the current user
             * @alias module:views-main.MainView#initModels
             * @param {Function} callback Callback function
             */
            initModels: function (callback) {
                var video,
                    videos = new Videos(),
                    tracks,
                    annotations,
                    selectedTrack,
                    remindingFetchingTrack,

                    // function to conclude the retrive of annotations
                    concludeInitialization = $.proxy(function () {

                        // At least one private track should exist, we select the first one
                        selectedTrack = tracks.getMine()[0];

                        if (!selectedTrack.get("id")) {
                            selectedTrack.bind("ready", function () {
                                concludeInitialization();
                                return;
                            }, this);
                        } else {
                            annotationsTool.selectedTrack = selectedTrack;
                        }

                        // Use to know if all the tracks have been fetched
                        remindingFetchingTrack = tracks.length;

                        // Function to add the different listener to the annotations
                        tracks.each(function (track) {
                            annotations = track.get("annotations");
                            this.listenTo(annotations, "add", this.onWindowResize);
                            if (--remindingFetchingTrack === 0) {
                                callback();
                            }
                        }, this);

                    }, this),

                    /**
                     * Create a default track for the current user if no private track is present
                     */
                    createDefaultTrack = function () {

                        tracks = annotationsTool.video.get("tracks");

                        if (annotationsTool.localStorage) {
                            tracks = tracks.getVisibleTracks();
                        }

                        if (tracks.getMine().length === 0) {
                            tracks.create({name: "Default " + annotationsTool.user.get("nickname"), description: "Default track for user " + annotationsTool.user.get("name")}, {
                                wait: true,
                                success: concludeInitialization
                            });
                        } else {
                            concludeInitialization();
                        }
                    };

                // If we are using the localstorage
                if (window.annotationsTool.localStorage) {
                    videos.fetch();

                    if (videos.length === 0) {
                        video = videos.create({video_extid: annotationsTool.getVideoExtId()}, {wait: true});
                    } else {
                        video = videos.at(0);
                    }

                    annotationsTool.video = video;
                    createDefaultTrack();
                } else { // With Rest storage
                    videos.add({video_extid: annotationsTool.getVideoExtId()});
                    video = videos.at(0);
                    annotationsTool.video = video;
                    video.save();
                    if (video.get("ready")) {
                        createDefaultTrack();
                    } else {
                        video.once("ready", createDefaultTrack);
                    }
                }
            },

            /**
             * Import the given categories in the tool
             * @alias module:views-main.MainView#importCategories
             * @param {PlainObject} imported Object containing the .categories and .scales to insert in the tool
             * @param {PlainObject} defaultCategoryAttributes The default attributes to use to insert the imported categories (like access)
             */
            importCategories: function (imported, defaultCategoryAttributes) {
                var videoCategories = annotationsTool.video.get("categories"),
                    videoScales = annotationsTool.video.get("scales"),
                    labelsToAdd,
                    newCat,
                    newScale,
                    scaleValuesToAdd,
                    scaleOldId,
                    scalesIdMap = {};

                if (!imported.categories || imported.categories.length === 0) {
                    return;
                }

                _.each(imported.scales, function (scale) {
                    scaleOldId = scale.id;
                    scaleValuesToAdd = scale.scaleValues;
                    delete scale.id;
                    delete scale.scaleValues;

                    newScale = videoScales.create(scale, {async: false});
                    scalesIdMap[scaleOldId] = newScale.get("id");

                    if (scaleValuesToAdd) {
                        _.each(scaleValuesToAdd, function (scaleValue) {
                            scaleValue.scale = newScale;
                            newScale.get("scaleValues").create(scaleValue);
                        });
                    }
                });

                _.each(imported.categories, function (category) {
                    labelsToAdd = category.labels;
                    category.scale_id = scalesIdMap[category.scale_id];
                    delete category.labels;
                    newCat = videoCategories.create(_.extend(category, defaultCategoryAttributes));

                    if (labelsToAdd) {
                        _.each(labelsToAdd, function (label) {
                            label.category = newCat;
                            newCat.get("labels").create(label);
                        });
                    }
                });
            },

            /**
             * Annotation through the "<-" key
             * @alias module:views-main.MainView#onDeletePressed
             * @param  {Event} event Event object
             */
            onDeletePressed: function (event) {
                var annotation;

                if (event.keyCode !== 8 ||
                    document.activeElement.tagName.toUpperCase() === "TEXTAREA" ||
                    document.activeElement.tagName.toUpperCase() === "INPUT" ||
                    !annotationsTool.hasSelection()) {
                    return;
                } else {
                    event.preventDefault();

                    annotation = annotationsTool.getSelection()[0];
                    if (annotation) {
                        annotationsTool.dispatcher.trigger("deleteAnnotation", annotation.get("id"), annotation.trackId);
                    }
                }
            },

            /**
             * Delete the annotation with the given id with the track with the given track id
             * @alias module:views-main.MainView#deleteAnnotation
             * @param {integer} annotationId The id of the annotation to delete
             * @param {integer} trackId Id of the track containing the annotation
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
                    annotationsTool.deleteOperation.start(annotation, annotationsTool.deleteOperation.targetTypes.ANNOTATION);
                } else {
                    console.warn("Not able to find annotation %i on track %i", annotationId, trackId);
                }
            },

            /**
             * Listener for window resizing
             * @alias module:views-main.MainView#onWindowResize
             */
            onWindowResize: function () {
                var listContent,
                    windowHeight;

                if (this.annotateView && this.listView) {
                    windowHeight = $(window).height();
                    listContent = this.listView.$el.find("#content-list");
                    listContent.css("max-height", windowHeight - $("#annotate-container").height() - 100);
                    this.timelineView.$el.find("#timeline").css("max-height", windowHeight - ($("#video-container").height() + 130));
                }
            },
            /**
             * Update loading box with given percent & message
             * @alias module:views-main.MainView#setLoadingProgress
             * @param {integer} percent loaded of the tool
             * @param {string} current loading operation message
             */
            setLoadingProgress: function (percent, message) {
                this.loadingBox.find(".bar").width(percent + "%");
                this.loadingBox.find(".info").text(message);
            }
        });
        return MainView;
    }
);