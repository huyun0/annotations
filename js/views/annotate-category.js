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
         "views/annotate-label",
        "text!templates/annotate-category.tmpl",
        "libs/handlebars",
        "backbone"],
       
    function($,_not, LabelView, Template){

        /**
         * @class label view for each item contained in annotate window
         * 
         * @extends {Backbone.View}
         */
        var CategoryView = Backbone.View.extend({

          tagName: "div",
          
          className: 'span4 category-item',

          idPrefix: "catItem-",

          /**
           * Define if the view is or not in edit modus.
           * @type {Boolean}
           */
          edit: false,

          /**
           * List of labels view in this tab
           * @type {Array}
           */
          labels: undefined,

           /** Tab template */
          template: Handlebars.compile(Template),

          /** Element containing the "carousel" */
          carouselElement: undefined,

          /** Events to handle by the annotate view */
          events: {
 
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){

            if(!attr.category || !_.isObject(attr.category))
                throw "Category object must be given as constuctor attribute!";
              
            // Set the current context for all these functions
            _.bindAll(this,
              'addLabels',
              'addLabel',
              'render');

            this.labels = new Array();

            if(attr.edit)this.edit=true;
            
            this.el.id = this.idPrefix+attr.category.get('id');

            this.model = attr.category;

            this.addLabels(this.model.get("labels"));

            this.model.bind('change', this.render);

            this.render();

            return this;
          },

          addLabels: function(labels){
            labels.each(function(label,index){
                this.addLabel(label, false);
            },this);
          },

          addLabel: function(label, single){
            var labelView = new LabelView({label:label});
            this.labels.push(labelView);

            // If unique label added, we redraw all the category view
            if(single)
                this.render();
          },

          render: function(){
            this.$el.append(this.template(this.model.toJSON()));

            _.each(this.labels,function(view, index){
                this.$el.append(view.$el);
            },this);

            return this;
          }

        });

        return CategoryView;

});
    