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

/**
 * A module representing the view for the categories tab  
 * @module views-annotate-tab
 * @requires jQuery
 * @requires underscore
 * @requires models-label
 * @requires models-scale
 * @requires models-scalevalue
 * @requires collections-categories
 * @requires collections-labels
 * @requires collections-scalevalues
 * @requires views/annotate-category
 * @requires templates/annotate-category.tmpl
 * @requires default_categories_set
 * @requires handlebars
 * @requires backbone
 * @requires FileSaver
 * @requires jquery.FileReader
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
        "handlebars",
        "backbone",
        "libs/FileSaver",
        "jquery.FileReader"],
       
    function($, _, Category, Label, Scale, ScaleValue, Categories, Labels, ScaleValues, CategoryView, Template, categoriesSet, scalesSet, Handlebars, Backbone) {

        "use strict";



        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-annotate-tab
         * @alias module:views-annotate-tab.AnnotateTab
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
              "click .page-link"        : "moveCarouselToFrame",
              "mouseleave .carousel"    : "pauseCarousel"
          },

          /**
           * Default color for new category
           * @alias module:views-annotate-tab.AnnotateTab#DEFAULT_CAT_COLOR
           * @constant
           * @type {String}
           */
          DEFAULT_CAT_COLOR: "#61ae24",
          
          /**
           * @constructor
           */
          initialize: function (attr) {
              if (!attr.id || !attr.name || !attr.categories) {
                  throw "Tab id,name and categories must be given as constuctor attributes!";
              }
                
              // Set the current context for all these functions
              _.bindAll(this,
                'addCategories',
                'addCategory',
                'onAddCategory',
                'removeOne',
                'addCarouselItem',
                'generateScales',
                'moveCarouselToFrame',
                'moveCarouselPrevious',
                'moveCarouselNext',
                'onCarouselSlid',
                'onSwitchEditModus',
                'onExport',
                'onImport',
                'chooseFile',
                'switchEditModus',
                'insertCategoryView',
                'initCarousel',
                'render');

              this.categories = attr.categories;
              this.filter = attr.filter;
              this.roles = attr.roles;
              this.defaultCategoryAttributes = attr.attributes;
              
              this.categoryViews = new Array();

              if(attr.edit)this.edit=true;
              
              this.el.id = this.idPrefix+attr.id;

              this.$el.append(this.template({id:attr.id}));

              this.carouselElement = this.$('#'+attr.id);

              this.carouselPagination = this.$('.pagination ul');

              this.categoriesContainer = this.carouselElement.find('.carousel-inner');

              this.addCategories(this.categories, this.filter);

              this.generateScales();

              this.initCarousel();

              this.titleLink = attr.button;
              this.titleLink.find('i.add').bind('click',this.onAddCategory);
              this.titleLink.find('i.export').bind('click',this.onExport);
              this.titleLink.find('i.import').click(this.chooseFile);

              this.titleLink.find('.file').fileReader({
                  id: "fileReaderSWFObject",
                  filereader: "js/libs/filereader.swf",
                  expressInstall: "js/libs/expressInstall.swf",
                  debugMode: false,
                  callback: function () {
                      console.log("File Reader ready!");
                  },
                  multiple: false,
                  //accept: "text/javascript",
                  label: "JSON files",
                  extensions: "*.json"
              });

              this.titleLink.find('.file').bind('change',this.onImport);

              this.listenTo(this.categories, 'add', this.addCategory);
              this.listenTo(this.categories, 'remove', this.removeOne);
              this.listenTo(this.categories, 'destroy', this.removeOne);

              if (_.contains(this.roles, annotationsTool.user.get("role"))) {
                this.listenTo(annotationsTool.video, 'switchEditModus', this.onSwitchEditModus);
              }

              this.delegateEvents(this.events);

              this.carouselElement.carousel(0).carousel("pause");

              return this;
          },

          /**
           * Add a list of category
           * @param {Categories} categories list of categories
           */
          addCategories: function (categories, filter) {
              var filteredCategories;

              if (categories.models) {
                  if (filter) {
                      filteredCategories = categories.where(filter);
                  } else {
                      filteredCategories = categories.models;
                  }
              } else if (_.isArray(categories)) {
                  if (filter) {
                      _.where(categories,filter);
                  } else {
                      filteredCategories = categories;
                  }
              } else {
                  return;
              }

              _.each(filteredCategories, function (category,index) {
                  this.addCategory(category, categories, {skipTests: true});
              },this);
          },

          /**
           * [addCategory description]
           * @param {[type]}  category [description]
           * @param {Boolean} isNew    [description]
           */
          addCategory: function (category, collection, options) {
            var newCategory = category,
                isPresent = false,
                testFilter = function () {
                    return _.every(this.filter, function (value, attribute) {
                        if (category.has(attribute) && category.get(attribute) === value) {
                          return true;
                        } else {
                          return false;
                        }
                    });
                };

            if (!options.skipTests) {
              if (!$.proxy(testFilter,this)()) {
                return;
              }
            }


            if (options && options.isTemplate) { // category to add is a template
              newCategory = this.categories.addCopyFromTemplate(category);
            } else if(!this.categories.get(category.get('id'))) {// Add this category if new
              this.categories.add(newCategory,{silent:true});
            } else {
              _.find(this.categoryViews,function(catView,index) {
                if(category === catView.model){
                  isPresent = true;
                  return true;
                }
              },this);

              if (isPresent) {
                return;
              }
              
            }
            // Save new category    
            newCategory.save();
            
            if(annotationsTool.localStorage) {
                annotationsTool.video.save();
            }

            var categoryView = new CategoryView({
                category: newCategory, 
                editModus: this.editModus,
                roles: this.roles
            });

            this.categoryViews.push(categoryView);
            this.insertCategoryView(categoryView);

          },

          /**
           * Listener for category creation request from UI
           * @param  {Event} event
           */
          onAddCategory: function (event) {
              var attributes = {
                  name    : "NEW CATEGORY", 
                  settings: {
                      color: this.DEFAULT_CAT_COLOR, 
                      hasScale: false
                  }
              };

              this.categories.create(_.extend(attributes, this.defaultCategoryAttributes));
          },

          /**
           * Remove the given category from the views list
           *
           * @param {Category} Category from which the view has to be deleted
           */
          removeOne: function (delCategory) {
              _.find(this.categoryViews, function (catView, index){ 
                  if (delCategory === catView.model) {
                      catView.remove();
                      this.categoryViews.splice(index, 1);
                      this.initCarousel();
                      this.render();
                      return;
                  }
              }, this);
          },

          /**
           * Insert the given category in the carousel
           * @param  {Category View} categoryView the view to insert
           */
          insertCategoryView: function (categoryView) {
              var itemsLength = this.categoriesContainer.find('div.category-item').length;

              // Create a new carousel if the current one is full
              if ((itemsLength % 12) == 0) {
                  this.addCarouselItem();
              }

              if (itemsLength == 0) {
                  this.initCarousel();
              }

              this.itemsCurrentContainer.append(categoryView.render().$el);

              // Move the carousel to the container of the new item
              this.carouselElement.carousel(parseInt(itemsLength / 12)).carousel('pause');
          },

          /**
           * Add a new carousel item to this tabe
           */
          addCarouselItem: function(){
              var length = this.categoriesContainer.find('div.category-item').length,
                  pageNumber = (length - (length % 12)) / 12;

              this.categoriesContainer.append(this.itemContainerTemplate({number:(pageNumber+1)}));

              this.itemsCurrentContainer = this.categoriesContainer.find('div div div.row-fluid').last();

              if(length >= 12) {
                this.carouselPagination.parent().css('display','block');
              }

              this.carouselPagination.find('li:last').before(this.paginationBulletTemplate({number: (pageNumber+1), frame: pageNumber}));
          },

          initCarousel: function () {
              var hasBeenInit = (this.categoriesContainer.find('.active').length > 0);

              if (!hasBeenInit) {
                  this.categoriesContainer.find('.item:first-child').addClass("active");
                  this.carouselPagination.find('.page-link:first').parent().addClass('active');
              }

              this.carouselElement
                    .carousel({interval: false, pause: ""})
                    .bind('slid',this.onCarouselSlid)
                    .carousel('pause');

              if (!hasBeenInit) {
                this.carouselElement.carousel(0);
              }

          },

          pauseCarousel: function () {
              this.carouselElement.carousel('pause');
          },

          generateScales: function () {
              var scale,
                  scalevalues,
                  findByNameScale = function(scale){
                    return scalesSet[0].name == scale.get('name');
                  }, 
                  options = {wait:true};

              // Generate scales
              if(!annotationsTool.video.get("scales").find(findByNameScale)){
                scale = annotationsTool.video.get("scales").create({name: scalesSet[0].name},options);
                scalevalues = scale.get("scaleValues");
   
                _.each(scalesSet[0].values,function(scalevalue){
                  scalevalues.create({name: scalevalue.name, value: scalevalue.value, order: scalevalue.order, scale: scale},options);
                });
              } else{
                scale = annotationsTool.video.get("scales").first();
              }
          },

          /**
           * Move the carousel to item related to the event target
           * @param  {Event} event 
           */
          moveCarouselToFrame: function (event) {
              var target = $(event.target);
              this.carouselElement.carousel(parseInt(target.attr('title'))).carousel("pause");
              this.carouselPagination.find('.page-link').parent().removeClass('active');
              target.parent().addClass('active');
          },

          /**
           * Move carousel to next element
           */
          moveCarouselNext: function () {
              this.carouselElement.carousel('next').carousel('pause');
          },

          /**
           * Move carousel to previous element
           */
          moveCarouselPrevious: function () {
              this.carouselElement.carousel('prev').carousel('pause');
          },

          /**
           * Listener for carousel slid event.
           * @param  {Event} event
           */
          onCarouselSlid: function (event) {
              var numberStr = this.carouselElement.find('div.active').attr('id');
              numberStr = numberStr.replace("item-", "");
              this.carouselPagination.find('.page-link').parent().removeClass('active');
              this.carouselPagination.find('#page-' + numberStr).parent().addClass('active');
              this.delegateEvents(this.events);
          },

          onExport: function () {
              var  json = {
                     categories: [],
                     scales: []
                   },
                   tmpScales = {},
                   tmpScaleId;

              _.each(this.categories.where(this.filter), function (category) {
                  tmpScaleId = category.attributes.scale_id;

                  if (tmpScaleId && !tmpScales[tmpScaleId]) {
                    tmpScales[tmpScaleId] = annotationsTool.video.get("scales").get(tmpScaleId);
                  }

                  json.categories.push(category.toExportJSON());
              }, this);

              _.each(tmpScales, function (scale) {
                  if (scale) {
                    json.scales.push(scale.toExportJSON());
                  }
              });

              saveAs(new Blob([JSON.stringify(json)], { type: 'application/octet-stream' }), "export-categories.json");
          },

          onImport: function (evt) {

              var reader = new FileReader(),
                  file = evt.target.files[0];
                  defaultCategoryAttributes = this.defaultCategoryAttributes;

              reader.onload = (function (addedFile) {
                return function(e) {

                  // Render thumbnail.
                  var importAsString = e.target.result,
                      importAsJSON;

                  try {
                    importAsJSON = JSON.parse(importAsString);
                    annotationsTool.importCategories(importAsJSON, defaultCategoryAttributes);
                  } catch (error) {
                    // TODO pop up an error modal to the user
                    console.warn("The uploaded file is not valid!");
                  }
                };
              })(file);

              // Read in the image file as a data URL.
              reader.readAsText(file);
          },

          /**
           * Listener for edit modus switch.
           * @param {Event} event Event related to this action
           */
          onSwitchEditModus: function(status){
              this.switchEditModus(status);
          },

          chooseFile: function () {
              this.titleLink.find(".file").click();
          },

          /**
           *  Switch the edit modus to the given status.
           * @param  {Boolean} status The current status
           */
          switchEditModus: function(status){
              this.titleLink.toggleClass("edit-on", status)
              this.$el.toggleClass("edit-on", status);
              this.editModus = status;
          },

          /**
           * Display the list
           */
          render: function(){
              var currentId = this.categoriesContainer.find('div.item.active').attr('id'),
                  currentIndex;

              this.categoriesContainer.empty();
              this.carouselPagination.find('li:not(:last,:first)').remove();
              
              _.each(this.categoryViews,function(catView){
                  this.insertCategoryView(catView);
              },this);

              if (currentId) {
                  currentIndex = parseInt(currentId.replace("item-",""));
                  if (this.categoriesContainer.find('#'+currentId).length == 0) {
                    currentIndex --;
                  }
                  this.categoriesContainer.find('#item-'+currentIndex).addClass("active");
                  this.carouselPagination.find('#page-'+currentIndex).parent().addClass("active");
              }

              this.delegateEvents(this.events);
              
              return this;
          },

        });

        return AnnotateTab;

});


    
