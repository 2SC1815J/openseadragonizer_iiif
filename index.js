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
 * Customized OpenSeadragonizer for IIIF manifests
 * example: index.html?manifest=http://dms-data.stanford.edu/data/manifests/BnF/jr903ng8662/manifest.json
 * example: index.html?manifest=http://dms-data.stanford.edu/data/manifests/BnF/jr903ng8662/manifest.json&page=6
 * 
 * Copyright (C) 2016, 2SC1815J
 * https://twitter.com/2SC1815J
 * Released under the New BSD license.
 * https://github.com/2SC1815J/openseadragonizer_iiif
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

            var extAnnotsUrlParameter = OpenSeadragon.getUrlParameter("extannots");
            var extAnnotsUrl = OpenSeadragon.getUrlParameter("encoded") ?
                decodeURIComponent(extAnnotsUrlParameter) : extAnnotsUrlParameter;

            var initialPage = parseInt(OpenSeadragon.getUrlParameter("page"), 10);
            if (isNaN(initialPage)) {
                initialPage = 0;
            }
            var options = {
                src: url,
                extAnnotsUrl: extAnnotsUrl,
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
        if (event.options.extAnnotsUrl) {
            OpenSeadragon.makeAjaxRequest({
                url: event.options.extAnnotsUrl,
                success: function(xhr) {
                    try {
                        var data = OpenSeadragon.parseJSON(xhr.responseText);
                        event.extAnnotsList = data;
                    } catch (e) {
                    }
                    onManifestExtLoaded(event);
                },
                error: function(xhr) {
                    onManifestExtLoaded(event);
                }
            });
        } else {
            onManifestExtLoaded(event);
        }
    }

    function onManifestExtLoaded(event) {
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
        var extAnnotsList = null;
        var extAnnotsMap = {};
        if (event.extAnnotsList) {
            extAnnotsList = event.extAnnotsList;
            if (!Array.isArray(extAnnotsList)) {
                extAnnotsList = [ extAnnotsList ];
            }
            for (i = 0; i < extAnnotsList.length; i++){
                var extAnnots = extAnnotsList[i];
                if (extAnnots && Array.isArray(extAnnots.resources) && 
                    extAnnots.resources.length > 0 && extAnnots.resources[0].on) {
                    var extAnnotsCanvaseId = extAnnots.resources[0].on.split("#")[0];
                    if (extAnnotsCanvaseId) {
                        extAnnotsMap[extAnnotsCanvaseId] = i;
                    }
                }
            }
        }
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
                            var extAnnotsData = null;
                            if (image.on) {
                                var canvaseId = image.on;
                                if (canvaseId in extAnnotsMap) {
                                    extAnnotsData = extAnnotsList[extAnnotsMap[canvaseId]];
                                }
                            }
                            var otherContentUrl = null;
                            if (Array.isArray(canvas.otherContent) && canvas.otherContent.length > 0) {
                                var otherContent = canvas.otherContent[0];
                                if (otherContent && otherContent["@id"]) {
                                    otherContentUrl = otherContent["@id"];
                                    baseUriOtherContentIdMap[baseUri] = otherContentUrl;
                                }
                            }
                            if (otherContentUrl || extAnnotsData) {
                                otherContents.push( { tileSourcesIndex: j, url: otherContentUrl, extAnnots: extAnnotsData } );
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
            prefixUrl: "openseadragon/images/",
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
                    var iiifQuality = "default.jpg";
                    var source = tiledImage.source;
                    var sourceId = source['@id'].replace(/%2F/g, "/");
                    // logic taken from OpenSeadragon.TileSource.getTileUrl()
                    if ( source['@context'].indexOf('/1.0/context.json') > -1 ||
                         source['@context'].indexOf('/1.1/context.json') > -1 ||
                         source['@context'].indexOf('/1/context.json') > -1 ) {
                        iiifQuality = "native.jpg";
                    }
                    var uri = [ sourceId, iiifRegion, iiifSize, "0", iiifQuality ].join("/");
                    OpenSeadragon.console.log(uri);
                    
                    viewer.removeOverlay("runtime-overlay-selection");
                    var elt = document.createElement("div");
                    elt.id = "runtime-overlay-selection";
                    elt.className = "highlightpre";
                    viewer.addOverlay({
                        element: elt,
                        location: new OpenSeadragon.Rect(rect.x, rect.y, rect.width, rect.height)
                    });
                    
                    function addAnnot(chars) {
                        if (!(sourceId in baseUriCanvaseIdMap)) { return; }
                        var resourcesOn = baseUriCanvaseIdMap[sourceId] + "#xywh=" + iiifRegion;
                        OpenSeadragon.console.log(resourcesOn);
                        
                        // taken from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
                        var newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r&3|8)).toString(16);});
                        
                        var baseUri = options.src;
                        if (baseUri.slice(-1) === "/") {
                            baseUri = baseUri.slice(0, -1);
                        } else {
                            var manifestElems = baseUri.split("/");
                            if (manifestElems && manifestElems.length > 0) {
                                var lastElem = manifestElems[manifestElems.length - 1];
                                if (lastElem.indexOf("manifest") > -1 || lastElem.search(/\.json$/) !== -1) {
                                    baseUri = manifestElems.slice(0, manifestElems.length - 1).join("/");
                                }
                            }
                        }
                        
                        var currentPage = viewer.currentPage();
                        var annotDataId;
                        if (sourceId in baseUriOtherContentIdMap) {
                            annotDataId = baseUriOtherContentIdMap[sourceId];
                        } else {
                            annotDataId = baseUri + "/list/p" + (currentPage + 1) + ".json";
                        }
                        
                        var resource = {};
                        resource["@id"] = baseUri + "/p" + (currentPage + 1) + "/" + newId + "/1";
                        resource["@type"] = "cnt:ContentAsText";
                        resource.chars = chars || newId;
                        resource.format = "text/plain";
                        resource.language = "en";
                        var resources = {};
                        resources["@id"] = baseUri + "/p" + (currentPage + 1) + "/" + newId;
                        resources["@type"] = "oa:Annotation";
                        resources.motivation = "sc:painting";
                        resources.resource = resource;
                        resources.on = resourcesOn;
                        var annotData = {};
                        annotData["@context"] = "http://iiif.io/api/presentation/2/context.json";
                        annotData["@id"] = annotDataId;
                        annotData["@type"] = "sc:AnnotationList";
                        annotData.resources = [ resources ];
                        
                        var i, j;
                        var appended = false;
                        for (i = 0; i < otherContents.length; i++) {
                            var otherContent = otherContents[i];
                            if (otherContent.tileSourcesIndex === currentPage) {
                                if (otherContent.extAnnots && Array.isArray(otherContent.extAnnots.resources)) {
                                    var rcids = {};
                                    for (j = 0; j < otherContent.extAnnots.resources.length; j++) {
                                        var rc = otherContent.extAnnots.resources[j];
                                        if (rc["@id"]) {
                                            rcids[rc["@id"]] = true;
                                        }
                                    }
                                    if (!(resources["@id"] in rcids)) {
                                        otherContent.extAnnots.resources.push(resources);
                                    }
                                } else {
                                    otherContent.extAnnots = annotData;
                                }
                                appended = true;
                            }
                        }
                        if (!appended) {
                            otherContents.push( { tileSourcesIndex: currentPage, url: null, extAnnots: annotData } );
                        }
                        
                        loadAnnots(currentPage);
                    }
                    if (sourceId in baseUriCanvaseIdMap) {
                        $("#input_dialog").html('<input type="text" id="input_dialog_text" name="input_dialog_text" style="width: 95%;" />');
                        $("#input_dialog").keypress(function(event) { event.stopPropagation(); });
                        $("#input_dialog").dialog({
                            modal: true,
                            title: "Input an annotaion text",
                            buttons: {
                                "OK": function() {
                                    $(this).dialog("close");
                                    addAnnot($("#input_dialog_text").val());
                                },
                                "Cancel": function() {
                                    $(this).dialog("close");
                                    viewer.removeOverlay("runtime-overlay-selection");
                                }
                            }
                        });
                    }
                }
            });
            OpenSeadragon.addEvent(
                document,
                'keypress',
                OpenSeadragon.delegate(this, function onKeyPress(e) {
                    var key = e.keyCode ? e.keyCode : e.charCode;
                    switch (String.fromCharCode(key)) {
                    case 'j':
                        var otherContentExtAnnots = [];
                        for (i = 0; i < otherContents.length; i++) {
                            if (otherContents[i].extAnnots) {
                                otherContentExtAnnots.push(otherContents[i].extAnnots);
                            }
                        }
                        OpenSeadragon.console.log(window.JSON.stringify(otherContentExtAnnots));
                        if (window.navigator.msSaveBlob) {
                            window.navigator.msSaveBlob(new Blob([ window.JSON.stringify(otherContentExtAnnots, null, "   ") ], { type: "text/plain" }), "annotations.json");
                        } else if (URL.createObjectURL) {
                            var elt = document.createElement("a");
                            elt.href = URL.createObjectURL(new Blob([ window.JSON.stringify(otherContentExtAnnots, null, "   ") ], { type: "text/plain" }));
                            elt.download = "annotations.json";
                            document.body.appendChild(elt);
                            elt.click();
                            document.body.removeChild(elt);
                        }
                        return false;
                    }
                }),
                false
            );
        }
        var tiledrawnHandler = false;
        viewer.addHandler("tile-drawn", function readyHandler() {
            viewer.removeHandler("tile-drawn", readyHandler); // not work in IE < 9
            if (tiledrawnHandler) { return; } else { tiledrawnHandler = true; }
            var page = viewer.currentPage();
            updateHistory(page);
            loadAnnots(page);
        });
        viewer.addHandler("page", function(data) {
            updateHistory(data.page);
            loadAnnots(data.page);
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
                if (event.extAnnotsList) {
                    newUrl += "&extannots=" + event.options.extAnnotsUrl;
                }
                history.replaceState(null, null, newUrl);
            }
        }
        function loadAnnots(page) {
            for (var i = 0; i < otherContents.length; i++) {
                var otherContent = otherContents[i];
                if (otherContent.tileSourcesIndex === page) {
                    var annotUrl = otherContent.url;
                    var extAnnots = otherContent.extAnnots;
                    if (annotUrl) {
                        loadAnnotsAjaxRequest(annotUrl, page, extAnnots);
                    } else if (extAnnots) {
                        onAnnotsLoaded(extAnnots, page);
                    }
                }
            }
        }
        function loadAnnotsAjaxRequest(annotUrl, page, extAnnots) {
            OpenSeadragon.makeAjaxRequest({
                url: annotUrl,
                success: function(xhr) {
                    var data = OpenSeadragon.parseJSON(xhr.responseText);
                    onAnnotsLoaded(data, page, extAnnots);
                }
            });
        }
        function onAnnotsLoaded(data, page, extAnnots) {
            if (!data) { return; }
            var getCssText = function(styleContent, selectorName) {
                // taken from http://stackoverflow.com/questions/3326494/parsing-css-in-javascript-jquery
                try {
                    // not work in IE < 9
                    var doc = document.implementation.createHTMLDocument("");
                    var styleElement = document.createElement("style");
                    
                    styleElement.textContent = styleContent;
                    doc.body.appendChild(styleElement);
                    
                    for (var i = 0; i < styleElement.sheet.cssRules.length; i++) {
                        if (styleElement.sheet.cssRules[i].selectorText === selectorName) {
                            return styleElement.sheet.cssRules[i].style.cssText;
                        }
                    }
                } catch (e) {
                }
                return "";
            };
            
            if (extAnnots && Array.isArray(extAnnots.resources)) {
                if (Array.isArray(data.resources)) {
                    data.resources = data.resources.concat(extAnnots.resources);
                } else if (data.resources) {
                    data.resources = [ data.resources ].concat(extAnnots.resources);
                } else {
                    data.resources = extAnnots.resources;
                }
            }
            if (Array.isArray(data.resources) && data.resources.length > 0) {
                var overlays = [];
                for (var i = 0; i < data.resources.length; i++){
                    var resource = data.resources[i];
                    if (resource && resource.on) {
                        // minimum implementation
                        var dims = /#xywh=([0-9]+),([0-9]+),([0-9]+),([0-9]+)/.exec(resource.on);
                        if (dims && dims.length === 5) {
                            var chars = "";
                            var styleCss = "";
                            if (resource.resource) {
                                var rc = resource.resource;
                                if (typeof rc.chars !== 'undefined') {
                                    chars = rc.chars;
                                } else if (rc.full && typeof rc.full.chars !== 'undefined') {
                                    chars = rc.full.chars;
                                    if (resource.stylesheet && resource.stylesheet.chars && rc.style) {
                                        styleCss = getCssText(resource.stylesheet.chars, "." + rc.style);
                                    }
                                }
                            }
                            overlays.push({
                                on: new OpenSeadragon.Rect(Number(dims[1]), Number(dims[2]), Number(dims[3]), Number(dims[4])),
                                chars: chars,
                                styleCss: styleCss,
                                pageNo: page
                            });
                        }
                    }
                }
                var escapeHtml = function(str) {
                    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); //&<>'"
                };
                viewer.clearOverlays();
                var tiledrawnHandler2 = false;
                viewer.addHandler("tile-drawn", function readyHandler2() {
                    viewer.removeHandler("tile-drawn", readyHandler2); // not work in IE < 9
                    if (tiledrawnHandler2) { return; } else { tiledrawnHandler2 = true; }
                    var tiledImage = viewer.world.getItemAt(0);
                    var isTouchDevice = "ontouchstart" in window;
                    var tooltipTimeoutId = null;
                    function addEvent(elt, type, handler) {
                        if (elt.addEventListener) {
                            elt.addEventListener(type, handler);
                        } else if (elt.attachEvent) {
                            elt.attachEvent("on" + type, function() { handler.call(elt, window.event); });
                        }
                    }
                    function removeTooltip() {
                        var eltTooltip = document.getElementById("runtime-tooltip");
                        if (eltTooltip && eltTooltip.parentNode) {
                            eltTooltip.parentNode.removeChild(eltTooltip);
                        }
                    }
                    function addTooltip(elt) {
                        return function(event) {
                            var eltTooltip = document.createElement("div");
                            eltTooltip.id = "runtime-tooltip";
                            eltTooltip.className = "tooltip";
                            eltTooltip.innerHTML = elt.getAttribute("data-text");
                            var styleCss = elt.getAttribute("data-tooltip-css");
                            if (styleCss) {
                                eltTooltip.setAttribute("style", styleCss);
                            }
                            var eltTooltipOld = document.getElementById(eltTooltip.id);
                            if (eltTooltipOld && eltTooltipOld.parentNode) {
                                eltTooltipOld.parentNode.removeChild(eltTooltipOld);
                                if (isTouchDevice) {
                                    if (tooltipTimeoutId) {
                                        clearTimeout(tooltipTimeoutId);
                                        tooltipTimeoutId = null;
                                    }
                                }
                            }
                            elt.appendChild(eltTooltip);
                            if (isTouchDevice) {
                                tooltipTimeoutId = setTimeout(removeTooltip, 3000);
                            }
                        };
                    }
                    for (var i = 0; i < overlays.length; i++) {
                        if (overlays[i].pageNo !== viewer.currentPage()) {
                            continue;
                        }
                        viewer.removeOverlay("runtime-overlay" + i);
                        var elt = document.createElement("div");
                        elt.id = "runtime-overlay" + i;
                        elt.className = "highlight";
                        elt.setAttribute("data-text", escapeHtml(overlays[i].chars));
                        if (overlays[i].styleCss) {
                            elt.setAttribute("data-tooltip-css", overlays[i].styleCss);
                        }
                        var ev1, ev2;
                        if (isTouchDevice) {
                            ev1 = "touchstart";
                            //ev2 = "touchend"; //'touchend' is captured and canceled by OpenSeadragon
                        } else {
                            ev1 = "mouseover";
                            ev2 = "mouseout";
                        }
                        addEvent(elt, ev1, addTooltip(elt));
                        if (!isTouchDevice) {
                            addEvent(elt, ev2, removeTooltip);
                        }
                        var on = overlays[i].on;
                        viewer.addOverlay({
                            element: elt,
                            location: tiledImage.imageToViewportRectangle(on.x, on.y, on.width, on.height)
                        });
                    }
                });
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
