/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

let lieux = "";
var app = {
    // Application Constructor
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function () {
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function (id) {


        closeInfoVar = false;
        zoomed = false;
        vibrate = false;
        oldLocationUser = [];
        lieuActuel = [];
        latUser = null;
        lngUser = null;
        latLieu = null;
        lngLieu = null;

        $('#cardInfo').hide();

        function distance(lat1, lon1, lat2, lon2, unit) {
            if ((lat1 == lat2) && (lon1 == lon2)) {
                return 0;
            }
            else {
                var radlat1 = Math.PI * lat1 / 180;
                var radlat2 = Math.PI * lat2 / 180;
                var theta = lon1 - lon2;
                var radtheta = Math.PI * theta / 180;
                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                if (dist > 1) {
                    dist = 1;
                }
                dist = Math.acos(dist);
                dist = dist * 180 / Math.PI;
                dist = dist * 60 * 1.1515;
                if (unit == "K") { dist = dist * 1.609344 }
                if (unit == "N") { dist = dist * 0.8684 }
                return dist;
            }
        }

        $.ajax({
            url: "https://devweb.iutmetz.univ-lorraine.fr/~gonzal124u/LieuxMetz/php/getAll.php",
            type: "GET",
            success: function (result) {
                lieux = JSON.parse(result);
                for (let i = 0; i < lieux.length; i++) {
                    latLieu = lieux[i]["latitude"];
                    lngLieu = lieux[i]["longitude"];
                    L.marker([latLieu, lngLieu]).addTo(mymap).on('click', function (e) {
                        openInfo(lieux[i]);
                    });
                };
            },
            error: function (error) {
                console.log(error);
            }
        });



        function openInfo(lieux) {
            $('.card-content').empty();
            $('.card-img').empty();
            $('.carousel-indicators').empty();

            $('.card-content').append('<h5 class="crad-title">' + lieux['nom'] + '</h5>');
            $('.card-content').append('<div class="scrollable"><p class="card-text card-desc">' + lieux['description'] + '</p></div>');

            for (u = 0; u < 3; u++) {
                $('.card-img').append('<div class="carousel-item"><img src="https://devweb.iutmetz.univ-lorraine.fr/~chevall49u/LieuxMetz/' + lieux['visuel'] + '_' + u + '.jpg"><div class="carousel-caption"></div>   </div>');
                $('.carousel-indicators').append('<li data-target="#carouselExampleIndicators" data-slide-to="' + u + '"></li>');
            }

            $('.carousel-item').first().addClass('active');
            $('.carousel-indicators > li').first().addClass('active');
            $('#carousel-example-generic').carousel();
            $('#cardInfo').show();
        }

        var mymap = L.map('mapid').setView([49.1191, 6.1727], 13);
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/outdoors-v11',
            accessToken: 'pk.eyJ1IjoiZHJjb21ibyIsImEiOiJjazViMHVpY2Ywc2QyM2ZwazdtNW9xNmZjIn0.s0IQl94VBUyolsiDA1LZTg'
        }).addTo(mymap);

        var onSuccess = function (position) {

            latUser = position.coords.latitude;
            lngUser = position.coords.longitude;




            if (typeof oldLocationUser !== 'undefined' && oldLocationUser.length > 0) {
                distOldUser = (distance(oldLocationUser[0], oldLocationUser[1], latUser, lngUser, "K") * 1000).toFixed(0)
                if (distOldUser > 100) {
                    closeInfoVar = false;
                }
            }


            for (let i = 0; i < lieux.length; i++) {

                latLieu = lieux[i]["latitude"];
                lngLieu = lieux[i]["longitude"];
                dist = (distance(latLieu, lngLieu, latUser, lngUser, "K") * 1000).toFixed(0);
                markerLoaded = true;


                if (dist < 100) {
                

                    if (lieuActuel.length < 1) {
                        lieuActuel = [latLieu, lngLieu];
                    }

                    // Permet de ne pas zoomer indefiniment
                    if (!zoomed) {
                        mymap.flyTo([latLieu, lngLieu], 17);
                        zoomed = true;
                    }


                    setTimeout(() => {
                        if (!closeInfoVar) {
                            openInfo(lieux[i]);
                            closeInfoVar = true;
                        }
                    }, 3500);


                }
                oldLocationUser = [latUser, lngUser];
            }

        };

        function onError(error) {
            alert('code: ' + error.code + '\n' +
                'message: ' + error.message + '\n');
        }



        $("#btnCloseInfo").click(function () {
            $('.card-content').empty();
            $('.card-img').empty();
            $('.carousel-indicators').empty();
            $('#cardInfo').hide();
        });



        var intervalID = window.setInterval(refresh, 5000);

        function refresh() {
            if (lieuActuel.length > 0) {
                //Permet de savoir quand est-ce que l'ont peu de nouveau zoomer
                d = (distance(lieuActuel[0], lieuActuel[1], latUser, lngUser, "K") * 1000).toFixed(0);
                console.log(d);
                if (d > 100) {
                    zoomed = false;
                    lieuActuel = [];
                }
            }
            navigator.geolocation.getCurrentPosition(onSuccess, onError);
        }



    }
};

app.initialize();