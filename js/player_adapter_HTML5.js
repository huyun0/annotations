define(['domReady!','jquery','interfaces/player_adapter'],function(domReay,$,PlayerAdapter){
    
    
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
        
        // Set the player adapter interface as prototype 
        this.prototype = new PlayerAdapter();
        
        /** Id of the player adapter */
        this.id = "PlayerAdapter"+targetElement.id;
        
        /** The HTML representation of the adapter, mainly used to thriggered event */
        this.htmlElement = null;
        
        /** The current player status */
        this.status = PlayerAdapter.STATUS.INITIALISING;
        
        /** Define if a play request has be done when the player was not ready */
        this.waitToPlay = false;
        
        /** @constructor */
        this.init = function(){
            
            // Create the HTML representation of the adapter
            $('body').append(self.getHTMLTemplate(self.id));
            if($('#'+self.id).length == 0)
                throw 'Cannot create HTML representation of the adapter';
            self.htmlElement = document.getElementById(self.id);
            
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
         * Dispatch the given event
         */
        this.triggerEvent = function(event){
            
            if (document.createEventObject){
                // For IE
                var evt = document.createEventObject();
                return self.htmlElement.fireEvent('on'+event,evt)
            }
            else{
                // For others browsers
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent(event, true, true ); // event type,bubbling,cancelable
                return !self.htmlElement.dispatchEvent(evt);
            }
            
            
        }
        
        /**
         * Get the HTML template for the html representation of the adapter
         */
        this.getHTMLTemplate = function(id){
            return  '<div id="'+id+'" style="display:none;"> \
                    \t <!-- Abstract targetElement for player adapter --> \
                    </div>';
        } 
        
        self.init();
        
        // Return the HTMLElement extended by the player adapter
        return $.extend(self.htmlElement,this);
    }
    
    return PlayerAdapterHTML5;
    
    
})