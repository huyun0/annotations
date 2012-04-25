define(["jquery","underscore","backbone"],function($){
    
    /**
     * video model
     * @class
     */
    var Video = Backbone.Model.extend({
        id: 0,
        video_extid: "",
        
        // Logs
        created_at: 0,
        created_by: null,
        
        initialize: function(){
            this.set({created_at:(new Date()).getTime()});
        },
        
        validate: function(attr){
            
            if(attr.id){
                if((tmpId=this.get('id')) && tmpId!==attr.id)
                    return "'id' attribute can not be modified after initialization!";
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
        } 
    });
    
    return Video;
    
});