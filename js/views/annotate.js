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
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "views/annotate-tab",
        "libs/handlebars",
        "backbone"],
       
    function($,_not,PlayerAdapter,Annotation,Annotations,AnnotateTab){

        /**
         * View to add annotation
         */
        
        var Annotate = Backbone.View.extend({
          
          /** Main container of the appplication */
          el: $('div#annotate-container'),
          
          /** The player adapter passed during initialization part */
          playerAdapter: null,
          
          /** Events to handle by the annotate view */
          events: {
            "keyup #new-annotation"          : "keydownOnAnnotate",
           // "keyup #new-annotation"             : "keyupOnAnnotate",
            "click #insert"                     : "insert",
            "keydown #new-annotation"           : "onFocusIn",
            "focusout #new-annotation"          : "onFocusOut",
            "click #label-tabs-buttons a"       : "showTab",
            "click #editSwitch"                 : "onSwitchEditModus"
          },

          /** Template for tabs button */
          tabsButtonTemplate: Handlebars.compile('<li><a href="#labelTab-{{id}}">{{name}} <i class="icon-plus-sign add edit"></i></a></li>'),

          /** Element containing the tabs buttons */
          tabsButtonsElement: $('ul#label-tabs-buttons'),

          /** Element containing the tabs contents */
          tabsContainerElement: $('div#label-tabs-contents'),

          /** Define edit mode is on or not */
          editModus: false,

          /** Arrays of key currently prressed */
          pressedKeys: {},

          categoriesTabs: {},
          
          /**
           * @constructor
           */
          initialize: function(attr){
              
            // Set the current context for all these functions
            _.bindAll(this,'insert',
                          'render',
                          'reset', 
                          'onFocusIn',
                          'onFocusOut',
                          'changeTrack',
                          'addTab',
                          'onSwitchEditModus', 
                          'switchEditModus',
                          'keyupOnAnnotate',
                          'keydownOnAnnotate');
            
            // Parameter for stop on write
            this.continueVideo = false;
            
            // New annotation input
            this.input = this.$('#new-annotation');
            
            // Print selected track
            this.trackDIV = this.$el.find('div.currentTrack span.content')
            this.changeTrack(annotationsTool.selectedTrack);
            
            this.tracks = annotationsTool.video.get("tracks");
            this.tracks.bind('selected_track',this.changeTrack,this);
            this.playerAdapter = attr.playerAdapter;

            this.addTab('default','Default');

            this.tabsContainerElement.find('div.tab-pane:first-child').addClass("active");
            this.tabsButtonsElement.find('a:first-child').parent().addClass("active");
          },
          
          /**
           * Proxy function for insert through 'enter' keypress
           */
          keydownOnAnnotate: function(e){
            // this.pressedKeys[e.keyCode] = true;

            // If enter is pressed and shit not, we inset a new annotation
            if(e.keyCode == 13 && !e.shiftKey)
              this.insert();
          },

          keyupOnAnnotate: function(e){
            this.pressedKeys[e.keyCode] = false;
          },
          
          /**
           * Insert a new annotation
           */
          insert: function(){

            var value = _.escape(this.input.val());
            
            var time = this.playerAdapter.getCurrentTime();
            
            if(!value || (!_.isNumber(time) || time < 0))
              return;
            
            var params = {
              text:value, 
              start:time
            };

            annotationsTool.selectedTrack.get("annotations").create(params,{wait:true});

            
            if(this.continueVideo)
              this.playerAdapter.play();

            this.input.val("");
          },
          
          /**
           * Change the current selected track by the given one
           */
          changeTrack: function(track){
            // If the track is valid, we set it
            if(track){
              this.input.attr("disabled", false);
              this.trackDIV.html(track.get("name"));
            }
            else{
              // Otherwise, we disable the input and inform the user that no track is set
              this.input.attr("disabled", true);
              this.trackDIV.html("<span class='notrack'>Select a track!</span>");
            }
          },
          
          /**
           * Listener for when a user start to write a new annotation,
           * manage if the video has to be or not paused.
           */
          onFocusIn: function(){

            if(!this.$el.find('#pause-video').attr('checked') || (this.playerAdapter.getStatus() == PlayerAdapter.STATUS.PAUSED))
              return;
              
            this.continueVideo = true;
            this.playerAdapter.pause();
            
            // If the video is moved, or played, we do no continue the video after insertion
            $(this.playerAdapter).one(PlayerAdapter.EVENTS.TIMEUPDATE,function(){
              this.continueVideo = false;
            });
          },
          
          /**
           * Listener for when we leave the annotation input
           */
          onFocusOut: function(){

            if(this.continueVideo){
              this.continueVideo = false;
              this.playerAdapter.play();
            }
          },

          /**
           * Show the tab related to the source from the event
           * @param {Event} event Event related to the action
           */
          showTab: function(event){
              event.preventDefault();
              $(event.currentTarget).tab('show');
          },

          /**
           * Add a new categories tab in the annotate view
           * @param {String} id   Id of the new tab, !important, used for the binding
           * @param {String} name name of the new tab
           */
          addTab: function(id,name){
            var params = {
                  id: id,
                  name: name,
                  categories: annotationsTool.video.get("categories")
                },
                newButton = this.tabsButtonTemplate(params),
                annotateTab;

            newButton = $(newButton).appendTo(this.tabsButtonsElement);
            params.button = newButton;

            annotateTab = new AnnotateTab(params);

            this.categoriesTabs[id] = annotateTab; 
            this.tabsContainerElement.append(annotateTab.$el);
          },

          /**
           * Listener for edit modus switch.
           * @param {Event} event Event related to this action
           */
          onSwitchEditModus: function(event){
            this.switchEditModus($(event.target).attr('checked') == "checked");
          },

          /**
           *  Switch the edit modus to the given status.
           * @param  {Boolean} status The current status
           */
          switchEditModus: function(status){
            this.editModus = status;

            this.$el.toggleClass('edit-on',status);

            // trigger an event that all element switch in edit modus
            $(annotationsTool.video).trigger("switchEditModus", status);
          },
          
          /**
           * Reset the view
           */
          reset: function(){
            this.$el.hide();
            delete this.tracks;
            this.undelegateEvents();
            this.tabsContainerElement.empty();
            this.tabsButtonsElement.empty();
          }
          
        });
            
            
        return Annotate;
    
    
});