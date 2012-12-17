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
        "models/label",
        "models/scale",
        "models/scalevalue",
        "collections/categories",
        "collections/labels",
        "collections/scalevalues",
        "views/annotate-category",
        "text!templates/annotate-tab.tmpl",
        "default_categories_set",
        "default_scale_set",
        "libs/handlebars",
        "backbone"],
       
    function($, _not, Category, Label, Scale, ScaleValue, Categories, Labels, ScaleValues, CategoryView, Template, categoriesSet, scalesSet){

        /**
         * @class Tab view containing categories/label
         * 
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
              'removeOne',
              'addCarouselItem',
              'generateCategories',
              'moveCarouselToFrame',
              'moveCarouselPrevious',
              'moveCarouselNext',
              'onCarouselSlid',
              'onSwitchEditModus',
              'switchEditModus',
              'insertCategoryView',
              'render');

            this.categories = attr.categories;
            
            this.categoryViews = new Array();

            if(attr.edit)this.edit=true;
            
            this.el.id = this.idPrefix+attr.id;

            this.$el.append(this.template({id:attr.id}));

            this.carouselElement = this.$('#'+attr.id);

            this.carouselPagination = this.$('.pagination ul');

            this.categoriesContainer = this.carouselElement.find('.carousel-inner');

            this.addCategories(this.categories.models);

            // Add default set of categories if nothing
            if(this.categories.length == 0){
              this.hasGeneratedValues = true;
              this.addCategories(this.generateCategories());
              this.hasGeneratedValues = false;
            }

            this.categoriesContainer.find('.item:first-child').addClass("active");
            
            this.carouselElement
                  .carousel({interval: false, pause: ""})
                  .bind('slid',this.onCarouselSlid)
                  .carousel('pause');

            this.carouselPagination.find('.page-link:first').parent().addClass('active');

            this.titleLink = attr.button;
            this.titleLink.find('i.add').bind('click',this.onAddCategory);

            this.categories.bind('add',this.addCategory);
            this.categories.bind('remove',this.removeOne);
            this.categories.bind('destroy',this.removeOne);

            $(annotationsTool.video).bind('switchEditModus',this.onSwitchEditModus);

            $(document).on('mouseleave', '.carousel', function() {
                  $(this).carousel('pause');
            });

            return this;
          },

          /**
           * Add a list of category
           * @param {Categories} categories list of categories
           */
          addCategories: function(categories){
            _.each(categories,function(category,index){
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
            newCategory.save();

            // If categories have been generated
            if(this.hasGeneratedValues){
              var labels = newCategory.get('labels');
              labels.setUrl(newCategory);
              labels.each(function(label){
                    label.save();
              });  
            };
            
            if(annotationsTool.localStorage)
                annotationsTool.video.save();

            var categoryView = new CategoryView({category: newCategory, editModus: this.editModus});

            this.categoryViews.push(categoryView);

            this.insertCategoryView(categoryView);
          },

          /**
           * Listener for category creation request from UI
           * @param  {Event} event
           */
          onAddCategory: function(event){
            this.addCategory(new Category({name: "NEW CATEGORY", settings: {color:"grey"}, scale: annotationsTool.video.get("scales").at(0)}));
          },

          /**
           * Remove the given category from the views list
           *
           * @param {Category} Category from which the view has to be deleted
           */
          removeOne: function(delCategory){
            _.find(this.categoryViews,function(catView,index){
              if(delCategory === catView.model){
                this.categoryViews.splice(index,1);
                this.render();
                return;
              }
            },this);
          },

          /**
           * Insert the given category in the carousel
           * @param  {Category View} categoryView the view to insert
           */
          insertCategoryView: function(categoryView){
            var itemsLength = this.categoriesContainer.find('div.category-item').length;

            // Create a new carousel if the current one is full
            if((itemsLength % 3)==0)
              this.addCarouselItem();

            this.itemsCurrentContainer.append(categoryView.render().$el);

            // Move the carousel to the container of the new item
            this.carouselElement.carousel(parseInt(itemsLength/3)).carousel('pause');
          },

          /**
           * Add a new carousel item to this tabe
           */
          addCarouselItem: function(){

            var length = this.categoriesContainer.find('div.category-item').length;

            var pageNumber = (length - (length % 3)) / 3;

            this.categoriesContainer.append(this.itemContainerTemplate({number:(pageNumber+1)}));

            this.itemsCurrentContainer = this.categoriesContainer.find('div div div.row-fluid').last();

            if(length >= 3)
              this.carouselPagination.parent().css('display','block');

            this.carouselPagination.find('li:last').before(this.paginationBulletTemplate({number: (pageNumber+1), frame: pageNumber}));
          },

          /**
           * Temporaray function to generate sample categories / lables
           * @return {Categories} Category collection
           */
          generateCategories: function(){
            var categories = new Array(),
                scale, scalevalues;

            var findByNameCat = function(cat){
                  return categoriesSet[0].name == cat.get('name');
                },
                findByNameScale = function(scale){
                  return scalesSet[0].name == scale.get('name');
                };

            var options = {wait:true};

            //if(!annotationsTool.localStorage)
            //  options.wait = true;

            if(!annotationsTool.video.get("scales").find(findByNameScale)){
              scale = annotationsTool.video.get("scales").create({name: scalesSet[0].name},options);
              scalevalues = scale.get("scaleValues");
 
              _.each(scalesSet[0].values,function(scalevalue){
                scalevalues.create({name: scalevalue.name, value: scalevalue.value, order: scalevalue.order, scale: scale},options);
              });
            }
            else{
              scale = annotationsTool.video.get("scales").at(0);
            }

            if(this.categories.find(findByNameCat))
              return categories;

            _.each(categoriesSet, function(cat,index){

              var labels = cat.labels;
              cat.scale = scale;
              
              delete cat.labels;

              var newCategory = new Category(cat);
              var newLabels   = new Labels([],newCategory);

              _.each(labels,function(lb,idx){
                lb.category = newCategory;
                newLabels.add(new Label(lb));
              },this);

              newCategory.set('labels',newLabels);

              categories.push(newCategory);

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
            this.carouselElement.carousel('next').carousel('pause');
          },


          /**
           * Move carousel to previous element
           */
          moveCarouselPrevious: function(){
            this.carouselElement.carousel('prev').carousel('pause');
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
            this.carouselElement
                  .carousel({interval: false, pause: ""})
                  .bind('slid',this.onCarouselSlid)
                  .carousel('pause');
          },

          /**
           * Listener for edit modus switch.
           * @param {Event} event Event related to this action
           */
          onSwitchEditModus: function(event, status){
            this.switchEditModus(status);
            this.carouselElement.carousel('pause');
          },

          /**
           *  Switch the edit modus to the given status.
           * @param  {Boolean} status The current status
           */
          switchEditModus: function(status){
            this.editModus = status;
          },

          /**
           * Display the list
           */
          render: function(){
            var currentId = this.categoriesContainer.find('div.item.active').attr('id');
            var currentIndex = parseInt(currentId.replace("item-",""));
            this.categoriesContainer.empty();
            this.carouselPagination.find('li:not(:last,:first)').remove();
            
            _.each(this.categoryViews,function(catView){
                this.insertCategoryView(catView);
            },this);

            if(this.categoriesContainer.find('#'+currentId).length == 0)
              currentIndex --;


            this.categoriesContainer.find('#item-'+currentIndex).addClass("active");
            this.carouselPagination.find('#page-'+currentIndex).parent().addClass("active");

            this.carouselElement
                  .carousel({interval: false, pause: ""})
                  .bind('slid',this.onCarouselSlid)
                  .carousel('pause');
            
            return this;
          },

        });

        return AnnotateTab;

});


    
