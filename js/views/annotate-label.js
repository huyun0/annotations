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
        "handlebars",
        "backbone"],
       
    function($, _not, Annotation, Template, Handlebars, Backbone){

        /**
         * @class Label view for each item contained in annotate window
         * 
         */
        var LabelView = Backbone.View.extend({

          /** Prefix for the element id */
          ID_PREFIX: "labelItem-",

          /** CSS classname related to the scale usage */
          CLASS_SCALE: {
              ENABLED: "scale-enabled",
              DISABLED: "scale-disabled"
          },

          tagName: "div",
          
          className: 'label-item',

          /** Define if the view has been or not deleted */
          deleted: false,

          /** Define if the view is or not in edit modus. */
          editModus: false,

          /** List of categories view in this tab */
          labels: new Array(),

           /** Tab template */
          template: Handlebars.compile(Template),

          /** Element containing the "carousel" */
          carouselElement: undefined,

          /** Events to handle by the annotate view */
          events: {
            "click"                         : "annotate",
            "click i.delete"                : "onDeleteLabel",
            "focusout .item-value"          : "onFocusOut",
            "keydown .item-value"           : "onKeyDown",
            "focusout .item-abbreviation"   : "onFocusOut",
            "keydown .item-abbreviation"    : "onKeyDown",
            "click .scaling li"             : "annnotateWithScaling"
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){

              var scaleId;

              if(!attr.label || !_.isObject(attr.label))
                  throw "Label object must be given as constuctor attribute!";
                
              // Set the current context for all these functions
              _.bindAll(this, 'render',
                              'annotate',
                              'switchEditModus',
                              'onSwitchEditModus',
                              'onFocusOut',
                              'onKeyDown',
                              'onDeleteLabel',
                              'annnotateWithScaling',
                              'changeCategory');

              // Type use for delete operation
              this.typeForDelete = annotationsTool.deleteOperation.targetTypes.LABEL;

              // Change the edit modus, if this config is given as parameter
              if(attr.editModus)this.editModus = attr.editModus;

              this.model = attr.label;
              this.roles = attr.roles;
              this.isScaleEnable = attr.isScaleEnable;

              // Add backbone events to the model 
              _.extend(this.model, Backbone.Events);
              
              this.el.id = this.ID_PREFIX+this.model.get('id');

              this.listenTo(this.model, 'change', this.render);

              scaleId = this.model.get("category").scale_id;

              if (!scaleId && this.model.get("category").scale) {
                  scaleId = this.model.get("category").scale.id;
              }

              this.scaleValues = annotationsTool.video.get("scales").get(scaleId);
              
              if (this.scaleValues) {
                  this.scaleValues = this.scaleValues.get("scaleValues");
              } 

              if (_.contains(this.roles, annotationsTool.user.get("role"))) {
                  this.listenTo(annotationsTool.video, 'switchEditModus', this.onSwitchEditModus);
              }

              return this.render();
          },

          annnotateWithScaling: function(event){
              event.stopImmediatePropagation();

              var id = event.target.getAttribute("value"),
                  scalevalue = this.scaleValues.get(id),
                  time = annotationsTool.playerAdapter.getCurrentTime(),
                  annotation,
                  options = {},
                  params = {
                      text: this.model.get('value'),
                      start: time,
                      label: this.model,
                      scalevalue: scalevalue.toJSON()
                  };

              if (this.editModus || (!_.isNumber(time) || time < 0)) {
                return;
              }
              
              if(annotationsTool.user)
                  params.created_by = annotationsTool.user.id;


              if(!annotationsTool.localStorage)
                options.wait = true;


              annotation = annotationsTool.selectedTrack.get("annotations").create(params,options);
              annotationsTool.currentSelection = annotation;
          },

          /**
           * Annotate the video with this label
           */
          annotate: function(){
              event.stopImmediatePropagation();

              if (this.editModus || this.isScaleEnable) {
                return;
              }

              var time = annotationsTool.playerAdapter.getCurrentTime(),
                  options = {},
                  params,
                  annotation;
              
              if (!_.isNumber(time) || time < 0) {
                return;
              }

              params = {
                  text: this.model.get('value'),
                  start:time,
                  label: this.model
              };
              
              if (annotationsTool.user) {
                  params.created_by = annotationsTool.user.id;
                  params.created_by_nickname = annotationsTool.user.get("nickname");
              }


              if(!annotationsTool.localStorage)
                options.wait = true;


              annotation = annotationsTool.selectedTrack.get("annotations").create(params,options);
              annotationsTool.currentSelection = annotation;
          },

          /**
           * Listener for edit modus switch.
           * @param {Event} event Event related to this action
           */
          onSwitchEditModus: function(status){
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

          changeCategory: function (category) {
              var scale;

              if (category.scale) {
                scale = annotationsTool.video.get("scales").get(category.scale.id);
                if (scale) {
                  this.scaleValues = scale.get("scaleValues");
                }
              }

              this.isScaleEnable = (category.settings && category.settings.hasScale);
              this.model.set("category",category);
              this.model.save();
          },

          /**
           * Listener for focus out event on name field
           */
          onFocusOut: function(e){
            var attributeName = e.target.className.replace("item-","").replace(" edit", "");
            this.model.set(attributeName, _.escape(e.target.value), {silent: true});
            this.model.save();
          },

          /**
           * Listener for key down event on name field
           */
          onKeyDown: function(e){
              e.stopImmediatePropagation();

              e.stopPropagation();

              if(e.keyCode == 13){ // If "return" key
                  var attributeName = e.target.className.replace("item-","").replace(" edit","");
                  this.model.set(attributeName,_.escape(e.target.value));
                  this.model.save();
              } else if (e.keyCode === 39 && this.getCaretPosition(e.target) === e.target.value.length ||
                         e.keyCode === 37 && this.getCaretPosition(e.target) === 0) {
                  // Avoid scrolling through arrows keys
                  e.preventDefault();
              }
          },

          getCaretPosition: function (inputElement) {
              var CaretPos = 0;
              // IE Support
              if (document.selection) {
                  inputElement.focus ();
                  var Sel = document.selection.createRange ();

                  Sel.moveStart ('character', -inputElement.value.length);

                  CaretPos = Sel.text.length;
              }
              // Firefox support
              else if (inputElement.selectionStart || inputElement.selectionStart == '0')
                  CaretPos = inputElement.selectionStart;

              return (CaretPos);
          },

          /**
           * Delete only this category view
           */
          deleteView: function(){
            this.remove();
            this.undelegateEvents();
            this.deleted = true;
          },

          /**
           * Listener for label deletion request from UI
           * @param  {Event} event
           */
          onDeleteLabel: function(event){
            annotationsTool.deleteOperation.start(this.model,this.typeForDelete);
          },  

          /**
           * Draw the view
           * @return {LabelView} this label view
           */
          render: function(){
            var modelJSON = this.model.toJSON();

            modelJSON.notEdit = !this.editModus;
            if (!this.isScaleEnable) {
                if (modelJSON.scale_id) {
                  delete modelJSON.scale_id;
                }
            } else if (this.scaleValues) {
              modelJSON.scaleValues = _.sortBy(this.scaleValues.toJSON(), function (scaleValue) {
                      return scaleValue.order;
              });
            }

            this.$el.html(this.template(modelJSON));

            // Add CSS class to label about scale usage 
            if (this.isScaleEnable) {
                this.$el.removeClass(this.CLASS_SCALE.DISABLED);
                this.$el.addClass(this.CLASS_SCALE.ENABLED);
            } else {
                this.$el.removeClass(this.CLASS_SCALE.ENABLED);
                this.$el.addClass(this.CLASS_SCALE.DISABLED);
            }

            this.delegateEvents(this.events);
            return this;
          }

        });

        return LabelView;

});