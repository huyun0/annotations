/* Bootstrap script for require.js */

require(['config'], function () {
    require(['tests/annotations-tool-configuration',
             'tests/tracks',
             'tests/annotations',
             'tests/categories',
             'tests/labels',
             'tests/scales',
             'tests/scalevalues'],
            function () {}
    );
});
