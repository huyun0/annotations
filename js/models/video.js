define(["order!jquery","order!require", "collections/tracks", "order!underscore","backbone"],function($, require){
    
    var Tracks;
    
    /**
     * video model
     * @class
     */
    var Video = Backbone.Model.extend({
        
        initialize: function(attr){
            if(!Tracks)
                Tracks = require("collections/tracks");
                
            this.set({id: this.cid,
                     created_at:(new Date()).getTime()
                     });

            this.set({tracks: new Tracks([],this)})
            
            if(!attr || !attr.id)
                this.set({id:this.cid});
        },
        
        validate: function(attr){
            if(!Tracks)
                Tracks = require("collections/tracks");
            
            if(attr.id){
                //if((tmpId=this.get('id')) && tmpId!==attr.id)
                //    return "'id' attribute can not be modified after initialization!";
                if(!_.isNumber(attr.created_at))
                    return "'id' attribute must be a number!";
            }
            
            if(attr.created_at){
                if((tmpCreated=this.get('created_at')) && tmpCreated!==attr.created_at)
                    return "'created_at' attribute can not be modified after initialization!";
                if(!_.isNumber(attr.created_at))
                    return "'created_at' attribute must be a number!";
            }
            
            if(attr.created_by && (_.isNumber(attr.created_by) || attr.created_by instanceof User))
                return "'created_by' attribute must be a number or an instance of 'User'";
            
            if(attr.tracks && !(attr.tracks instanceof Tracks))
                return "'tracks' attribute must be an instance of 'Tracks'";
        } 
    });
    
    return Video;
    
});