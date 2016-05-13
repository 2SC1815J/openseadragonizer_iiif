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
        if (Array.isArray(data.sequences) && data.sequences.length > 0) {
            var sequence = data.sequences[0];
            if (Array.isArray(sequence.canvases)) {
                for (i = 0, j = 0; i < sequence.canvases.length; i++){
                    var canvas = sequence.canvases[i];
                    if (Array.isArray(canvas.images) && canvas.images.length > 0) {
                        var image = canvas.images[0];
                        if (image.resource.service["@id"]) {
                            var id = image.resource.service["@id"];
                            if (id.slice(-1) === "/") {
                                tileSources.push(id + "info.json");
                            } else {
                                tileSources.push(id + "/info.json");
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
                                if (otherContent["@id"]) {
                                    otherContentUrl = otherContent["@id"];
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
                    if (resource.on) {
                        // minimum implementation
                        var dims = /#xywh=([0-9]+),([0-9]+),([0-9]+),([0-9]+)/.exec(resource.on);
                        if (dims && dims.length === 5) {
                            var chars = "";
                            if (typeof resource.resource.chars !== 'undefined') {
                                chars = resource.resource.chars;
                            }
                            overlays.push({
                                on: new OpenSeadragon.Rect(Number(dims[1]), Number(dims[2]), Number(dims[3]), Number(dims[4])),
                                chars: chars,
                                pageNo: page
                            });
                        }
                    }
                }
                var escapeHtml = function(str) {
                    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); //&<>'"
                };
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
