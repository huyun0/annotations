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
 * A module representing the scale editor
 * @module views-scale-editor
 * @requires jQuery
 * @requires Backbone
 * @requires models-scale
 * @requires collections-scales
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
             * @memberOf module:views-scale-editor
             * @alias ScaleEditor
             */
            var ScaleEditor = Backbone.View.extend({

                tagName: "div",

                className: "scale-value",

                scaleEditorTemplate: Handlebars.compile(ScaleValueEditorTmpl),

                /**
                 * Events to handle
                 * @alias module:views-scale-editor.ScaleEditor#events
                 * @type {object}
                 */
                events: {
                    "click .order-up": "up",
                    "click .order-down": "cancel",
                    "click .delete": "startEditScale",
                    "click a.create-scale": "createScale",
                    "change select#scale-id": "changeScale",
                    "keydown #save-scale": "saveOnInsert"
                },

                /**
                 * Constructor
                 * @alias module:views-scale-editor.Login#initialize
                 */
                initialize: function (attr) {

                    _.bindAll(this, 
                            "saveOnInsert",
                            "save",
                            "startEditScale",
                            "createScale",
                            "changeScale",
                            "cancel",
                            "reset",
                            "renderEditContent",
                            "show",
                            "hide");

                    _.extend(this, Backbone.Events);

                    this.model    = attr.model;
                    this.isNew    = attr.isNew;
                    this.next     = attr.next;
                    this.previous = attr.previous;

                    this.$el.append(this.scaleEditorTemplate({localStorage:annotationsTool.localStorage}));
                    this.$el.modal({show: true, backdrop: false, keyboard: false });
                    this.$el.modal("hide");
                    
                },

                show: function(category) {
                    var scales = annotationsTool.video.get("scales").toJSON(),
                        selectedScale,
                        templateParams = {
                            scales: scales,
                            title: this.TITLES.STANDALONE_EDIT
                        };

                    this.EMPTY_SCALE.isSelected = false;

                    if (category) {
                        scales.push(this.EMPTY_SCALE);
                        templateParams.title = this.TITLES.CATEGORY_EDIT;
                        if (category.get("scale_id")) {
                            selectedScale = _.find(scales, function (scale) { 
                                                    return scale.id === category.get("scale_id");
                                            });

                            if (selectedScale) {
                                this.currentScaleId = category.get("scale_id");
                                selectedScale.isSelected = true;
                            }
                        } else {
                            this.EMPTY_SCALE.isSelected = true;
                        }
                    }

                    this.$el.empty();
                    this.$el.append(this.scaleEditorTemplate(templateParams));
                    this.changeScale();
                    this.$el.modal("show");
                },

                hide: function () {
                    this.$el.modal("hide");

                    if (this.category) {
                        delete this.category;
                    }
                },
                  
                  
                /**
                 * Login by pressing "Enter" key
                 */
                saveOnInsert: function (e) {
                    if (e.keyCode === 13) {
                        this.save();
                    }
                },
                  
                /**
                 * Log the current user of the tool
                 *
                 * @return {User} the current user
                 */
                save: function () {
                    // Fields from the login form
                    var userId          = annotationsTool.getUserExtId(),
                        userNickname    = this.$el.find("#nickname"),
                        userEmail       = this.$el.find("#email"),
                        userRemember    = this.$el.find("#remember"),
                        userError       = this.$el.find(".alert"),
                       
                        valid  = true, // Variable to keep the form status in memory
                        user; // the new user

                    userError.find("#content").empty();
                    
                    // Try to create a new user
                    try {

                        if (annotationsTool.localStorage) {
                            user = annotationsTool.users.create({user_extid: userId,
                                                              nickname: userNickname.val(),
                                                              role: this.$el.find("#supervisor")[0].checked ? ROLES.SUPERVISOR : ROLES.USER},
                                                              {wait: true});
                        } else {
                            user = annotationsTool.users.create({user_extid: userId, nickname: userNickname.val()}, {wait: true});
                        }
                        
                        // Bind the error user to a function to display the errors
                        user.bind("error", $.proxy(function (model, error) {
                            this.$el.find("#" + error.attribute).parentsUntil("form").addClass("error");
                            userError.find("#content").append(error.message + "<br/>");
                            valid = false;
                        }, this));

                    } catch (error) {
                        valid = false;
                        userError.find("#content").append(error + "<br/>");
                    }
                    
                    // If email is given, we set it to the user
                    if (user && userEmail.val()) {
                        user.set({email: userEmail.val()});
                    }
                    
                    // If user not valid
                    if (!valid) {
                        this.$el.find(".alert").show();
                        return undefined;
                    }
                    
                    // If we have to remember the user
                    if (userRemember.is(":checked")) {
                        annotationsTool.users.add(user);
                        Backbone.localSync("create", user, {
                            success: function () {
                                console.log("current user saved locally");
                            },
                            error: function (error) {
                                console.warn(error);
                            }
                        });
                    }
                    user.save();

                    annotationsTool.user = user;
                    this.$el.modal("toggle");
                    
                    annotationsTool.users.trigger("login");
                        
                    return user;
                },


                cancel: function () {
                    if (this.isInEditMode) {
                        this.isInEditMode = false;
                        this.$el.find(".modal-body").hide();
                    } else {
                        this.hide();
                    }
                },

                changeScale: function () {
                    this.currentScaleId = this.$el.find("select#scale-id").val();

                    if (!this.currentScaleId || this.currentScaleId === this.EMPTY_SCALE.id) {
                        this.$el.find("a.edit-scale").hide();
                        this.$el.find(".modal-body").hide();
                    } else {
                        this.$el.find("a.edit-scale").show();
                        this.renderEditContent();
                    }
                },

                createScale: function () {
                    this.isInEditMode = true;
                    this.$el.find("a#save-scale").text(this.TITLES.CREATE_BUTTON);
                    this.$el.find(".modal-body").show();
                },

                startEditScale: function () {
                    this.isInEditMode = true;
                    this.$el.find("a#save-scale").text(this.TITLES.SAVE_BUTTON);
                    this.$el.find(".modal-body").show();
                },

                renderEditContent: function () {
                    var scale = annotationsTool.video.get("scales").get(this.currentScaleId);

                    this.$el.find(".modal-body").empty().append(this.scaleEditorContentTemplate(scale.toJSON()));
                },

                reset: function () {
                    this.$el.find("#nickname")[0].value = "";
                    this.$el.find("#email")[0].value = "";
                    this.$el.find("#remember")[0].value = "";
                    //this.$el.modal("toggle");
                }

            });

            return ScaleEditor;

        }
);