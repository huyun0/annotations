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
        "prototypes/player_adapter",
        "collections/annotations",
        "views/annotate",
        "views/list",
        "views/timeline",
        "views/login",
        "collections/users",
        "models/user",
        "models/track",
        "models/video",
        "collections/videos",
        "backbone-annotations-sync",
        "roles",
        "FiltersManager",
        "backbone",
        "localstorage",
        "libs/bootstrap/bootstrap.min",
        "libs/bootstrap/tab"],
       
       function($, PlayerAdapter, Annotations,
                AnnotateView, ListView, TimelineView, LoginView,
                Users, User, Track, Video, Videos, AnnotationSync, ROLES, FiltersManager, Backbone){

    /**
     * Main view of the application
     */
    var MainView = Backbone.View.extend({
      
      /** Main container of the appplication */
      el: $("body"),
      
      /** The player adapter passed during initialization part */
      playerAdapter: null,
      
      /** jQuery element for the user login */
      userModal: null,
      
      /** jQuery element for the loading box */
      loadingBox: $("div#loading"),
      
      /** Events to handle by the main view */
      events: {
        "click #logout" : "logout"
      },
      
      initialize: function(playerAdapter){
        if(!PlayerAdapter.prototype.isPrototypeOf(playerAdapter.__proto__))
            throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
        
        _.bindAll(this, "logout",
                        "checkUserAndLogin",
                        "initModels",
                        "createViews",
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
        
        this.loginView = new LoginView();
        this.listenTo(annotationsTool.users, "login", this.createViews);
        this.checkUserAndLogin(); 

        $(window).resize(this.onWindowResize);   

        annotationsTool.dispatcher = _.clone(Backbone.Events);

        annotationsTool.filtersManager = new FiltersManager();

        this.onWindowResize();  
      },
        
      /**
       * Create the views for the annotations
       */
      createViews: function(){
        this.setLoadingProgress(40,"Start creating views.");
        
        $("#video-container").show();
        
        this.setLoadingProgress(45,"Start loading video.");
        
        this.initModels($.proxy(function(){  
         
          /**
           * Loading the video dependant views
           */
          var loadVideoDependantView = $.proxy(function(){
              this.setLoadingProgress(60,"Start creating views.");
              
              // Create views with Timeline
              this.setLoadingProgress(70,"Creating timeline.");
              this.timelineView = new TimelineView({playerAdapter: this.playerAdapter});
              
              // Create views to annotate and see annotations list
              this.setLoadingProgress(80,"Creating annotate view.");
              this.annotateView = new AnnotateView({playerAdapter: this.playerAdapter});
              this.annotateView.$el.show();
              
              // Create annotations list view
              this.setLoadingProgress(90,"Creating list view.");
              this.listView = new ListView();
              this.listView.$el.show();
              
              this.setLoadingProgress(100,"Ready.");
              this.loadingBox.hide();
              
              // Show logout button
              $("a#logout").css("display","block");
          },this);
          
          this.playerAdapter.load();
          
          // Initialize the player
          this.loadingBox.find(".info").text("Initializing the player.");
          
          if(this.playerAdapter.getStatus() ===  PlayerAdapter.STATUS.PAUSED){
             loadVideoDependantView();
          } else{
            $(this.playerAdapter).one(PlayerAdapter.EVENTS.READY + " " + PlayerAdapter.EVENTS.PAUSE,loadVideoDependantView);
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
          this.loginView.show();
        }
      },
      
      loadLoginModal: function(){
        if(!this.userModal){
            // Otherwise we load the login modal
            this.$el.append(LoginTmpl);
            this.userModal = $("#user-login");
            this.userModal.modal({show: true, backdrop: true, keyboard: false });
            this.userModal.on("hide",function(){
                // If user not set, display the login window again
                if(_.isUndefined(annotationsTool.user))
                    setTimeout(function(){$("#user-login").modal("show")},5);
            });
        }
        else{
          this.userModal.find("#nickname")[0].value = "";
          this.userModal.find("#email")[0].value = "";
          this.userModal.find("#remember")[0].value = "";
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
        $("a#logout").hide();
        
        // Hide/remove the views
        annotationsTool.playerAdapter.pause();
        annotationsTool.playerAdapter.setCurrentTime(0);
        $("#video-container").hide();
        
        
        this.timelineView.reset();
        this.annotateView.reset();
        this.listView.reset();
        this.loginView.reset();
        
        // Delete the different objects
        delete annotationsTool.tracks;
        delete annotationsTool.video;
        delete annotationsTool.user;
        
        this.loadingBox.find(".bar").width("0%");
        this.loadingBox.show();
        this.loginView.show();

        annotationsTool.users.each(function (user) {

            Backbone.localSync("delete",user,{
                success: function (data) {
                    console.log("current session destroyed.");
                },
                error: function (error) {
                  console.warn(error);
                }
            });

        });
      },
       
      // Get all the annotations for the current user       
      initModels: function(callback){
        
          var videos,
              video,
              tracks,
              annotations,
              selectedTrack,
              remindingFetchingTrack,
              videos = new Videos,
              /**
               * @function to conclude the retrive of annotations
               */
              concludeInitialization = $.proxy(function(){
              
                  // At least one private track should exist, we select the first one
                  selectedTrack = tracks.getMyTracks()[0];
                  
                  if (!selectedTrack.get("id")) {
                      selectedTrack.bind("ready",function(){
                        concludeInitialization();
                        return;
                      },this);
                  } else {
                      annotationsTool.selectedTrack = selectedTrack;
                  }
                  
                  // Use to know if all the tracks have been fetched
                  remindingFetchingTrack = tracks.length;
                
                  // Function to add the different listener to the annotations
                  tracks.each($.proxy(function (track,index) {
                      annotations = track.get("annotations");
                      if (--remindingFetchingTrack === 0) {
                          callback();
                      }
                  }), this);
              
              },this),
              /**
               * Create a default track for the current user if no private track is present
               */
              createDefaultTrack = function () {

                  tracks = annotationsTool.video.get("tracks");

                  if (annotationsTool.localStorage) {
                    tracks = tracks.getVisibleTracks();
                  }

                  if (tracks.getMyTracks().length === 0) {
                      tracks.create({name:"Default "+annotationsTool.user.get("nickname"), description: "Default track for user "+annotationsTool.user.get("name")},{
                          wait: true, 
                          success: concludeInitialization
                      });
                  } else{
                      concludeInitialization();
                  }
              };
          

          // If we are using the localstorage
          if (window.annotationsTool.localStorage) {
              videos.fetch();
              
              if(videos.length == 0) {
                  video = videos.create({video_extid:annotationsTool.getVideoExtId()},{wait:true});
              } else {
                  video = videos.at(0);
              }
              annotationsTool.video = video;
              createDefaultTrack();
          } else { // With Rest storage
              videos.add({video_extid:annotationsTool.getVideoExtId()});
              video = videos.at(0);
              annotationsTool.video = video;
              video.save();
              if (video.get("ready")) {
                createDefaultTrack();
              } else {
                video.once("ready",createDefaultTrack);
              }
          }

      },

      /**
       * Listener for window resizing
       */
      onWindowResize: function(){
        var listContent,
            windowHeight;

        // If views are not set
        if(!this.annotateView || !this.listView || !this.timelineView)
          return;

        windowHeight = $(window).height();


        listContent = this.listView.$el.find("#content-list");
        listContent.height(windowHeight-this.annotateView.$el.height()-200);
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
        this.loadingBox.find(".bar").width(percent+"%");
        this.loadingBox.find(".info").text(message);
      }
    });
        
        
    return MainView;
    
    
});