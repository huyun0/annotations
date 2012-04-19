define(function(){    
    /**
     * Player adapter interface
     *
     * Interface for the element making the proxy between the player and the annotations tool
     * @constructor
     * @prototype
     */
    var PlayerAdapter = function(){}

    /**
     * Enum for player status
     * @readonly
     * @enum {number}
     */
    PlayerAdapter.STATUS = {
            NOTHING: 'nothing',
            LOADING: 'loading',
            PLAYING: 'playing',
            PAUSED: 'paused',
            SEEKING: 'seeking',
            ENDED: 'ended',
            ERROR_NETWORK: 'error_network',
            ERROR_UNSUPPORTED_MEDIA: 'error_unsupported_media'      
    };
    
    /**
     * Enum for player adapter event
     * @readonly
     * @enum {string}
     */
    PlayerAdapter.EVENTS = {
            PLAY: 'pa_play',
            PAUSE: 'pa_pause',
            SEEKING: 'pa_seeking',
            READY: 'pa_ready',
            TIMEUPDATE: 'timeupdate',
            ERROR: 'pa_error',
            ENDED: 'pa_ended'
    };
    
    /**
     * Play the media element in the player.
     */
    PlayerAdapter.prototype.play = function(){
        throw "Function 'play' must be implemented in player adapter!";
    }
    
    /**
     * Set the media element in the player in pause mode.
     */
    PlayerAdapter.prototype.pause = function(){
        throw "Function 'pause' must be implemented in player adapter!";
    }
    
    /**
     * Set the current time of the media element in the player to the given one.
     * If the given value is not value, does not set it and write a warning in the console.
     * @param {double} the new time
     */
    PlayerAdapter.prototype.setCurrentTime = function(){
        throw "Function 'setCurrentTime' must be implemented in player adapter!";
    }
    
    /**
     * Get the current time of the media element.
     * @return {double} current time
     */
    PlayerAdapter.prototype.getCurrentTime = function(){
        throw "Function 'getCurrentTime' must be implemented in player adapter!";
    }
    
    /**
     * Get the media element duration.
     * @return {double} current time
     */
    PlayerAdapter.prototype.getDuration = function(){
        throw "Function 'getDuration' must be implemented in player adapter!";
    }
    
    /**
     * Get the media element duration
     * @return {double} duration
     */
    PlayerAdapter.prototype.getStatus = function(){
        throw "Function 'getDuration' must be implemented in player adapter!";
    }

    
    /**
     * Optional function to test interface implementation
     *
     * Throws an error if the implementation is invalid. 
     *
     */
    PlayerAdapter.prototype.isValid = function()
    { 
        var errors = "";
        
        // All interface properties 
        var properties = {
            play: "function",
            pause: "function",
            setCurrentTime: "function",
            getCurrentTime: "function",
            getDuration: "function",
            getStatus: "function"
        };
            
        for(var property in properties)
        {
            // If this is not a required property, we do not check it.
            if( typeof properties[property] != "string")
                continue;
                    
            // If the function is not implementated
            if(this[property]==undefined)
                    errors += "-" + property + " is not implemented! \n";
            
            // If the implementation is not valide
            if(typeof this[property] != properties[property] )
                            errors += "-" + property + " is not a valid implementation, type should be "+properties[property] +"! \n";
    
        }
        
        if(errors!="")
            throw "Player adapter implementation not valid! \n"+errors;
            
        return true;
    };
       
    // Return the complete interface
    return PlayerAdapter;

});

        
