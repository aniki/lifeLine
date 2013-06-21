$(document).ready(function(){

    var colorScheme = {
        white : "dacf9a",
        blue : "3a81b2",
        black : "201f1f",
        red : "ab4445",
        green : "50a36d"
    }

    var plane = function (element, options) {

        this.app = {
            options: {
                hue : "1.5",
                startingScore : 20,
                fps : 10,
                tickerInterval: 3000,
                appCacheConfirm: 'A new version of this application is available. Load it?'
            },

            init: function() {
                this.el = $(element);
                this.player = this.el.attr('id');
                this.colors = [];
                this.score = this.options.startingScore;
                this.timer = 3000;
                this.history = [];
                this.scoreDelta = 0;
                this.initialBackgroundCssValue = this.el.css('background');

                this.setElements();
                this.initStoredValues();
                this.detectInversion();
                this.setEvents();
            },

            setElements: function() {
                this.$dashboardPanel = this.el.find('.dashboard');
                this.$editPanel = this.el.find('.edit');
                this.$name = this.el.find('.dashboard .label .name');
                this.$counter = this.el.find('.count .number');
                this.$editForm = this.el.find('.edit form');
            },

            initStoredValues: function() {
                var name = this.store('name'),
                    score = this.store('score'),
                    colors = this.store('colors'),
                    history = this.store('history');

                if(name){ this.$name.text(name); }
                if(score){ this.$counter.text(score); this.score = score; }
                if(colors){ this.colors = colors.split('|'); this.setColors(); }
                if(history){ this.history = history.split('|'); }
            },

            detectInversion: function() {
                this.inverted = (this.el.css('content') == 'i') ? true : false ;
            },

            setEvents: function() {
                var _this = this;
                var didSwipe = false,
                    swipeDirection = ""

                document.ontouchmove = function(event) {
                    event.preventDefault();
                }

                window.addEventListener('load', function(e) {
                    // appCache management
                    _this.cache('update');
                }, false);

                window.addEventListener("orientationchange", function() {
                	// Announce the new orientation change
                    _this.detectInversion();
                }, false);

                // ticker event
                this.el.on('tick', function(e){
                    _this.registerScore();
                });

                // event management with Hammer.js
                var eventManager = this.el.hammer();

                // edit mode toggle
                eventManager.on('tap', '.toggle', function(e){
                    e.preventDefault();
                    _this.$editPanel.toggle();
                    _this.$dashboardPanel.toggle();
                    e.stopPropagation();
                });

                eventManager.on('click', '.toggle', function(e){
                    e.preventDefault();
                    e.stopPropagation();
                });

                // edit mode mana chooser
                eventManager.on('tap', '.edit .mana li', function(e){
                    e.preventDefault();
                    var color = $(e.target).data('color');
                    $(this).toggleClass('selected');
                    _this.selectColor(color);
                    _this.setColors();
                    e.stopPropagation();
                });

                // edit mode player name
                eventManager.on('tap', '.edit input', function(e){
                    e.preventDefault();

                    e.stopPropagation();
                });

                // counter events
                eventManager.on('drag', '.dashboard .count', function(e){
                    var xpos = e.gesture.center.pageX;

                    didSwipe = true;

                    if (xpos - this.xpos > 0) {
                        swipeDirection = (_this.inverted) ? "left" : "right";
                    } else {
                        swipeDirection = (_this.inverted) ? "right" : "left";
                    }

                    this.xpos = xpos;
                });

                setInterval(function () {
                    if (didSwipe) {
                        didSwipe = false;

                        _this.updateCounter(swipeDirection);
                        _this.ticker();

                    }
                }, 1000 / this.options.fps);


                eventManager.on('tap', '.dashboard .count', function(e){
                    var xpos = e.gesture.center.pageX - _this.el.offset().left;
                    var width = $(this).width();

                    if (xpos < (width / 2)) {
                        _this.updateCounter((_this.inverted) ? "right" : "left");
                    } else {
                        _this.updateCounter((_this.inverted) ? "left" : "right");
                    }

                    _this.ticker();
                });

                eventManager.on('change', '.edit input', function(e){
                    value = $(this).val();
                    _this.el.find('.dashboard .name').text(value);
                    _this.store('name', value);
                });

                eventManager.on('focusin', '.edit input', function(e){
                    $(this).val('');
                });

                this.$editForm.on('submit', function(e){
                    e.preventDefault();
                });
            },

            ticker: function() {
                _this = this;

                if(this.clock) {
                    clearTimeout(this.clock);
                }
                this.clock = setTimeout(function(){
                    _this.el.trigger('tick');
                }, this.options.tickerInterval);
            },

            updateCounter: function(direction) {
                var value = this.score,
                    scoreDelta = this.scoreDelta;

                switch (direction) {
                    case "left":
                        value--;
                        scoreDelta--;
                        break;
                    case "right":
                        value++;
                        scoreDelta++;
                        break;
                }

                this.$counter.text(value);
                this.score = value;
                this.scoreDelta = scoreDelta;
                this.store('score', value);
            },

            registerScore: function() {
                var variation = (this.scoreDelta > 0) ? '+' + this.scoreDelta : this.scoreDelta;

                this.history.push(this.score + '/' + variation);
                this.store('history', this.history.join('|'));
                this.scoreDelta = 0;
            },

            selectColor: function(color) {
                var registered = false,
                    id;

                // iterate through colors array to check if already selected
                $.each(this.colors, function(index, value){
                    if (value == color) {
                        registered = true;
                        id = index;
                    }
                });

                // toggle value in colors array
                if (registered == true) {
                    this.colors.remove(id);
                } else {
                    this.colors.push(color);
                }

                // store colors in localStorage
                this.store('colors', this.colors.join('|'));

                // sort array by name
                //this.colors.sort();
            },

            getColorHexaByName: function(colorName) {
                var colorHexa = '#' + colorScheme[colorName];
                return colorHexa;
            },

            setColors: function() {
                var cssParams = [],
                    i = 0,
                    manaSelector = '.mana',
                    cssValue = '-webkit-linear-gradient(-45deg, ';

                this.el.find('.mana li').removeClass('selected');

                if (this.colors.length == 0) {
                    cssValue = this.initialBackgroundCssValue;
                    this.el.addClass('initial');
                } else if (this.colors.length == 1) {
                    var color = this.getColorHexaByName(this.colors[0]);
                    cssValue += color + ' 0%,' + this.getColorLuminance(color, this.options.hue)+ ' 100%)';
                    this.el.removeClass('initial');
                    this.el.find(manaSelector + ' .' + this.colors[0]).addClass('selected');
                } else {
                    numberOfColors = this.colors.length - 1;
                    amplitude = 100 / numberOfColors;


                    for(i=0;i<=numberOfColors;i++) {
                        cssValue += this.getColorHexaByName(this.colors[i]) + ' ' + (i * amplitude) + '%';
                        if (i < numberOfColors) {
                            cssValue += ', ';
                        }
                        this.el.find(manaSelector + ' .' + this.colors[i]).addClass('selected');
                    }
                    cssValue += ')';
                    this.el.removeClass('initial');
                }

                if (this.colors.length > 0) {
                    this.el.addClass('withColors');
                } else {
                    this.el.removeClass('withColors');
                }

                this.el.css('background', cssValue);

            },

            getColorLuminance: function(hex, lum) {

                // validate hex string
                hex = String(hex).replace(/[^0-9a-f]/gi, '');

                if (hex.length < 6) { // 3 digits hexa value, convert to 6 digits
                    hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
                }
                lum = lum || 0;

                // convert to decimal and change luminosity
                var rgb = "#", c, i;
                for (i = 0; i < 3; i++) {
                    c = parseInt(hex.substr(i*2,2), 16);
                    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
                    rgb += ("00"+c).substr(c.length);
                }
                return rgb;
            },

            // LocalStorage managment
            store: function(key, value) {
                var obj = JSON.parse(localStorage.getItem(this.player)) || {};

                if (value === undefined) {
                    return obj[key];
                } else {
                    if (value == "/cc") {
                        localStorage.clear();
                    } else {
                        obj[key] = value;
                        localStorage.setItem(this.player, JSON.stringify(obj));
                        return true;
                    }
                }
            },

            // Application cache management
            cache : function(action) {
                var _this = this;
                var appCache = window.applicationCache;

                if (action == "update") {

                    // appCache update handling (code snippet from html5rocks.com)
                    window.applicationCache.addEventListener('updateready', function(e) {
                    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                        // Browser downloaded a new app cache.
                        // Swap it in and reload the page to get the new hotness.
                        window.applicationCache.swapCache();
                        if (confirm(_this.options.appCacheConfirm)) {
                            window.location.reload();
                        }
                    } else {
                      // Manifest didn't changed. Nothing new to server.
                    }
                  }, false);
                }
            },

            handleCacheEvent : function(e) {
                // not used for now...
            },

            handleCacheEvent: function(e) {
                // not used for now...
            }
        }
    }

    var player1 = new plane('#player1');
    var player2 = new plane('#player2');
    player1.app.init();
    player2.app.init();

});