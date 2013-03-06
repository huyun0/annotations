// RequireJS configuration for main app
require.config({
  baseUrl: "js",
  paths: {
    'timeline': 'libs/timeline-min',
    'scrollspy': 'libs/bootstrap/scrollspy',
    'tab': 'libs/bootstrap/tab',
    'carousel': 'libs/bootstrap/carousel2.2',
    'tooltip': 'libs/bootstrap/tooltip',
    'popover': 'libs/bootstrap/popover',
    'backbone': 'libs/backbone/backbone-0.9.9',
    'jquery.colorPicker': 'libs/jquery.colorPicker.min',
    'jquery.FileReader': 'libs/jquery.FileReader',
    'localstorage': 'libs/backbone/backbone.localStorage-1.0',
    'handlebars': "libs/handlebars",
    'jquery': 'libs/jquery-1.7.2.min',
    'underscore': 'libs/underscore-min-1.4.3',
    'templates': '../templates',
    'domReady': 'libs/require/config/domReady',
    'text': 'libs/require/config/text',
    'annotations-tool': 'annotations-tool',
    'annotations-tool-configuration': 'annotations-tool-configuration',
    'bootstrap': 'libs/bootstrap/bootstrap.min'
  },
  waitSeconds: 20,

  shim: {
    "handlebars": {
      exports: "Handlebars"
    },

    "underscore": {
      exports: "_"
    },

    "backbone": {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },

    "localstorage": {
      deps: ["backbone"],
      exports: "Backbone"
    },

    "jquery.FileReader": {
            deps: ["jquery"],
            exports: "jQuery.fn.fileReader"
    },

    "jquery.colorPicker": {
            deps: ["jquery"],
            exports: "jQuery.fn.colorPicker"
    },

    "bootstrap": ["jquery"],
    "scrollspy": ["bootstrap"],
    "carousel": ["bootstrap"],
    "tab": ["bootstrap"],
  }
});

// Bootstrap function for main app
require(['domReady', 'annotations-tool-configuration', 'annotations-tool'],

function(domReady, config, app) {
  domReady(function() {
    app.start();
  });
});