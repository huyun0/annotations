define(["jquery",
        "prototypes/player_adapter",
        "collections/annotations",
        "views/annotate",
        "views/list",
        "views/timeline",
        "collections/users",
        "models/user",
        "models/track",
        "models/video",
        "collections/videos",
        "backbone-annotations-sync",
        "text!templates/user-login.tmpl",
        "backbone",
        "underscore",
        "libs/bootstrap/bootstrap.min"],
       
       function($,PlayerAdapter,Annotations,AnnotateView,ListView,TimelineView,Users,User,Track,Video,Videos,AnnotationSync,LoginTmpl){

    /**
     * Main view of the application
     */
    
    var MainView = Backbone.View.extend({
      
      /** Main container of the appplication */
      el: $('body'),
      
      /** The player adapter passed during initialization part */
      playerAdapter: null,
      
      /** Describe if the complete tool has already been loaded */
      loaded: false,
      
      /** jQuery element for the user login */
      userModal: null,
      
      /** jQuery element for the loading box */
      loadingBox: $('div#loading'),
      
      /** Events to handle by the main view */
      events: {
        "click #save-user": "login",
        "click #logout" : "logout"
      },
      
      initialize: function(playerAdapter){
        if(!PlayerAdapter.prototype.isPrototypeOf(playerAdapter))
            throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
        
        _.bindAll(this,"login","getAnnotations","createViews","checkUserAndLogin","loadLoginModal");
        
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
        
        
        this.loadingBox.find('.bar').width('20%');
        
        // Create a new users collection and get exciting local user
        annotationsTool.users = new Users();
        Backbone.localSync("read",annotationsTool.users,{
          success: function(data){
              annotationsTool.users.add(data);
          },
          error: function(error){
            console.warn(error);
          }
        })
        
        this.loadingBox.find('.bar').width('35%');
        
        
        if(playerAdapter.getStatus() ===     PlayerAdapter.STATUS.PAUSED){
           this.checkUserAndLogin();
        }
        else{
          $(playerAdapter).one(PlayerAdapter.EVENTS.READY,this.checkUserAndLogin);
          this.loadingBox.find('.info').text('Initializing the player.');
        }
       
        
      },
        
      /**
       * Create the views for the annotations
       */
      createViews: function(){
        this.loadingBox.find('.bar').width('50%');
        
        this.loaded =true,
        
        this.getAnnotations($.proxy(function(){
          
          this.loadingBox.find('.bar').width('60%');
          
          // Create views to annotate and see annotations list
          this.timelineView = new TimelineView({playerAdapter: this.playerAdapter});
          
          this.loadingBox.find('.bar').width('100%');
          
          // Create views to annotate and see annotations list
          this.annotateView = new AnnotateView({playerAdapter: this.playerAdapter});
          this.annotateView.$el.show();
          
          this.loadingBox.find('.bar').width('100%');
          
          // Create annotations list view
          this.listView = new ListView();
          this.listView.$el.show();
          
          this.loadingBox.hide();
          
          $('#video-container').show();
        },this));        
      },
      
      checkUserAndLogin: function(){
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
        // Hide/remove the views
        $('#video-container').hide();
        annotationsTool.playerAdapter.pause();
        annotationsTool.playerAdapter.setCurrentTime(0);
        
        
        this.timelineView.reset();
        this.annotateView.reset();
        
        // Delete the different objects
        delete annotationsTool.tracks;
        delete annotationsTool.video;
        delete annotationsTool.user;
        
        this.loaded = false;
        this.loadingBox.find('.bar').width('0%');
        this.loadingBox.show();
        this.loadLoginModal();
      },
      
      /**
       * Log the current user of the tool
       *
       * @return {User} the current user
       */
      login: function(){
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
            user = annotationsTool.users.create({user_extid: userId, nickname: userNickname.val()});
            
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
        
        if(!this.loaded)
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
          
            // Function to add the different listener to the annotations
            var addAnnotationsListeners = $.proxy(function(annotations){

              annotations.bind('jumpto',function(start){
                 this.playerAdapter.setCurrentTime(start);
              },this);
              
              annotations.bind('destroy',function(annotation){
                 annotations.remove(annotation);
              },this);
             
              // Set the video for the annotations tool, could be used everywhere then
              annotationsTool.video = video;
              
              annotationsTool.selectedTrack = tracks.at(0);
              callback();
            },this);
          
            // Get all annotations
            tracks.each(function(track){
              var annotations = track.get("annotations");
              
              if(window.annotationsTool.localStorage){
                addAnnotationsListeners(annotations);
              }
              else{
                // Create an annotations collection an get all the annotations
                annotations.fetch({success: $.proxy(function(){
                  addAnnotationsListeners(annotations);
                }, this)});
              }
            }, this);
            
        },this);
        

        // If we are using the localstorage
        if(window.annotationsTool.localStorage){
          videos.fetch();
          
          if(videos.length == 0)
            videos.add({video_extid:annotationsTool.getVideoExtId()});
            
          video = videos.at(0);
          video.save();
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
          video = videos.at(0);
          
          // Wait that the video is well saved (to have a good id)
          video.save(video,{
              success: function(data){
                tracks = video.get("tracks");
                tracks.fetch({
                  
                  success: function(){
                    if(tracks.length == 0){
                      tracks.add({name:"default"});
                      track = tracks.at(0);
                      track.save(track,{success: endGetAnnotations});
                    }
                    else{
                      endGetAnnotations();
                    }
                  },
                  error: function(){
                    throw "Not able to get tracks from video "+video.get("id");
                  }
                });
            }
          });
        }

      }
    });
        
        
    return MainView;
    
    
});