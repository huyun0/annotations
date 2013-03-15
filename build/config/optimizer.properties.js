({
    baseUrl: './../../js',
    mainConfigFile: './../../js/libs/require/config/config.js',
    name: "main",
    // ------- ! WARNING ! -------
    // Change the out filename through the project.properties file (optimization.out property)
    out: "@OUT@",
    // ---------------------------
    optimizeAllPluginResources: false,
    preserveLicenseComments: false,
    optimize: "uglify",
    useStrict: true,
    uglify: {
        no_mangle: false
    }
})