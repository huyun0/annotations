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
        "handlebars",
        "jquery.colorPicker",
        "backbone"],
       
    function ($, _not, LabelView, Template, Handlebars) {

        /**
         * @class label view for each item contained in annotate window
         */
        var CategoryView = Backbone.View.extend({

          tagName: "div",
          
          className: 'span1 category-item',

          ID_PREFIX: "catItem-",

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
            "click .catItem-header i.scale"    : "editScale",
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
              'onChange',
              'onFocusOut',
              'onKeyDown',
              'onColorChange',
              'removeOne',
              'onCreateLabel',
              'editScale');

            // Type use for delete operation
            this.typeForDelete = annotationsTool.deleteOperation.targetTypes.CATEGORY;
            this.roles = attr.roles;
            this.labelViews = new Array();

            if(attr.editModus)this.editModus = attr.editModus;
            
            this.el.id = this.ID_PREFIX+attr.category.get('id');

            this.model = attr.category;

            this.addLabels(this.model.get("labels"));

            var labels = this.model.get("labels")
            this.listenTo(labels, 'add', this.addLabel);
            this.listenTo(labels, 'remove', this.removeOne);
            this.listenTo(labels, 'destroy', this.removeOne);
            this.listenTo(this.model, 'change', this.onChange);
            
            if (_.contains(this.roles, annotationsTool.user.get("role"))) {
                this.listenTo(annotationsTool.video, 'switchEditModus', this.onSwitchEditModus);
            }

            this.render();

            this.nameInput = this.$el.find(".catItem-header input");

            return this;
          },

          /**
           * Listener for edit modus switch.
           * @param {Event} event Event related to this action
           */
          onSwitchEditModus: function(status){
            this.switchEditModus(status);
          },

          onChange: function () {
            _.each(this.labelViews, function (labelView) {
                labelView.changeCategory(this.model.toJSON());
            },this);
            this.render();
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

          editScale: function(){
            var enable = !this.$el.find('i.scale').hasClass('icon-star'),
                settings = this.model.get("settings");

            annotationsTool.scaleEditor.show(this.model);

            /*settings.hasScale = enable;
            this.model.set('settings',settings);
            this.model.save();*/
          },

          /**
           * Listener for category deletion request from UI
           * @param  {Event} event
           */
          onDeleteCategory: function (event) {
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

          addLabels: function (labels) {
            labels.each(function(label,index){
                this.addLabel(label, false);
            },this);
          },

          addLabel: function (label, single) {
            var labelView = new LabelView({
                label:label,
                editModus:this.editModus,
                roles: this.roles,
                isScaleEnable: this.model.get("settings").hasScale
            });

            this.labelViews.push(labelView);

            // If unique label added, we redraw all the category view
            if (single) {
                this.render();
            }
          },

          onCreateLabel: function () {
            var label = this.model.get("labels").create({value: "LB", 
                                                         abbreviation: "New",
                                                         category: this.model}, {wait:true});
            label.save();
            this.model.save();

            if(annotationsTool.localStorage)
              annotationsTool.video.save();
          },

          /**
           * Remove the given category from the views list
           *
           * @param {Category} Category from which the view has to be deleted
           */
          removeOne: function (delLabel) {
            _.find(this.labelViews,function(labelView,index){
              if(delLabel === labelView.model){
                labelView.remove();
                this.labelViews.splice(index,1);
                return;
              }
            },this);
          },

          /**
           * Listener for focus out event on name field
           */
          onFocusOut: function(){
            this.model.set('name',_.escape(this.nameInput.val()), {silent:true})
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

          onColorChange: function (id, newValue) {
            this.model.setColor(newValue);
            this.model.save();
          },

          render: function () {
            var modelJSON = this.model.toJSON();
            modelJSON.notEdit = !this.editModus;

            this.$el.html(this.template(modelJSON));

            _.each(this.labelViews,function(view, index){
                this.$el.find('.catItem-labels').append(view.render().$el);
            },this);

            this.nameInput = this.$el.find(".catItem-header input");
            
            // Define the colors (global setting for all color pickers)
            $.fn.colorPicker.defaults.colors = ['ffff99', 'ffd800', 'ffcc99', 'ffa800', 'ff7800', 'c36e00', 'd5d602', 'd9be6c', 'ff99cc', 'ff5d7c', 'da0000', 'd15c49', '969601', 'adfded', '8fc7c7', 'a4d2ff', '00ccff', '64b0e8', '61ae24', '9ded0a', '92ffaa', 'c0adfd', 'ac5bff', '6569ff'];

            this.$el.find('.colorpicker').colorPicker({pickerDefault: this.model.attributes.settings.color.replace("#",""), onColorChange : this.onColorChange});
            this.$el.find('.colorPicker-picker').addClass("edit");
            
            this.delegateEvents(this.events);

            return this;
          }

        });

        return CategoryView;

});
    