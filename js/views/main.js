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

define(["order!jquery",
        "order!prototypes/player_adapter",
        "order!collections/annotations",
        "order!views/annotate",
        "order!views/list",
        "order!views/timeline",
        "order!collections/users",
        "order!models/user",
        "order!models/track",
        "order!models/video",
        "order!collections/videos",
        "order!backbone-annotations-sync",
        "order!text!templates/user-login.tmpl",
        "order!backbone",
        "order!localstorage",
        "order!underscore",
        "order!libs/bootstrap/bootstrap.min",
        "order!libs/bootstrap/tab"],
       
       function($,PlayerAdapter,Annotations,AnnotateView,ListView,TimelineView,Users,User,Track,Video,Videos,AnnotationSync,LoginTmpl){

    /**
     * Main view of the application
     */
    var MainView = Backbone.View.extend({
      
      /** Main container of the appplication */
      el: $('body'),
      
      /** The player adapter passed during initialization part */
      playerAdapter: null,
      
      /** jQuery element for the user login */
      userModal: null,
      
      /** jQuery element for the loading box */
      loadingBox: $('div#loading'),
      
      /** Events to handle by the main view */
      events: {
        "click #save-user": "login",
        "click #logout" : "logout",
        "keydown #user-login": "loginOnInsert"
      },
      
      initialize: function(playerAdapter){
        if(!PlayerAdapter.prototype.isPrototypeOf(playerAdapter.__proto__))
            throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
        
        _.bindAll(this,"login",
                       "logout",
                       "loginOnInsert",
                       "checkUserAndLogin",
                       "getAnnotations",
                       "createViews",
                       "loadLoginModal",
                       "setLoadingProgress",
                       "onWindowResize");
        
        this.setLoadingProgress(10,"Starting tool.");
        
        // Load the good storage module
        if(window.annotationsTool.localStorage){
          // Local storage module 
          Backbone.sync = Backbone.localSync;
        }
        else{
          // REST annotations storage module
          Backbone.sync = AnnotationSync;
        }
        
        this.playerAdapter = playerAdapter;
        
        
        this.setLoadingProgress(20,"Get users saved locally.");
        
        // Create a new users collection and get exciting local user
        annotationsTool.users = new Users();
        Backbone.localSync("read",annotationsTool.users,{
          success: function(data){
              annotationsTool.users.add(data);
          },
          error: function(error){
            console.warn(error);
          }
        });
        
        this.checkUserAndLogin(); 

        $(window).resize(this.onWindowResize);   

        this.onWindowResize();  
      },
        
      /**
       * Create the views for the annotations
       */
      createViews: function(){
        this.setLoadingProgress(40,"Start creating views.");
        
        $('#video-container').show();
        
        this.setLoadingProgress(45,"Start loading video.");
        
        this.getAnnotations($.proxy(function(){  
         
          /**
           * Loading the video dependant views
           */
          var loadVideoDependantView = $.proxy(function(){
              this.setLoadingProgress(60,"Start creating views.");
              
              // Create views with Timeline
              this.setLoadingProgress(70,"Creating timeline.");
              this.timelineView = new TimelineView({playerAdapter: this.playerAdapter});
              
              // Create views to annotate and see annotations list
              this.setLoadingProgress(80,"Creating annotatie view.");
              this.annotateView = new AnnotateView({playerAdapter: this.playerAdapter});
              this.annotateView.$el.show();
              
              // Create annotations list view
              this.setLoadingProgress(90,"Creating list view.");
              this.listView = new ListView();
              this.listView.$el.show();
              
              this.setLoadingProgress(100,"Ready.");
              this.loadingBox.hide();
              
              // Show logout button
              $('a#logout').css('display','block');
          },this);
          
          this.playerAdapter.load();
          
          // Initialize the player
          this.loadingBox.find('.info').text('Initializing the player.');
          
          if(this.playerAdapter.getStatus() ===  PlayerAdapter.STATUS.PAUSED){
             loadVideoDependantView();
          }
          else{
            $(this.playerAdapter).one(PlayerAdapter.EVENTS.READY+' '+PlayerAdapter.EVENTS.PAUSE,loadVideoDependantView);
          }
          
        },this));        
      },


      ////////////////////////
      // Login/out function //
      ////////////////////////

      
      checkUserAndLogin: function(){
        this.setLoadingProgress(30,"Get current user.");
        
        // If a user has been saved locally, we take it as current user
        if(annotationsTool.users.length >0){
            annotationsTool.user = annotationsTool.users.at(0);
            this.createViews();
        }
        else{
          this.loadLoginModal();
        }
      },
      
      loadLoginModal: function(){
        if(!this.userModal){
            // Otherwise we load the login modal
            this.$el.append(LoginTmpl);
            this.userModal = $('#user-login');
            this.userModal.modal({show: true, backdrop: true, keyboard: false });
            this.userModal.on("hide",function(){
                // If user not set, display the login window again
                if(_.isUndefined(annotationsTool.user))
                    setTimeout(function(){$('#user-login').modal('show')},5);
            });
        }
        else{
          this.userModal.find('#nickname')[0].value = '';
          this.userModal.find('#email')[0].value = '';
          this.userModal.find('#remember')[0].value = '';
          this.userModal.modal("toggle");
        }
        
      },
      
      /**
       * Log the user out
       */
      logout: function(){
        // Stop the video
        this.playerAdapter.pause();
        
         // Hide logout button
        $('a#logout').hide();
        
        // Hide/remove the views
        annotationsTool.playerAdapter.pause();
        annotationsTool.playerAdapter.setCurrentTime(0);
        $('#video-container').hide();
        
        
        this.timelineView.reset();
        this.annotateView.reset();
        this.listView.reset();
        
        // Delete the different objects
        delete annotationsTool.tracks;
        delete annotationsTool.video;
        delete annotationsTool.user;
        
        this.loadingBox.find('.bar').width('0%');
        this.loadingBox.show();
        this.loadLoginModal();
      },
      
      
      /**
       * Login by pressing "Enter" key
       */
      loginOnInsert: function(e){
        if(e.keyCode == 13)
              this.login();
      },
      
      /**
       * Log the current user of the tool
       *
       * @return {User} the current user
       */
      login: function(){
        this.setLoadingProgress(30,"User login.");
        
        // Fields from the login form
        var userId          = annotationsTool.getUserExtId();
        var userNickname    = this.userModal.find('#nickname');
        var userEmail       = this.userModal.find('#email');
        var userRemember    = this.userModal.find('#remember');
        var userError       = this.userModal.find('.alert');
           
        var valid  = true; // Variable to keep the form status in memory   
        var user; // the new user
        
        userError.find('#content').empty();
        
        // Try to create a new user
        try{

            if(annotationsTool.localStorage)
              user = annotationsTool.users.create({user_extid: userId, nickname: userNickname.val()});
            else
              user = annotationsTool.users.create({user_extid: userId, nickname: userNickname.val()},{wait:true});
            
            // Bind the error user to a function to display the errors
            user.bind('error',$.proxy(function(model,error){
                this.userModal.find('#'+error.attribute).parentsUntil('form').addClass('error');
                userError.find('#content').append(error.message+"<br/>");
                valid=false;
            },this));
        }catch(error){
            valid = false;
            userError.find('#content').append(error+"<br/>");
        }
        
        // If email is given, we set it to the user
        if(user && userEmail.val())
            user.set({email:userEmail.val()});
        
        // If user not valid 
        if(!valid){
            this.userModal.find('.alert').show();
            return undefined;
        }
        
        // If we have to remember the user
        if(userRemember.is(':checked')){
            annotationsTool.users.add(user);
            Backbone.localSync("create",user,{
              success: function(data){
                  console.log("current user saved locally");
              },
              error: function(error){
                console.warn(error);
              }
            })
        }
        user.save();

        annotationsTool.user = user;
        this.userModal.modal("toggle");
        
        this.createViews();    
            
        return user;
      },
       
      // Get all the annotations for the current user       
      getAnnotations: function(callback){
        
        var videos,video,tracks;
        videos = new Videos;
        
        /**
         * @function to conclude the retrive of annotations
         */
        var endGetAnnotations = $.proxy(function(){
            
            var selectedTrack = tracks.at(0);
            
            if(!selectedTrack.get('id')){
              selectedTrack.bind('ready',function(){
                endGetAnnotations();
                return;
              },this);
            }
            else{
              annotationsTool.selectedTrack = selectedTrack;
            }
            
            // Use to know if all the tracks have been fetched
            var remindingFetchingTrack = tracks.length;
          
            // Function to add the different listener to the annotations
            tracks.each($.proxy(function(track,index){
                var annotations = track.get("annotations");
                
                annotations.bind('jumpto',function(start){
                   annotationsTool.playerAdapter.setCurrentTime(start);
                },this);
          
                if(--remindingFetchingTrack == 0)
                  callback();
            }),this);
            
        },this);
        

        // If we are using the localstorage
        if(window.annotationsTool.localStorage){
          videos.fetch();
          
          if(videos.length == 0)
            videos.add({video_extid:annotationsTool.getVideoExtId()});
            
          video = videos.at(0);
          annotationsTool.video = video;

          tracks = video.get("tracks");
          
          if(tracks.length == 0){
            tracks.add({name:"default"});
            var track = tracks.at(0);
            track.save(track,{success: endGetAnnotations});
          }
          else{
            endGetAnnotations();
          }
        }
        // With Rest storage
        else{

          videos.add({video_extid:annotationsTool.getVideoExtId()});
          annotationsTool.video = videos.at(0);

          annotationsTool.video.on('ready',function(){
                tracks = annotationsTool.video.get("tracks");

                if(tracks.length == 0){
                  tracks.create({name:"default"},{
                    wait: true, 
                    success: endGetAnnotations
                  });
                }
                else{
                  console.warn("Could get tracks");
                  endGetAnnotations();
                }

          });

          annotationsTool.video.save();
          
        }

      },

      /**
       * Listener for window resizing
       */
      onWindowResize: function(){
        // If views are not set
        if(!this.annotateView || !this.listView || !this.timelineView)
          return;

        var windowHeight = $(window).height();

        this.listView.$el.height(windowHeight-this.annotateView.$el.height()-100);
      },

      ////////////
      // Utils  //
      ////////////
      
      /**
       * Update loading box with given percent & message
       * 
       * @param {Integer} percent loaded of the tool
       * @param {String} current loading operation message
       */
      setLoadingProgress: function(percent, message){
        this.loadingBox.find('.bar').width(percent+'%');
        this.loadingBox.find('.info').text(message);
      }
    });
        
        
    return MainView;
    
    
});