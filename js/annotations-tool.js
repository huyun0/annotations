define(['order!jquery',
        'order!underscore',
        'order!views/main',
        'order!text!templates/delete-modal.tmpl',
        'order!text!templates/delete-warning-content.tmpl',
        'order!libs/handlebars'],
       
        function($, _undefined_, MainView, DeleteModalTmpl,DeleteContentTmpl) {
            
            var self = this;
            
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
                        console.log("Delete annotation");

                        target.destroy({
                            
                            success: function(){
                                if(annotationsTool.localStorage)
                                    annotationsTool.video.save();
                                
                                if(callback)
                                    callback();
                            },
                            
                            error: function(error){
                                console.warn("Cannot delete annotation: "+error);
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
                    self.deleteModalContent  = self.deleteModal.find(".modal-body");
            };
            
            
            return {            
                
                start: function() {
                        self.initDeleteModal();
                    
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
                            
                            // Unbind the listeners when the modal is hidden
                            self.deleteModal.one("hide",function(){
                                $('#confirm-delete').unbind('click');
                            });
                            
                            // Show the modal
                            self.deleteModal.modal("toggle");
                        };
                        
                        var mainView = new MainView(playerAdapter);
                }
            };
        }
);