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
    
define(['domReady!','jquery','prototypes/player_adapter'],function(domReady,$,PlayerAdapter){
    

    /**
     * Implementation of the player adapter for the HTML5 native player
     *
     * @param {HTMLElement} Player
     */
    PlayerAdapterHTML5 = function(targetElement){
        
        // Allow to use HTMLElement with MS IE < 9
        if(!HTMLElement)
            var HTMLElement = Element;
        
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
        
        this.initialized = false;
        
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
            
            // ...and ensure that its methods are used for the Events management 
            this.dispatchEvent = this.__proto__.dispatchEvent;
            this.triggerEvent = this.__proto__.triggerEvent;
            this.addEventListener = this.__proto__.addEventListener;
            this.removeEventListener = this.__proto__.removeEventListener;
            this._getListeners = this.__proto__._getListeners;
            
            /**
             * Listen the events from the native player
             */
            $(targetElement).bind("canplay durationchange",function(){
                // If duration is still not valid
                if(isNaN(self.getDuration()) || targetElement.readyState < 1)
                    return;
                
                if(!self.initialized)
                    self.initialized = true;
                
                // If duration is valid, we chanded status
                self.status =  PlayerAdapter.STATUS.PAUSED;
                self.triggerEvent(PlayerAdapter.EVENTS.READY);
                
                if(self.waitToPlay)
                    self.play();    
            });
            
            $(targetElement).bind("play",function(){
                if(!self.initialized)
                    return;
                
               self.status =  PlayerAdapter.STATUS.PLAYING;
               self.triggerEvent(PlayerAdapter.EVENTS.PLAY);
            });
            
            $(targetElement).bind("pause",function(){
                if(!self.initialized)
                    return;
                
               self.status =  PlayerAdapter.STATUS.PAUSED;
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
            
            return this;
        }
        
        
        /** =================
         * REQUIRED FUNCTIONS
         * =================*/
        
        this.play = function(){
            // Can the player start now?
            switch(self.status){
                case PlayerAdapter.STATUS.INITIALIZING:
                case PlayerAdapter.STATUS.LOADING:
                    self.waitToPlay = true;
                    break;
                case PlayerAdapter.STATUS.SEEKING:
                case PlayerAdapter.STATUS.PAUSED:
                case PlayerAdapter.STATUS.PLAYING:
                case PlayerAdapter.STATUS.ENDED:
                    // If yes, we play it  
                    targetElement.play();
                    self.waitToPlay = false;
                    break;
            }
        };

        this.pause = function(){
            targetElement.pause();
        };
        
        this.load = function(){
            self.initialized = false;
            self.status = PlayerAdapter.STATUS.INITIALIZING;
            targetElement.load();
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
            return  '<div id="'+id+'"></div>';
        } 

        return self.init();
    }
    
    // Set the player adapter interface as prototype 
    //PlayerAdapterHTML5.prototype = new PlayerAdapter();
    
    return PlayerAdapterHTML5;
    
    
})