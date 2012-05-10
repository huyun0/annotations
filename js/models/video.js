define(["jquery",
        "collections/tracks",
        "order!underscore",
        "order!backbone"],
       
       function($, Tracks){
    
        /**
         * video model
         * @class
         */
        var Video = Backbone.Model.extend({
            
            initialize: function(attr){
                    
                this.set({created_at:(new Date()).getTime()});
    
                if(!attr || !attr.id){
                    this.set({id:this.cid});
                    this.toCreate = true;
                }
                
                this.set({tracks: new Tracks([],this)})
                
                // Define that all post operation have to been done through PUT method
                // see in wiki
                this.noPOST = true;
            },
            
            validate: function(attr){
                
                if(attr.id){
                    if((tmpId=this.get('id')) && tmpId!==attr.id){
                        this.id = attr.id;
                        this.setUrl();
                    }
                    //    return "'id' attribute can not be modified after initialization!";
                    //if(!_.isNumber(attr.id))
                    //    return "'creat attribute must be a number!";
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
            },
            
            /**
             * Modify the current url for the tracks collection
             */
            setUrl: function(){
                this.get("tracks").setUrl(this);
            }
        });
        
        return Video;
    
});