define(["jquery",
        "prototypes/player_adapter",
        "collections/annotations",
        "views/annotate",
        "views/list",
        "collections/users",
        "models/user",
        "text!templates/user-login.tmpl",
        "backbone",
        "underscore",
        "libs/bootstrap/bootstrap.min"],
       
       function($,PlayerAdapter,Annotations,Annotate,List,Users,User,LoginTmpl){

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
        "click #save-user": "getCurrentUser"
      },
      
      initialize: function(playerAdapter){
        if(!PlayerAdapter.prototype.isPrototypeOf(playerAdapter))
            throw "The player adapter is not valid! It must has PlayerAdapter as prototype.";
        
        _.bindAll(this,"getCurrentUser","getAnnotations","createViews");
        
        this.playerAdapter = playerAdapter;
        
        this.loadingBox.find('.bar').width('20%');
        
        // Create a new users collection and get exciting local user
        this.users = new Users();
        this.users.fetch()
        
        this.loadingBox.find('.bar').width('35%');
        
        // If a user has been saved locally, we take it as current user
        if(this.users.length >0){
            window.user = this.users.pop();
            this.createViews();
        }
        else{
            // Otherwise we load the login modal
            this.$el.append(LoginTmpl);
            this.userModal = $('#user-login');
            this.userModal.modal({show: true, backdrop: true, keyboard: false });
            this.userModal.on("hide",function(){
                // If user not set, display the login window again
                if(_.isUndefined(window.user))
                    setTimeout(function(){$('#user-login').modal('show')},5);
            });
        }

      },
        
      /**
       * Create the views for the annotations
       */
      createViews: function(){
        this.loadingBox.find('.bar').width('50%');
        
        this.loaded =true,
        this.getAnnotations();
        
        this.loadingBox.find('.bar').width('90%');
        
        // Create views to annotate and see annotations list
        (new Annotate({playerAdapter: this.playerAdapter, annotations: this.annotations})).$el.show();
        
        this.loadingBox.find('.bar').width('100%');
        
        (new List({annotations: this.annotations})).$el.show();
        
        this.loadingBox.hide();
        
        $('#video-container').show();
        
      },
      

      
      /**
       * Get the current user of the tool
       *
       * @return {User} the current user
       */
      getCurrentUser: function(){
        // Fields from the login form
        var userId          = this.userModal.find('#user_extid');
        var userNickname    = this.userModal.find('#nickname');
        var userEmail       = this.userModal.find('#email');
        var userRemember    = this.userModal.find('#remember');
        var userError       = this.userModal.find('.alert');
           
        var valid  = true; // Variable to keep the form status in memory   
        var user; // the new user
        
        userError.find('#content').empty();
        
        // Try to create a new user
        try{
            user = new User({user_extid: userId.val(), nickname: userNickname.val()});
            
            // Bind the error user to a function to display the errors
            user.bind('error',$.proxy(function(model,error){
                this.userModal.find('#'+error.attribute).parentsUntil('form').addClass('error')
                userError.find('#content').append(error.message+"<br/>");
                valid=false;
            },this));
        }catch(error){
            valid = false;
            userError.find('#content').append(error+"<br/>");
        }
        
        // If email is given, we set it to the user
        if(user && userEmail.val())
            user.set({email:userEmail});
        
        // If user not valid 
        if(!valid){
            this.userModal.find('.alert').show();
            return undefined;
        }
        
        // If we have to remember the user
        if(userRemember.is(':checked')){
            this.users.add(user);
            user.save();        
        }

        window.user = user;
        this.userModal.modal("toggle");
        
        if(!this.loaded)
            this.createViews();
            
        return user;
      },
      
    
      /**
       * Get all the annotations for the current user
       */
       getAnnotations: function(){
        // Create an annotations collection an get all the annotations
        this.annotations = new Annotations();
        this.annotations.fetch();   
        
        /**
         *  Bind the basic annotations event to their related operation
         */
        this.annotations.bind('destroy',function(annotation){
            this.annotations.remove(annotation);
        },this);
        
        this.annotations.bind('jumpto',function(start){
            this.playerAdapter.setCurrentTime(start);
        },this);
        
        this.annotations.bind('add',function(annotation){
            annotation.save();
        });
      }
    });
        
        
    return MainView;
    
    
});