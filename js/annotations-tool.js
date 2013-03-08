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

define(['jquery',
        'backbone',
        'views/main',
        'text!templates/delete-modal.tmpl',
        'text!templates/delete-warning-content.tmpl',
        'handlebars'],
       
        function($, Backbone, MainView, DeleteModalTmpl,DeleteContentTmpl, Handlebars) {
            
            var self = this;

            /**
             * Transform time in seconds (i.e. 12.344) into a well formated time (01:12:04)
             *
             * @param {number} the time in seconds
             */
            annotationsTool.getWellFormatedTime = function (time) {
                    var twoDigit = function(number) {
                            return(number < 10 ? "0" : "") + number;
                        },
                        base    = Math.round(time),
                        seconds = base % 60,
                        minutes = ((base - seconds) / 60) % 60,
                        hours   = (base - seconds - minutes * 60) / 3600;

                    return twoDigit(hours) + ":" + twoDigit(minutes) + ":" + twoDigit(seconds);
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
            deleteTargetTypes = {
                
                ANNOTATION: {
                    name: "annotation",
                    getContent: function(target){
                        return target.get("text");
                    },
                    destroy: function(target,callback){

                        target.destroy({
                            
                            success: function(){
                                if(annotationsTool.localStorage){

                                    annotationsTool.video.get("tracks").each(function(value,index){
                                        if(value.get("annotations").get(target.id)){
                                            value.get("annotations").remove(target)
                                            value.save({wait:true})
                                            return false;
                                        }
                                    });

                                    annotationsTool.video.save();
                                }
                                
                                if(callback)
                                    callback();
                            },
                            
                            error: function(error){
                                console.warn("Cannot delete annotation: "+error);
                            }
                        });
                            
                    }
                },

                LABEL: {
                    name: "label",
                    getContent: function(target){
                        return target.get("value");
                    },
                    destroy: function(target,callback){

                        target.destroy({
                            
                            success: function(){
                                if(annotationsTool.localStorage){
                                    if(target.collection)
                                      target.collection.remove(target);

                                    annotationsTool.video.save();
                                }
                                
                                if(callback)
                                    callback();
                            },
                            
                            error: function(error){
                                console.warn("Cannot delete label: "+error);
                            }
                        });
                            
                    }
                },
                
                TRACK: {
                    name: "track",
                    getContent: function(target){
                        return target.get("name");
                    },
                    destroy: function(track,callback){
                            var annotations = track.get("annotations");
            
                            /**
                             * Recursive function to delete synchronously all annotations
                             */
                            var destroyAnnotation = function(){
                              // End state, no more annotation
                              if(annotations.length == 0)
                                return;
                              
                              var annotation = annotations.at(0);
                              annotation.destroy({
                                error: function(){
                                  throw "Cannot delete annotation!";
                                },
                                success: function(){
                                  annotations.remove(annotation);
                                  destroyAnnotation();
                                }
                              });
                            };
                            
                            // Call the recursive function 
                            destroyAnnotation();
                            
                            track.destroy({
                                success: function(){
                                    if(annotationsTool.localStorage)
                                        annotationsTool.video.save();
                                
                                    if(callback)
                                        callback();
                                },
                            
                                error: function(error){
                                    console.warn("Cannot delete track: "+error);
                                }
                            })
                    }
                },

                CATEGORY: {
                    name: "category",
                    getContent: function(target){
                        return target.get("name");
                    },
                    destroy: function(category,callback){
                            var labels = category.get("labels");
            
                            /**
                             * Recursive function to delete synchronously all labels
                             */
                            var destroyLabels = function(){
                              // End state, no more label
                              if(labels.length == 0)
                                return;
                              
                              var label = labels.at(0);
                              label.destroy({
                                error: function(){
                                  throw "Cannot delete label!";
                                },
                                success: function(){
                                  labels.remove(label);
                                  destroyLabels();
                                }
                              });
                            };
                            
                            // Call the recursive function 
                            destroyLabels();
                            
                            category.destroy({
                                success: function(){
                                    if(annotationsTool.localStorage)
                                        annotationsTool.video.save();
                                
                                    if(callback)
                                        callback();
                                },
                            
                                error: function(error){
                                    console.warn("Cannot delete category: "+error);
                                }
                            })
                    }
                },

                SCALEVALUE: {
                    name: "scale value",
                    getContent: function(target){
                        return target.get("name");
                    },
                    destroy: function(target, callback){

                        target.destroy({
                            
                            success: function(){
                                if (window.annotationsTool.localStorage) {
                                    if(target.collection)
                                      target.collection.remove(target);

                                    annotationsTool.video.save();
                                }
                                
                                if(callback)
                                    callback();
                            },
                            
                            error: function(error){
                                console.warn("Cannot delete scale value: "+error);
                            }
                        });
                            
                    }
                },                

                SCALE: {
                    name: "scale",
                    getContent: function(target){
                        return target.get("name");
                    },
                    destroy: function(scale, callback){
                            var scaleValues = scale.get("scaleValues");
            
                            /**
                             * Recursive function to delete synchronously all scaleValues
                             */
                            var destroyScaleValues = function(){
                              // End state, no more label
                              if(scaleValues.length == 0)
                                return;
                              
                              var scaleValue = scaleValues.at(0);
                              scaleValue.destroy({
                                error: function(){
                                  throw "Cannot delete scaleValue!";
                                },
                                success: function(){
                                  scaleValues.remove(scaleValue);
                                  destroyScaleValues();
                                }
                              });
                            };
                            
                            // Call the recursive function 
                            destroyScaleValues();
                            
                            scale.destroy({
                                success: function(){
                                    if(window.annotationsTool.localStorage) {
                                        annotationsTool.video.save();
                                    }
                                
                                    if(callback)
                                        callback();
                                },
                            
                                error: function(error){
                                    console.warn("Cannot delete scale: "+error);
                                }
                            })
                    }
                }
            };
            
            self.deleteModalTmpl = Handlebars.compile(DeleteModalTmpl);
            self.deleteContentTmpl = Handlebars.compile(DeleteContentTmpl);
            
            /**
             * Function to init the delete warning modal
             */
            self.initDeleteModal = function(){
                    annotationsTool.deleteOperation = {};
                    annotationsTool.deleteOperation.targetTypes = deleteTargetTypes;
                
                    $('#dialogs').append(deleteModalTmpl({type:"annotation"}));
                    self.deleteModal = $('#modal-delete').modal({show: true, backdrop: false, keyboard: true });
                    self.deleteModal.modal("toggle");
                    self.deleteModalHeader  = self.deleteModal.find(".modal-header h3");
                    self.deleteModalContent = self.deleteModal.find(".modal-body");
            };
            
            /**
             * Function to load the video file
             *
             * This part is specific to each integration of the annotation tool
             */
            self.loadVideo = function(){
                // Add your loading code here!
            }
            
            
            return {            
                
                start: function() {
                        self.initDeleteModal();
                        self.loadVideo();  
                    
                        var playerAdapter = annotationsTool.playerAdapter;
                        
                        /**
                         * Function to delete element with warning
                         *
                         * @param {Object} target Element to be delete
                         * @param {TargetsType} type Type of the target to be deleted
                         */
                        annotationsTool.deleteOperation.start = function(target,type,callback){
                            // Change modal title
                            self.deleteModalHeader.text('Delete '+type.name);
                            
                            // Change warning content
                            self.deleteModalContent.html(self.deleteContentTmpl({
                               type: type.name,
                               content: type.getContent(target)
                            }));
                            
                            // Listener for delete confirmation
                            self.deleteModal.find('#confirm-delete').one('click',function(){
                                type.destroy(target,callback);
                                self.deleteModal.modal("toggle");
                            });

                            var confirmWithEnter = function(e){                                
                                if(e.keyCode == 13){
                                    type.destroy(target,callback);
                                    self.deleteModal.modal("toggle");
                                }
                            }

                            // Add possiblity to confirm with return key
                            $(window).bind('keypress',confirmWithEnter);
                            
                            // Unbind the listeners when the modal is hidden
                            self.deleteModal.one("hide",function(){
                                $('#confirm-delete').unbind('click');
                                $(window).unbind('keypress',confirmWithEnter);
                            });
                            
                            // Show the modal
                            self.deleteModal.modal("show");
                        };
                        
                        var mainView = new MainView(playerAdapter);
                }
            };
        }
);