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

define(["jquery",
        "underscore",
        "models/annotation",
        "text!templates/annotate-label.tmpl",
        "libs/handlebars",
        "backbone"],
       
    function($, _not, Annotation, Template){

        /**
         * @class category view for each item contained in annotate window
         * 
         * @extends {Backbone.View}
         */
        var LabelView = Backbone.View.extend({

          tagName: "div",
          
          className: 'label-item',

          idPrefix: "labelItem-",

          /**
           * Define if the view is or not in edit modus.
           * @type {Boolean}
           */
          edit: false,

          /**
           * List of categories view in this tab
           * @type {Array}
           */
          labels: new Array(),

           /** Tab template */
          template: Handlebars.compile(Template),

          /** Element containing the "carousel" */
          carouselElement: undefined,

          /** Events to handle by the annotate view */
          events: {
            "click": "annotate"
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){

            if(!attr.label || !_.isObject(attr.label))
                throw "Label object must be given as constuctor attribute!";
              
            // Set the current context for all these functions
            _.bindAll(this, 'render','annotate');

            // Change the edit modus, if this config is given as parameter
            if(attr.edit)this.edit=true;

            this.model = attr.label;

            // Add backbone events to the model 
            _.extend(this.model, Backbone.Events);
            
            this.el.id = this.idPrefix+this.model.get('id');

            this.model.bind('change', this.render);

            return this.render();
          },

          /**
           * Draw the view
           * @return {LabelView} this label view
           */
          render: function(){
            this.$el.append(this.template(this.model.toJSON()));
            this.delegateEvents(this.events);
            return this;
          },

          annotate: function(){
            var time = annotationsTool.playerAdapter.getCurrentTime();
            
            if(!_.isNumber(time) || time < 0)
              return;

            var params = {
                text: this.model.get('value'),
                start:time,
                label: this.model
            };
            
            if(annotationsTool.user)
                params.created_by = annotationsTool.user.id;


            if(annotationsTool.localStorage){
              var annotation = new Annotation(params);
              annotationsTool.selectedTrack.get("annotations").add(annotation);
              annotationsTool.video.save({silent:true});              
            }
            else{
              annotationsTool.selectedTrack.get("annotations").create(params,{wait:true});
            }
          }

        });

        return LabelView;

});