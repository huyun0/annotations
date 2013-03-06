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
        "text!templates/comment.tmpl",
        "text!templates/edit-comment.tmpl",
        "handlebars",
        "backbone"],
       
    function($, _, Template, EditTemplate, Handlebars, Backbone){
        
        /**
         *  View for comments
         */
        var CommentView = Backbone.View.extend({
        	
          tagName: "div",
          
          /** View template */
          template: Handlebars.compile(Template),
          
          /** Edit template */
          editTemplate: Handlebars.compile(EditTemplate),
          
          /** Events to handle */
          events: {
        	"click i.delete-comment" : "onDeleteComment",
            "click i.edit-comment" : "onEditComment",
            "click button[type=submit]" : "onSubmit",
        	"click button[type=button]" : "onCancel"
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){
            this.model = attr.model;
        	 
            this.commentId = attr.model.get("id");
            this.id = "comment"+this.commentId;
            this.el.id = this.id;
        	
            // Bind function to the good context 
            _.bindAll(this,"render","onDeleteComment","onEditComment","onSubmit","onCancel");
            
            return this;
          },
          
          onDeleteComment: function() {
            this.model.destroy();
            this.remove();
          },
          
          onEditComment: function() {
              if (!this.isEditEnable) {
        	       this.$el.append(this.editTemplate({text: this.model.get("text")}));
                   this.isEditEnable = true;
              } 
          },
          
          onSubmit: function() {
          	var textValue = this.$el.find("textarea").val();
          	if(textValue == '')
          	  return;
          	
          	this.model.set("text", textValue);
          	this.model.save();

      	    this.cancel();
      	    this.render();
          },
          
          onCancel: function() {
            event.stopImmediatePropagation();
            this.cancel();
          },
          
          cancel: function() {
            this.isEditEnable = false;
          	this.$el.find("textarea").remove();
          	this.$el.find("button").remove();
          },
          
          /**
           * Render this view
           */
          render: function(){
            var modelJSON = this.model.toJSON();
            var data = {
            	creator: modelJSON.created_by_nickname, 
            	creationdate: new Date(modelJSON.created_at).toLocaleString(), 
              text: _.escape(modelJSON.text).replace(/\n/g, "<br/>"),
              canEdit: annotationsTool.user.get("id") == modelJSON.created_by

            };
            if(modelJSON.created_at != modelJSON.updated_at) {
            	data.updator = modelJSON.updated_by_nickname;
            	data.updateddate = new Date(modelJSON.updated_at).toLocaleString();
            }
            this.$el.html(this.template(data));
            this.delegateEvents(this.events);
            return this;
          }
          
        });
            
        return CommentView;
    
});