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

          /**
           * Define if the view is or not in edit modus.
           * @type {Boolean}
           */
          edit: false,

          /**
           * List of categories view in this tab
           * @type {Array}
           */
          categories: undefined,

           /** Tab template */
          template: Handlebars.compile(Template),

          /** Template for the carousel items */
          itemContainerTemplate: Handlebars.compile('<div class="item row-fluid" id="item-{{number}}">\
                                                      <div class="span12">\
                                                        <div class="row-fluid">\
                                                        </div>\
                                                      </div>\
                                                    </div>'),

          paginationBulletTemplate: Handlebars.compile('<li><a href="#" class="page-link" title="{{frame}}" id="page-{{number}}">{{number}}</a></li>'),

          /** Element containing the "carousel" */
          carouselElement: undefined,

          /** Element containing the pagination */
          carouselPagination: undefined,

          /** Element containing the all the categories */
          categoriesContainer: undefined,

          /** Current container for categories group in the carousel */
          itemsCurrentContainer: undefined,

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
              'addCarouselItem',
              'generateCategories',
              'moveCarouselToFrame',
              'moveCarouselPrevious',
              'moveCarouselNext',
              'onCarouselSlid');

            this.categories = new Array();

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


            return this;
          },

          addCategories: function(categories){
            categories.each(function(category,index){
                this.addCategory(category);
            },this);
          },

          addCategory: function(category){
            var categoryView = new CategoryView({category:category});

            this.categories.push(categoryView);

            // Create a new carousel if the current one is full
            if((this.categories.length % 3)==1)
              this.addCarouselItem();

            this.itemsCurrentContainer.append(categoryView.$el);
          },

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

          moveCarouselToFrame: function(event){
            var target = $(event.target);
            this.carouselElement.carousel(parseInt(target.attr('title')));
            this.carouselElement.carousel('pause');
            this.carouselPagination.find('.page-link').parent().removeClass('active');
            target.parent().addClass('active');
          },

          moveCarouselNext: function(){
            this.carouselElement.carousel('next');
          },

          moveCarouselPrevious: function(){
            this.carouselElement.carousel('prev');
          },

          onCarouselSlid: function(event){
            var numberStr = this.carouselElement.find('div.active').attr('id');
            numberStr = numberStr.replace("item-","");
            this.carouselPagination.find('.page-link').parent().removeClass('active');
            this.carouselPagination.find('#page-'+numberStr).parent().addClass('active');
          }

        });

        return AnnotateTab;

});


    
