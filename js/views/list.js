define(["jquery",
        "underscore",
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "views/list-annotation",
        "scrollspy",
        "backbone"],
       
    function($,_not,PlayerAdapter,Annotation,Annotations,AnnotationView){

        /**
         * Annotations list view
         */
        
        var List = Backbone.View.extend({
          
          /** Annotations list container of the appplication */
          el: $('div#list-container'),
          
          /** Annotation views list */
          annotationViews: new Array(),
          
          /** Events to handle*/
          events: {
            
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){  
            // Bind functions to the good context 
            _.bindAll(this,'render','addTrack','addAnnotation','addList','sortViewsbyTime','reset','updateSelection','unselect','doClick');
            
            this.annotationViews = new Array();
            
            this.tracks = annotationsTool.video.get("tracks");
            this.tracks.bind('add',this.addTrack);
            this.tracks.each(this.addTrack, this);
            
            this.playerAdapter = annotationsTool.playerAdapter;
            $(this.playerAdapter).bind(PlayerAdapter.EVENTS.TIMEUPDATE,this.updateSelection);

            this.render();
          },
          
          /**
           * Add one track
           *
           * @param {Track} track to add
           */
          addTrack: function(track){
              var ann = track.get("annotations");
              ann.bind('add', $.proxy(function(newAnnotation){this.addAnnotation(newAnnotation,track)},this));
              ann.bind('remove',this.removeOne);
              ann.bind('destroy',this.removeOne);
              ann.bind('change',this.sortViewsbyTime);
              this.addList(ann.toArray(),track);
          },

          /**
           * Add an annotation as view to the list
           *
           * @param {Annotation} the annotation to add as view
           */
          addAnnotation: function(addAnnotation,track){
            
            // If annotation has not id, we save it to have an id
            if(!addAnnotation.id){
                addAnnotation.bind('ready',this.addAnnotation, this);
                return;
            }
            
            this.annotationViews.push(new AnnotationView({annotation:addAnnotation,track:track}));
            this.sortViewsbyTime();
          },
          
          
          /**
           * Add a list of annotation, creating a view for each of them
           */
          addList: function(annotationsList,track){
            _.each(annotationsList,function(annotation){
              this.annotationViews.push(new AnnotationView({annotation:annotation,track:track}));
            },this);
            
            if(!annotationsList.length==0)
              this.sortViewsbyTime();
          },
          
          updateSelection: function(){
            //if(this.playerAdapter.getStatus() != PlayerAdapter.STATUS.PLAYING)
            //  return;
            
            this.unselect();
            
            var currentTime = this.playerAdapter.getCurrentTime();
            
            // Tag for element selection
            var firstSelection = true;
            
            _.each(this.annotationViews,function(view,index){
              
              var start = view.model.get('start');
              
              if(_.isNumber(view.model.get('duration'))){
                var end = start + view.model.get('duration');
              
                if(start <= currentTime && end >= currentTime){
                  view.selectVisually();
                  
                  if(firstSelection){
                    this.doClick(view.$el.find('a.proxy-anchor')[0]);
                    firstSelection = false;
                  }
                }
              }
              else if(start <= currentTime && start+5 >= currentTime){
                  view.selectVisually();

                  if(firstSelection){
                    this.doClick(view.$el.find('a.proxy-anchor')[0]);
                    firstSelection = false;
                  }
                
              }

            },this);
          },
          
          /**
           * Function to unselect all items
           */
          unselect: function(){
            this.$el.find('.selected').removeClass('selected');
          },
          
          /**
           * Remove the given annotation from the views list
           *
           * @param {Annotation} Annotation from which the view has to be deleted
           */
          removeOne: function(delAnnotation){
            _.each(this.annotationViews,function(annotationView,index){
              if(delAnnotation === annotationView.model){
                this.annotationViews.splice(index,1);
                this.render();
                return;
              }
            },this);
          },
          
          /**
           * Sort all the annotations in the list by start time 
           */
          sortViewsbyTime: function(){
            this.annotationViews = _.sortBy(this.annotationViews, function(annotationView){
                return annotationView.model.get('start');
            });
            this.render();
          },
          
          /**
           * Display the list
           */
          render: function(){
            this.$el.empty();
            
            _.each(this.annotationViews,function(annView){
                this.$el.append(annView.render().$el);
            },this);
            
            return this;
          },
          
          /**
           * Reset the view
           */
          reset: function(){
            this.$el.hide();
            delete this.annotationViews;
            delete this.tracks;
            this.undelegateEvents();
          },
          
          /**
           * Simple function to simulate a click on the given element
           *
           * @param {DOM Element} el click event target
           */
          doClick: function eventFire(el){
            if (el.fireEvent) {
              (el.fireEvent('onclick'));
            } else {
              var evObj = document.createEvent('Events');
              evObj.initEvent("click", true, false);
              el.dispatchEvent(evObj);
            }
          }
          
        });
            
            
        return List;
    
    
});