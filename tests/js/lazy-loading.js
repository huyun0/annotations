require(["jquery",
         "../tests/js/annotations-tool-configuration-lazy-loading",
         "annotations-tool-main",
         "models/video",
         "collections/videos",
         "prototypes/player_adapter",
         "backbone-annotations-sync",
         "sinon"],

        function ($, Configuration, annotationsTool, Video, Videos, PlayerAdapter, AnnotationSync, sinon) {


                var contentJSON = { "Content-Type": "application/json" },
                    baseUrl = Configuration.restEndpointsUrl,
                    videoJSON = {
                        access: 1,
                        created_at: "2014-11-21T12:34:59Z",
                        id: 1,
                        tags: {},
                        updated_at: "2014-11-21T12:34:59Z",
                        video_extid: "c63b9289-3f23-4634-af9e-4d03e5a09741"
                    },
                    tracksJSON = {
                            count: 12,
                            offset: 0,
                            tracks: [
                                {
                                    access: 1,
                                    created_at: "2014-11-21T12:34:59Z",
                                    description: "Track 1 generated automatically.",
                                    id: 1,
                                    name: "Track 1",
                                    tags: {},
                                    updated_at: "2014-11-21T12:34:59Z"
                                },
                                {
                                    access: 1,
                                    created_at: "2014-11-21T12:34:59Z",
                                    description: "Track 2 generated automatically.",
                                    id: 2,
                                    name: "Track 2",
                                    tags: {},
                                    updated_at: "2014-11-21T12:34:59Z"
                                },
                                {
                                    access: 1,
                                    created_at: "2014-11-21T12:34:59Z",
                                    description: "Track 3 generated automatically.",
                                    id: 3,
                                    name: "Track 3",
                                    tags: {},
                                    updated_at: "2014-11-21T12:34:59Z"
                                },
                                {
                                    access: 1,
                                    created_at: "2014-11-21T12:34:59Z",
                                    description: "Track 4 generated automatically.",
                                    id: 4,
                                    name: "Track 4",
                                    tags: {},
                                    updated_at: "2014-11-21T12:34:59Z"
                                }
                            ]
                        },
                    scalesJSON = {
                            "count": 1,
                            "offset": 0,
                            "scales": [
                                {
                                    "access": 0,
                                    "created_at": "2014-11-21T13:27:33Z",
                                    "created_by": 1451,
                                    "created_by_nickname": "xavier",
                                    "deleted_by_nickname": null,
                                    "id": 1,
                                    "name": "default",
                                    "tags": {},
                                    "updated_at": "2014-11-21T13:27:33Z",
                                    "updated_by": 1451,
                                    "updated_by_nickname": "xavier"
                                }
                            ]
                        },
                    annotationsJSON = {
                            "annotations": [
                                {
                                    "access": 1,
                                    "created_at": "2014-11-21T12:34:59Z",
                                    "created_by": null,
                                    "created_by_nickname": null,
                                    "deleted_at": null,
                                    "deleted_by": null,
                                    "deleted_by_nickname": null,
                                    "duration": 6.0,
                                    "id": 489,
                                    "label": null,
                                    "scalevalue": null,
                                    "start": 2.0,
                                    "tags": {},
                                    "text": "Annotation 0 on track 0",
                                    "updated_at": "2014-11-21T12:34:59Z",
                                    "updated_by": null,
                                    "updated_by_nickname": null
                                },
                                {
                                    "access": 1,
                                    "created_at": "2014-11-21T12:34:59Z",
                                    "created_by": null,
                                    "created_by_nickname": null,
                                    "deleted_at": null,
                                    "deleted_by": null,
                                    "deleted_by_nickname": null,
                                    "duration": 9.0,
                                    "id": 490,
                                    "label": null,
                                    "scalevalue": null,
                                    "start": 3.0,
                                    "tags": {},
                                    "text": "Annotation 1 on track 0",
                                    "updated_at": "2014-11-21T12:34:59Z",
                                    "updated_by": null,
                                    "updated_by_nickname": null
                                },
                                {
                                    "access": 1,
                                    "created_at": "2014-11-21T12:34:59Z",
                                    "created_by": null,
                                    "created_by_nickname": null,
                                    "deleted_at": null,
                                    "deleted_by": null,
                                    "deleted_by_nickname": null,
                                    "duration": 10.0,
                                    "id": 491,
                                    "label": null,
                                    "scalevalue": null,
                                    "start": 10.0,
                                    "tags": {},
                                    "text": "Annotation 2 on track 0",
                                    "updated_at": "2014-11-21T12:34:59Z",
                                    "updated_by": null,
                                    "updated_by_nickname": null
                                },
                                {
                                    "access": 1,
                                    "created_at": "2014-11-21T12:34:59Z",
                                    "created_by": null,
                                    "created_by_nickname": null,
                                    "deleted_at": null,
                                    "deleted_by": null,
                                    "deleted_by_nickname": null,
                                    "duration": 9.0,
                                    "id": 492,
                                    "label": null,
                                    "scalevalue": null,
                                    "start": 3.0,
                                    "tags": {},
                                    "text": "Annotation 3 on track 0",
                                    "updated_at": "2014-11-21T12:34:59Z",
                                    "updated_by": null,
                                    "updated_by_nickname": null
                                }
                            ],
                            "count": 4,
                            "offset": 0
                        },
                    scaleJSON = {
                            "count": 0,
                            "offset": 0,
                            "scaleValues": []
                        },
                    categoriesJSON = {"count": 0, "categories": [], "offset": 0 },
                    server;

                module("Models",  {

                        setup: function () {
                            server = sinon.fakeServer.create();

                            server.respondWith("PUT",  baseUrl + "/videos", [200, contentJSON, JSON.stringify(videoJSON)]);
                            server.respondWith("PUT",  baseUrl + "/videos", [200, contentJSON, JSON.stringify(videoJSON)]);
                            server.respondWith("GET",  baseUrl + "/videos/1/tracks", [200, contentJSON, JSON.stringify(tracksJSON)]);
                            server.respondWith("GET",  baseUrl + "/videos/1/scales", [200, contentJSON, JSON.stringify(scalesJSON)]);
                            server.respondWith("GET",  baseUrl + "/videos/1/scales/1/scalevalues", [200, contentJSON, JSON.stringify(scaleJSON)]);
                            server.respondWith("GET",  baseUrl + "/videos/1/categories", [200, contentJSON, JSON.stringify(categoriesJSON)]);
                            server.respondWith("GET",  baseUrl + "/videos/1/tracks/1/annotations", [200, contentJSON, JSON.stringify(annotationsJSON)]);
                            server.respondWith("GET",  baseUrl + "/videos/1/tracks/2/annotations", [200, contentJSON, JSON.stringify(annotationsJSON)]);
                            server.autoRespond = true;

                            if (!window.annotationsTool.started) {
                                window.annotationsTool.start(Configuration);
                                window.annotationsTool.started = true;
                            }
                        },

                        teardown: function () {
                            server.restore();
                        }

                    });

                asyncTest("Load two tracks", function (assert) {
                    expect(3);
                    
                    window.annotationsTool.fetchData();

                    setTimeout(function () {
                        assert.equal(window.annotationsTool.getTracks().size(), 4, "The video should have a total of 4 tracks.");
                        assert.equal(window.annotationsTool.getAnnotations().length, 8, "Only the annotations of the first two tracks should be loaded.");
                        assert.equal(window.annotationsTool.getTracks().visibleTracks.length, 2, "Only the first two tracks should be loaded.");
                        QUnit.start();
                    }, 2000);
                });


                asyncTest("Load one tracks", function (assert) {
                    expect(3);
                    
                    window.annotationsTool.MAX_VISIBLE_TRACKS = 1;

                    window.annotationsTool.fetchData();

                    _.forEach(server.requests, function (request) {
                        console.log(request);
                    });


                    setTimeout(function () {
                        assert.equal(window.annotationsTool.getTracks().size(), 4, "The video should have a total of 4 tracks.");
                        assert.equal(window.annotationsTool.getAnnotations().length, 4, "Only the annotations of the first two tracks should be loaded.");
                        assert.equal(window.annotationsTool.getTracks().visibleTracks.length, 1, "Only the first two tracks should be loaded.");
                        QUnit.start();
                    }, 2000);
                });


                QUnit.start();
            });
