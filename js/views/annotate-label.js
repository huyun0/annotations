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
         * @class Label view for each item contained in annotate window
         * 
         */
        var LabelView = Backbone.View.extend({

          tagName: "div",
          
          className: 'label-item',

          idPrefix: "labelItem-",

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
            "click .item-value, .item-abbreviation"        : "annotate",
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
                            'annnotateWithScaling');

            // Type use for delete operation
            this.typeForDelete = annotationsTool.deleteOperation.targetTypes.LABEL;

            // Change the edit modus, if this config is given as parameter
            if(attr.editModus)this.editModus = attr.editModus;

            this.model = attr.label;
            this.roles = attr.roles;

            // Add backbone events to the model 
            _.extend(this.model, Backbone.Events);
            
            this.el.id = this.idPrefix+this.model.get('id');

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

            var id = event.target.getAttribute("value");

            var scalevalue = this.scaleValues.get(id);

            if(this.editModus)
              return;

            var time = annotationsTool.playerAdapter.getCurrentTime();
            
            if(!_.isNumber(time) || time < 0)
              return;

            var options = {};
            var params = {
                text: this.model.get('value'),
                start:time,
                label: this.model,
                scalevalue: scalevalue.toJSON()
            };
            
            if(annotationsTool.user)
                params.created_by = annotationsTool.user.id;


            if(!annotationsTool.localStorage)
              options.wait = true;


            annotationsTool.selectedTrack.get("annotations").create(params,options);
          },

          /**
           * Annotate the video with this label
           */
          annotate: function(){
            if (this.editModus) {
              return;
            }

            var time = annotationsTool.playerAdapter.getCurrentTime(),
                options = {},
                params;
            
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


            annotationsTool.selectedTrack.get("annotations").create(params,options);
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

          /**
           * Listener for focus out event on name field
           */
          onFocusOut: function(e){
            var attributeName = e.target.className.replace("item-","");
            this.model.set(attributeName,_.escape(e.target.value));
            this.model.save();
          },

          /**
           * Listener for key down event on name field
           */
          onKeyDown: function(e){
            if(e.keyCode == 13){ // If "return" key
              var attributeName = e.target.className.replace("item-","");
              this.model.set(attributeName,_.escape(e.target.value));
              this.model.save();
            }
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
            if(this.scaleValues)
              modelJSON.scaleValues = this.scaleValues.toJSON();
            this.$el.html(this.template(modelJSON));
            this.delegateEvents(this.events);
            return this;
          }

        });

        return LabelView;

});