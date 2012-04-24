define(['domReady!','jquery','prototypes/player_adapter'],function(domReay,$,PlayerAdapter){
    

    /**
     * Implementation of the player adapter for the HTML5 native player
     *
     * @param {HTMLElement} Player
     */
    PlayerAdapterHTML5 = function(targetElement){
        
        // Check if the given target Element is valid 
        if(typeof targetElement == "undefined" || targetElement == null || !(targetElement instanceof HTMLElement))
            throw "The given target element must not be null and have to be a vaild HTMLElement!";
        
        var self = this;
        
        /** Id of the player adapter */
        this.id = "PlayerAdapter"+targetElement.id;
        
        /** The HTML representation of the adapter, mainly used to thriggered event */
        this.htmlElement = null;
        
        /** The current player status */
        this.status = PlayerAdapter.STATUS.INITIALIZING;
        
        /** Define if a play request has be done when the player was not ready */
        this.waitToPlay = false;
        
        /** @constructor */
        this.init = function(){
        
            // Create the HTML representation of the adapter
            $(targetElement).wrap(self.getHTMLTemplate(self.id));
            if($('#'+self.id).length == 0)
                throw 'Cannot create HTML representation of the adapter';
            self.htmlElement = document.getElementById(self.id);
            
            // Extend the current object with the HTML representation
            $.extend(true,this,self.htmlElement);
            
            // Add PlayerAdapter the prototype 
            this.__proto__ = new PlayerAdapter();
            
            // ...and ensure that his methods are used for the Events management 
            this.dispatchEvent = this.__proto__.dispatchEvent;
            this.addEventListener = this.__proto__.addEventListener;
            this.removeEventListener = this.__proto__.removeEventListener;
            
            /**
             * Listen the events from the native player
             */
            $(targetElement).bind("seeked canplay",function(){
                self.status =  PlayerAdapter.STATUS.PAUSED;
                self.triggerEvent(PlayerAdapter.EVENTS.READY);
                if(self.waitToPlay)self.play();    
            });
            
            $(targetElement).bind("play",function(){
               self.status =  PlayerAdapter.STATUS.PLAYING;
               self.triggerEvent(PlayerAdapter.EVENTS.PLAY);
            });
            
            $(targetElement).bind("pause",function(){
               self.status =  PlayerAdapter.STATUS.PAUSE;
               self.triggerEvent(PlayerAdapter.EVENTS.PAUSE);
            });
            
            $(targetElement).bind("ended",function(){
               self.status =  PlayerAdapter.STATUS.ENDED;
               self.triggerEvent(PlayerAdapter.EVENTS.ENDED);
            });
            
            $(targetElement).bind("seeking",function(){
               self.status =  PlayerAdapter.STATUS.SEEKING;
               self.triggerEvent(PlayerAdapter.EVENTS.SEEKING);
            });
            
            $(targetElement).bind("timeupdate",function(){
               self.triggerEvent(PlayerAdapter.EVENTS.TIMEUPDATE);
            });
            
            $(targetElement).bind("error",function(){
               self.status =  PlayerAdapter.STATUS.ERROR_NETWORK;
               self.triggerEvent(PlayerAdapter.EVENTS.ERROR);
            });
            
            /*$(targetElement).bind("emptied",function(){
               self.status =  PlayerAdapter.STATUS.ERROR_UNSUPPORTED_MEDIA;
               self.triggerEvent(PlayerAdapter.EVENTS.ERROR);
            });*/
            
            // Force to load the video if necessary
            if(targetElement.readyState < 1){
                self.status = PlayerAdapter.STATUS.LOADING;
                targetElement.load();
            }
            else{
                self.status =  PlayerAdapter.STATUS.PAUSED;
                self.triggerEvent(PlayerAdapter.EVENTS.READY);
                if(self.waitToPlay)self.play();  
            }
            
            return this;
        }
        
        
        /** =================
         * REQUIRED FUNCTIONS
         * =================*/
        
        this.play = function(){
            // Can the player start now?
            if(self.status != PlayerAdapter.STATUS.PLAYING &&
               self.status != PlayerAdapter.STATUS.PAUSED &&
               self.status != PlayerAdapter.STATUS.ENDED){
                self.waitToPlay = true;
            }  
            else{
                // If yes, we play it  
                targetElement.play();
                self.waitToPlay = false;
            }
        };

        this.pause = function(){
            targetElement.pause();
        };
        
        this.load = function(){
            targetElement.load();
        };
        
        this.setCurrentTime = function(time){
            targetElement.currentTime = time;
        };
        
        this.getCurrentTime = function(){
            return targetElement.currentTime;
        };
        
        this.getDuration = function(){
            return targetElement.duration;  
        };
        
        this.getStatus = function(){
            return self.status;
        }
        
        
        /** =================================
         * IMPLEMENTATION SPECIFIC FUNCTIONS
         * ==================================*/
        
        /**
         * Get the HTML template for the html representation of the adapter
         */
        this.getHTMLTemplate = function(id){
            return  '<div id="'+id+'"/>';
        } 

        return self.init();
    }
    
    // Set the player adapter interface as prototype 
    //PlayerAdapterHTML5.prototype = new PlayerAdapter();
    
    return PlayerAdapterHTML5;
    
    
})