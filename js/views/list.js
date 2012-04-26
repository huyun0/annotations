define(["jquery",
        "underscore",
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "views/list-annotation",
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
            if(!attr.annotations)
                throw "The annotations have to be given to the annotate view.";
              
            // Bind function to the good context 
            _.bindAll(this,'render','addOne','addList');
              
            this.annotations = attr.annotations;
            this.annotations.bind('add', this.addOne);
            this.annotations.bind('remove',this.removeOne);
            this.addList(this.annotations.toArray());
          },

          /**
           * Add an annotation as view to the list
           *
           * @param {Annotation} the annotation to add as view
           */
          addOne: function(addAnnotation){
            this.annotationViews.push(new AnnotationView({annotation:addAnnotation}));
            this.sortViewsbyTime();
          },
          
          
          /**
           * Add a list of annotation, creating a view for each of them
           */
          addList: function(annotationsList){
            _.each(annotationsList,function(annotation){
              this.annotationViews.push(new AnnotationView({annotation:annotation}));
            },this);
            
            if(!annotationsList.length==0)
              this.sortViewsbyTime();
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
            $(this.el).empty();
            
            _.each(this.annotationViews,function(annView){
                $(this.el).append(annView.render().$el);
            },this);
            
            return this;
          } 
          
        });
            
            
        return List;
    
    
});