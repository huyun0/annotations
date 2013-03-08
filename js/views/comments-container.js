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
        "views/comment",
        "text!templates/comments-container.tmpl",
        "handlebars",
        "backbone"],
       
    function($, _, CommentView, Template, Handlebars, Backbone){
        
        /**
         *  View for comments
         */
        var CommentsContainer = Backbone.View.extend({
          
          tagName: "div",
          
          className: "comments-container collapse",
          
          /** View template */
          template: Handlebars.compile(Template),
          
          collapsed: true, //Todo: Collapse function needs to be completely removed. 
          
          /** Events to handle */
          events: {
              "click a.add-comment"       : "onAddComment",
              "keyup textarea"           : "keyupInsertProxy",
              "click button[type=submit]" : "insert",
              "click button[type=button]" : "onCancelComment"
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){
            if (typeof attr.collapsed !== "undefined") {
                this.collapsed = attr.collapsed;
            } 

            this.annotationId = attr.id;
            this.id           = "comments-container" + attr.id;
            this.el.id        = this.id;
            
            this.comments = attr.comments;
            
            this.commentViews = [];
            
            // Bind function to the good context 
            _.bindAll(this,
                      "render",
                      "onAddComment",
                      "insert",
                      "onCancelComment",
                      "keyupInsertProxy");

            this.$el.html(this.template({
                id       : this.annotationId, 
                comments : this.comments.models, 
                collapsed: this.collapsed
            }));

            this.commentList = this.$el.find("div#comment-list" + this.annotationId);
            
            _.each(this.comments.toArray(), function (comment) {
              this.addComment(comment);
            }, this);
            
            // Add backbone events to the model
            _.extend(this.comments, Backbone.Events);

            
            this.listenTo(this.comments, "destroy", this.deleteView);
            
            return this.render();
          },
          
          /**
           * Render this view
           */
          render: function(){
              var commentList;

              this.$el.html(this.template({id: this.annotationId, comments: this.comments.models, collapsed: this.collapsed}));
              this.commentList = this.$el.find("div#comment-list" + this.annotationId);
              
              this.commentList.empty();
              _.each(this.commentViews, function (commentView) {
                  this.commentList.append(commentView.render().$el);
              }, this);

              this.delegateEvents(this.events);
              return this;
          },
          
          /**
           * Remove the given comment from the views list
           * @param {Comment} Comment from which the view has to be deleted
           */
          deleteView: function (delComment) {
              _.find(this.commentViews, function (commentView, index) {
                  if (delComment === commentView.model) {
                      this.commentViews.splice(index, 1);
                      this.render();
                      return;
                  }
              }, this);
          },
          
          /**
           * Sort all the comments in the list by date
           */
          sortViewsByDate: function () {
              this.commentViews = _.sortBy(this.commentViews, function (commentViews) {
                  return commentViews.model.get("created_at");
              });
              this.render();
          },

          keyupInsertProxy: function (event) {
                  // If enter is pressed and shit not, we insert a new annotation
                if (event.keyCode === 13 && !event.shiftKey) {
                    this.insert();
                }
          },
          
          /**
           * Submit a comment to the backend
           */
          insert: function () {
              var textValue = this.$el.find("textarea").val(),
                  commentModel;

              if (textValue === "") {
                return;
              }
              
              commentModel = this.comments.create({text: textValue});
                
              this.cancel();
              this.addComment(commentModel);
          },
          
          addComment: function (comment) {
              var commentModel = new CommentView({model: comment});
              this.commentViews.push(commentModel);
              this.$el.find("div#comment-list"+this.annotationId).append(commentModel.render().$el);

              if (this.comments.length == 1) {
                  this.commentList.append(commentModel.render().$el);
              } else {
                  this.$el.find("> span.comments").text(this.comments.length + " Comments");
              }

              this.$el.find("textarea").focus();
          },
          
          /**
           * Add a new comment
           */
          onAddComment: function(event){
              event.stopImmediatePropagation();
              this.$el.find("textarea").show();
              this.$el.find("button").removeClass("hide");
              this.$el.find("textarea").focus();
          },
          
          onCancelComment: function(event) {
              event.stopImmediatePropagation();
              this.cancel();
          },
          
          cancel: function() {
            this.$el.find("textarea").hide().val('');
            this.$el.find("button").addClass("hide");
          },
          
          
        });
            
        return CommentsContainer;
    
});