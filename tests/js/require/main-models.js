/* Bootstrap script for require.js */

require(['config'], function () {
    require(['tests/annotations-tool-configuration',
            'tests/user',
            'tests/video',
            'tests/track',
            'tests/annotation',
            'tests/category',
            'tests/label',
            'tests/scale',
            'tests/scalevalue'],

            function () {}
    );
});

