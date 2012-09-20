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
        "models/category",
        "collections/categories",
        "collections/labels",
        "views/annotate-category",
        "text!templates/annotate-tab.tmpl",
        "default_categories_set",
        "libs/handlebars",
        "backbone"],
       
    function($, _not, Category, Categories, Labels, CategoryView, Template, categoriesSet){

        /**
         * @class Tab view containing categories/label
         * 
         * @extends {Backbone.View}
         */
        var AnnotateTab = Backbone.View.extend({

          tagName: "div",
          
          className: 'tab-pane',

          idPrefix: "labelTab-",

          /** Define edit mode is on or not */
          editModus: false,

          /** List of categories in this tab */
          categories: undefined,

          /** List of category views in this tab */
          categoryViews: undefined,

           /** Tab template */
          template: Handlebars.compile(Template),

          /** Template for the carousel items */
          itemContainerTemplate: Handlebars.compile('<div class="item row-fluid" id="item-{{number}}">\
                                                      <div class="span12">\
                                                        <div class="row-fluid">\
                                                        </div>\
                                                      </div>\
                                                    </div>'),

          /** Template for pagination link */
          paginationBulletTemplate: Handlebars.compile('<li><a href="#" class="page-link" title="{{frame}}" id="page-{{number}}">{{number}}</a></li>'),

          /** Element containing the "carousel" */
          carouselElement: undefined,

          /** Element containing the pagination */
          carouselPagination: undefined,

          /** Element containing the all the categories */
          categoriesContainer: undefined,

          /** Current container for categories group in the carousel */
          itemsCurrentContainer: undefined,

          /** Element represeting the tab top link */
          titleLink: undefined,

          /** Events to handle by the annotate view */
          events: {
            "click #carousel-prev"    : "moveCarouselPrevious",
            "click #carousel-next"    : "moveCarouselNext",
            "click .page-link"        : "moveCarouselToFrame"
          },
          
          /**
           * @constructor
           */
          initialize: function(attr){

            if(!attr.id || !attr.name || !attr.categories)
                throw "Tab id,name and categories must be given as constuctor attributes!";
              
            // Set the current context for all these functions
            _.bindAll(this,
              'addCategories',
              'addCategory',
              'onAddCategory',
              'addCarouselItem',
              'generateCategories',
              'moveCarouselToFrame',
              'moveCarouselPrevious',
              'moveCarouselNext',
              'onCarouselSlid',
              'onSwitchEditModus',
              'switchEditModus');

            this.categories = new Categories();
            
            this.categoryViews = new Array();

            if(attr.edit)this.edit=true;
            
            this.el.id = this.idPrefix+attr.id;

            this.$el.append(this.template({id:attr.id}));

            this.carouselElement = this.$('#'+attr.id);

            this.carouselPagination = this.$('.pagination ul');

            this.categoriesContainer = this.carouselElement.find('.carousel-inner');

            this.addCategories(this.generateCategories());

            this.categoriesContainer.find('.item:first-child').addClass("active");
            
            this.carouselElement
                  .carousel({interval: false, pause: "hover out"})
                  .bind('slid',this.onCarouselSlid)
                  .carousel('pause');

            this.carouselPagination.find('.page-link:first').parent().addClass('active');

            this.titleLink = attr.button;
            this.titleLink.find('i.add').bind('click',this.onAddCategory);

            this.categories.bind('add',this.addCategory);

            $(annotationsTool.video).bind('switchEditModus',this.onSwitchEditModus);

            return this;
          },

          /**
           * Add a list of category
           * @param {Categories} categories list of categories
           */
          addCategories: function(categories){
            categories.each(function(category,index){
                this.addCategory(category);
            },this);
          },

          /**
           * [addCategory description]
           * @param {[type]}  category [description]
           * @param {Boolean} isNew    [description]
           */
          addCategory: function(category, isTemplate){
            var newCategory = category;

            if(isTemplate) // category to add is a template
              newCategory = this.categories.addCopyFromTemplate(category);
            else if(!this.categories.get(category.get('id')))// Add this category if new
              this.categories.add(newCategory,{silent:true});
            
            // Save new category
            if(annotationsTool.localStorage)
                annotationsTool.video.save();
            else
                newCategory.save();

            var categoryView = new CategoryView({category: newCategory});

            this.categoryViews.push(categoryView);

            // Create a new carousel if the current one is full
            if((this.categories.length % 3)==1)
              this.addCarouselItem();

            this.itemsCurrentContainer.append(categoryView.$el);
          },

          /**
           * Listener for category creation request from UI
           * @param  {Event} event
           */
          onAddCategory: function(event){
            this.addCategory(new Category({name: "NEW CATEGORY", settings: {color:"grey"}}));
          },

          /**
           * Add a new carousel item to this tabe
           */
          addCarouselItem: function(){

            var pageNumber = (this.categories.length - (this.categories.length % 3)) / 3;

            this.categoriesContainer.append(this.itemContainerTemplate({number:(pageNumber+1)}));

            this.itemsCurrentContainer = this.categoriesContainer.find('div div div.row-fluid').last();

            if(this.categories.length > 3)
              this.carouselPagination.parent().css('display','block');

            this.carouselPagination.find('li:last').before(this.paginationBulletTemplate({number: (pageNumber+1), frame: pageNumber}));
          },

          /**
           * Temporaray function to generate sample categories / lables
           * @return {Categories} Category collection
           */
          generateCategories: function(){
            var categories = annotationsTool.video.get('categories');
            
            if(categories.length != 0)
                categories.remove(categories.models,{silent:true});

            _.each(categoriesSet, function(cat,index){

              var labels = cat.labels;
              
              delete cat.labels;

              var newCategory = categories.create(cat);
              var newLabels = new Labels([],newCategory);

              _.each(labels,function(lb,idx){
                lb.category = newCategory;
                if(annotationsTool.localStorage)
                  newLabels.create(lb);
                else
                  newLabels.create(lb,{wait:true});
              },this);

              newCategory.set('labels',newLabels); 

            },this);

            return categories;
          },

          /**
           * Move the carousel to item related to the event target
           * @param  {Event} event 
           */
          moveCarouselToFrame: function(event){
            var target = $(event.target);
            this.carouselElement.carousel(parseInt(target.attr('title')));
            this.carouselElement.carousel('pause');
            this.carouselPagination.find('.page-link').parent().removeClass('active');
            target.parent().addClass('active');
          },

          /**
           * Move carousel to next element
           */
          moveCarouselNext: function(){
            this.carouselElement.carousel('next');
          },


          /**
           * Move carousel to previous element
           */
          moveCarouselPrevious: function(){
            this.carouselElement.carousel('prev');
          },

          /**
           * Listener for carousel slid event.
           * @param  {Event} event
           */
          onCarouselSlid: function(event){
            var numberStr = this.carouselElement.find('div.active').attr('id');
            numberStr = numberStr.replace("item-","");
            this.carouselPagination.find('.page-link').parent().removeClass('active');
            this.carouselPagination.find('#page-'+numberStr).parent().addClass('active');
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
          },

        });

        return AnnotateTab;

});


    
