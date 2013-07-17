/* Bootstrap script for require.js */

require(['config'], function () {

    QUnit.config.reorder   = false;
    QUnit.config.autostart = false;
    QUnit.config.autorun   = false;

    require(['domReady',
             'tests/annotations-tool-configuration',
             'tests/loop'],
            function (domReady) {
                domReady(QUnit.start);
            }
    );
});
