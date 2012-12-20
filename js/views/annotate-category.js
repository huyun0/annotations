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
        "libs/jquery.colorPicker.min",
        "backbone"],
       
    function($, _not, LabelView, Template){

        /**
         * @class label view for each item contained in annotate window
         */
        var CategoryView = Backbone.View.extend({

          tagName: "div",
          
          className: 'span4 category-item',

          idPrefix: "catItem-",

          /** Define if the view has been or not deleted */
          deleted: false,

          /** Define if the view is or not in edit modus. */
          editModus: false,

          /** Array of labels view in this tab */
          labels: undefined,

           /** Tab template */
          template: Handlebars.compile(Template),

          /** Element containing the "carousel" */
          carouselElement: undefined,

          /** Events to handle by the annotate view */
          events: {
            "click .catItem-header i.delete"   : "onDeleteCategory",
            "focusout .catItem-header input"   : "onFocusOut",
            "keydown .catItem-header input"    : "onKeyDown",
            "click   .catItem-add"             : "onCreateLabel",
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){

            if(!attr.category || !_.isObject(attr.category))
                throw "Category object must be given as constuctor attribute!";
              
            // Set the current context for all these functions
            _.bindAll(this,
              'onDeleteCategory',
              'deleteView',
              'addLabels',
              'addLabel',
              'render',
              'switchEditModus',
              'onSwitchEditModus',
              'onFocusOut',
              'onKeyDown',
              'onColorChange',
              'removeOne',
              'onCreateLabel');

            // Type use for delete operation
            this.typeForDelete = annotationsTool.deleteOperation.targetTypes.CATEGORY;

            this.labelViews = new Array();

            if(attr.editModus)this.editModus = attr.editModus;
            
            this.el.id = this.idPrefix+attr.category.get('id');

            this.model = attr.category;

            this.addLabels(this.model.get("labels"));

            this.model.bind('change', this.render);

            var labels = this.model.get("labels")
            labels.bind('add',this.addCategory);
            labels.bind('remove',this.removeOne);
            labels.bind('destroy',this.removeOne);

            $(annotationsTool.video).bind('switchEditModus',this.onSwitchEditModus);

            this.render();

            this.nameInput = this.$el.find(".catItem-header input");

            return this;
          },

          /**
           * Listener for edit modus switch.
           * @param {Event} event Event related to this action
           */
          onSwitchEditModus: function(event, status){
            this.switchEditModus(status);
          },

          /**
           *  Switch the edit modus to the given status.
           * @param  {Boolean} status The current status
           */
          switchEditModus: function(status){
            this.editModus = status;

            if(status)
              this.$el.find('input[disabled="disabled"]').removeAttr('disabled');
            else
              this.$el.find('input').attr('disabled','disabled');
          },

          /**
           * Listener for category deletion request from UI
           * @param  {Event} event
           */
          onDeleteCategory: function(event){
            annotationsTool.deleteOperation.start(this.model,this.typeForDelete);
          },   
          
          /**
           * Delete only this category view
           */
          deleteView: function(){
            this.remove();
            this.undelegateEvents();
            this.deleted = true;
          },

          addLabels: function(labels){
            labels.each(function(label,index){
                this.addLabel(label, false);
            },this);
          },

          addLabel: function(label, single){
            var labelView = new LabelView({label:label,editModus:this.editModus});
            this.labelViews.push(labelView);

            // If unique label added, we redraw all the category view
            if(single)
                this.render();
          },

          onCreateLabel: function(){
            var label = this.model.get("labels").create({value: "New label", 
                                                         abbreviation: "LB",
                                                         category: this.model});
            this.model.save();

            if(annotationsTool.localStorage)
              annotationsTool.video.save();

            this.addLabel(label,true);
          },

          /**
           * Remove the given category from the views list
           *
           * @param {Category} Category from which the view has to be deleted
           */
          removeOne: function(delLabel){
            _.find(this.labelViews,function(catView,index){
              if(delLabel === catView.model){
                this.labelViews.splice(index,1);
                this.render();
                return;
              }
            },this);
          },

          /**
           * Listener for focus out event on name field
           */
          onFocusOut: function(){
            this.model.set('name',_.escape(this.nameInput.val()))
            this.model.save();
          },

          /**
           * Listener for key down event on name field
           */
          onKeyDown: function(e){
            if(e.keyCode == 13){ // If "return" key
              this.model.set('name',_.escape(this.nameInput.val()))
              this.model.save();
            }
          },

          onColorChange: function(id, newValue){
            this.model.setColor(newValue);
            this.model.save();
          },

          render: function(){
            var modelJSON = this.model.toJSON();
            modelJSON.notEdit = !this.editModus;

            this.$el.html(this.template(modelJSON));

            _.each(this.labelViews,function(view, index){
                this.$el.find('.catItem-labels').append(view.render().$el);
            },this);

            this.nameInput = this.$el.find(".catItem-header input");

            this.$el.find('.colorpicker').colorPicker({pickerDefault: this.model.attributes.settings.color.replace("#",""), onColorChange : this.onColorChange});
            this.$el.find('.colorPicker-picker').addClass("edit");
            
            this.delegateEvents(this.events);

            return this;
          }

        });

        return CategoryView;

});
    