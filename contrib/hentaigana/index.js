/*
 * Copyright (C) 2015 OpenSeadragon contributors
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * - Neither the name of OpenSeadragon nor the names of its contributors
 *   may be used to endorse or promote products derived from this software
 *   without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
/*
 * Customized OpenSeadragonizer for IIIF manifests with hentaigana
 * example: index.html?manifest=http://www2.dhii.jp/nijl/NIJL0001/SA4-0026/manifest.json
 * example: index.html?manifest=http://www2.dhii.jp/nijl/NIJL0001/SA4-0026/manifest.json&page=2
 * 
 * Copyright (C) 2016, 2SC1815J
 * https://twitter.com/2SC1815J
 * Released under the New BSD license.
 * https://github.com/2SC1815J/openseadragonizer_iiif/contrib/hentaigana/
 */
(function () {
    var popupElt = document.getElementById("popup");
    var urlElt = document.getElementById("url");
    
    urlElt.onkeyup = function (event) {
        if (event && event.keyCode === 13) {
            location.href = '?manifest=' + urlElt.value;
        }
    };

    document.getElementById("show-button").onclick = function () {
        location.href = '?manifest=' + urlElt.value;
    };

    window.OpenSeadragonizer = {
        open: function (url) {
            popupElt.style.display = "none";

            if (!url) {
                var manifestUrlParameter = OpenSeadragon.getUrlParameter("manifest");
                if (!manifestUrlParameter) {
                    popupElt.style.display = "block";
                    return;
                }
                url = OpenSeadragon.getUrlParameter("encoded") ?
                    decodeURIComponent(manifestUrlParameter) : manifestUrlParameter;
            }

            var initialPage = parseInt(OpenSeadragon.getUrlParameter("page"), 10);
            if (isNaN(initialPage)) {
                initialPage = 0;
            }
            var options = {
                src: url,
                initialPage: initialPage
            };
            loadManifest(options, onManifestLoaded);
            document.title = url + " | OpenSeadragonizer";
        }
    };

    function loadManifest(options, successCallback) {
        OpenSeadragon.makeAjaxRequest({
            url: options.src,
            success: function(xhr) {
                var data = OpenSeadragon.parseJSON(xhr.responseText);
                successCallback({
                    data: data,
                    options: options
                });
            },
            error: function(xhr, exc) {
                onError();
            }
        });
    }

    function onManifestLoaded(event) {
        var tileSources = [];
        var otherContents = [];
        var data = event.data;
        var options = event.options;
        if (!Array.isArray) {
            Array.isArray = function(arg) {
                return Object.prototype.toString.call(arg) === '[object Array]';
            };
        }
        // minimum implementation
        // http://iiif.io/api/presentation/2.0
        if (!data) { return; }
        if (data.label) {
            document.title = data.label + " " + options.src + " | OpenSeadragonizer" ;
        }
        var i, j;
        var baseUriCanvaseIdMap = {};
        var baseUriOtherContentIdMap = {};
        if (Array.isArray(data.sequences) && data.sequences.length > 0) {
            var sequence = data.sequences[0];
            if (sequence && Array.isArray(sequence.canvases)) {
                for (i = 0, j = 0; i < sequence.canvases.length; i++){
                    var canvas = sequence.canvases[i];
                    if (canvas && Array.isArray(canvas.images) && canvas.images.length > 0) {
                        var image = canvas.images[0];
                        if (image && image.resource && image.resource.service && image.resource.service["@id"]) {
                            var baseUri = image.resource.service["@id"];
                            if (baseUri.slice(-1) === "/") {
                                baseUri = baseUri.slice(0, -1);
                            }
                            tileSources.push(baseUri + "/info.json");
                            if (canvas["@id"]) {
                                baseUriCanvaseIdMap[baseUri] = canvas["@id"];
                            }
                            j++;
                        }
                    }
                }
            }
        }
        var sequenceMode = tileSources.length > 1;
        if (sequenceMode) {
            OpenSeadragon.setString("Tooltips.FullPage", OpenSeadragon.getString("Tooltips.FullPage") + " (f)");
            OpenSeadragon.setString("Tooltips.NextPage", OpenSeadragon.getString("Tooltips.NextPage") + " (n)");
            OpenSeadragon.setString("Tooltips.PreviousPage", OpenSeadragon.getString("Tooltips.PreviousPage") + " (p)");
        }
        var initialPage = event.options.initialPage;
        if (initialPage < 0 || initialPage > tileSources.length) {
            initialPage = 0;
        }
        var viewer = new OpenSeadragon({
            id: "openseadragon",
            prefixUrl: "../../openseadragon/images/",
            sequenceMode: sequenceMode,
            initialPage: initialPage,
            navPrevNextWrap: true,
            tileSources: tileSources,
            //crossOriginPolicy: 'Anonymous', //not work?
            maxZoomPixelRatio: 2
        });
        if ("selection" in viewer) {
            var selection = viewer.selection({
                returnPixelCoordinates: false,
                //restrictToImage: true, //will have trouble at the bottom of portrait images
                onSelection: function(rect) {
                    var tiledImage = viewer.world.getItemAt(0);
                    var imageRect = tiledImage.viewportToImageRectangle(rect.x, rect.y, rect.width, rect.height);
                    var spatialDim = {}; //Media Fragments URI 1.0
                    spatialDim.x = Math.round(imageRect.x);
                    spatialDim.y = Math.round(imageRect.y);
                    spatialDim.width = Math.round(imageRect.width);
                    spatialDim.height = Math.round(imageRect.height);
                    if (spatialDim.x < 0) { spatialDim.x = 0; }
                    if (spatialDim.y < 0) { spatialDim.y = 0; }
                    if (spatialDim.width <= 0) { spatialDim.width = 1; }
                    if (spatialDim.height <= 0) { spatialDim.height = 1; }
                    var iiifRegion = spatialDim.x + "," + spatialDim.y + "," + spatialDim.width + "," + spatialDim.height;
                    var iiifSize = "full"; //will be replaced with "max" in IIIF API v3.0
                    var iiifQuality = "default";
                    var iiifFormat = ".jpg";
                    var source = tiledImage.source;
                    var sourceId = source['@id'].replace(/%2F/g, "/");
                    // logic taken from OpenSeadragon.TileSource.getTileUrl()
                    if ( source['@context'].indexOf('/1.0/context.json') > -1 ||
                         source['@context'].indexOf('/1.1/context.json') > -1 ||
                         source['@context'].indexOf('/1/context.json') > -1 ) {
                        iiifQuality = "native";
                    }
                    var uri = [ sourceId, iiifRegion, iiifSize, "0", iiifQuality + iiifFormat ].join("/");
                    OpenSeadragon.console.log(uri);
                    
                    viewer.removeOverlay("runtime-overlay-selection");
                    var elt = document.createElement("div");
                    elt.id = "runtime-overlay-selection";
                    elt.className = "highlightpre";
                    viewer.addOverlay({
                        element: elt,
                        location: new OpenSeadragon.Rect(rect.x, rect.y, rect.width, rect.height)
                    });
                    
                    if (sourceId in baseUriCanvaseIdMap) {
                        quality = iiifQuality;
                        format = iiifFormat;
                        if (source && source.profile && source.profile.length > 1) {
                            var spec = source.profile[1];
                            if (spec) {
                                if ("qualities" in spec) {
                                    if (spec.qualities.indexOf("bitonal") >= 0) {
                                        quality = "bitonal";
                                    } else if (spec.qualities.indexOf("gray") >= 0) {
                                        quality = "gray";
                                    }
                                }
                                if ("formats" in spec) {
                                    if (spec.formats.indexOf("png") >= 0) {
                                        format = ".png";
                                    }
                                }
                            }
                        }
                        var img = [ sourceId, iiifRegion, iiifSize, "0", quality + format ].join("/");
                        $("#input_dialog").html('<div><img src="loading.gif"></div>');
                        $.getJSON("https://hentaigana.herokuapp.com/json?img=" + img, function(data) {
                            var dialogObj = $("#input_dialog");
                            dialogObj.html('');
                            if (data) {
                                if ("message" in data) {
                                    dialogObj.text(data.message);
                                } else if ("predictions" in data) {
                                    var contents = '<table id="hentaigana_result" style="width: 95%; text-align: center"><tr><th>認識候補</th><th>字母</th><th>音価</th><th>確率</th></tr>';
                                    var len = data.predictions.length;
                                    for (i = 0; i < len; i++) {
                                        contents += '<tr><td>第' + String(i+1) + '候補</td><td>' + 
                                            data.predictions[i].jibo + '</td><td>' + 
                                            data.predictions[i].onka + '</td><td style="text-align: right">' + 
                                            data.predictions[i].prob + '</td></tr>';
                                    }
                                    contents += '</table>';
                                    contents += '<p style="font-size: smaller;">Provided by <a href="https://hentaigana.herokuapp.com/" target="_blank">https://hentaigana.herokuapp.com/</a></p>';
                                    dialogObj.append(contents);
                                }
                            }
                        });
                        $("#input_dialog").keypress(function(event) { event.stopPropagation(); });
                        $("#input_dialog").dialog({
                            modal: true,
                            title: "変体仮名の画像認識",
                            close: function() {
                                viewer.removeOverlay("runtime-overlay-selection");
                            }
                        });
                    }
                }
            });
        }
        var tiledrawnHandler = false;
        viewer.addHandler("tile-drawn", function readyHandler() {
            viewer.removeHandler("tile-drawn", readyHandler); // not work in IE < 9
            if (tiledrawnHandler) { return; } else { tiledrawnHandler = true; }
            var page = viewer.currentPage();
            updateHistory(page);
        });
        viewer.addHandler("page", function(data) {
            updateHistory(data.page);
        });
        var hasHistoryReplaceState = function() {
            return history.replaceState && history.state !== undefined; //IE < 10 are not supported
        };
        function updateHistory(page) {
            if (hasHistoryReplaceState()) {
                var newUrl = location.protocol + "//" + location.host + location.pathname + '?manifest=' + event.options.src;
                if (page > 0) {
                    newUrl += "&page=" + String(page);
                }
                history.replaceState(null, null, newUrl);
            }
        }
        OpenSeadragon.addEvent(
            document,
            'keypress',
            OpenSeadragon.delegate(this, function onKeyPress(e) {
                var key = e.keyCode ? e.keyCode : e.charCode;
                switch (String.fromCharCode(key)) {
                case 'n':
                case '>':
                case '.':
                    if (viewer.nextButton) {
                        viewer.nextButton.onRelease();
                    }
                    return false;
                case 'p':
                case '<':
                case ',':
                    if (viewer.previousButton) {
                        viewer.previousButton.onRelease();
                    }
                    return false;
                case 'f':
                    if (viewer.fullPageButton) {
                        viewer.fullPageButton.onRelease();
                    }
                    return false;
                }
            }),
            false
        );
    }

    function onError(event) {
        popupElt.style.display = "block";
        document.getElementById("error").textContent =
                "Can not retrieve requested image.";
    }
})();
