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
                counter : 20,
                fps : 10
            },

            init: function() {
                this.el = $(element);
                this.colors = [];
                this.counter = this.options.counter;
                this.initialBackgroundCssValue = this.el.css('background');

                this.setElements();
                //this.initStoredValues();
                this.setEvents();
            },

            setElements: function() {
                this.$dashboardPanel = this.el.find('.dashboard');
                this.$dashboardMana = this.$dashboardPanel.find('.mana');
                this.$editPanel = this.el.find('.edit');
                this.$editNameInput = this.el.find('.edit input');
                this.$togglePanels = this.el.find('.toggle');
                this.$colorSelector = this.el.find('.edit .mana li');
                this.$name = this.el.find('.dashboard .label .name');
                this.$counter = this.el.find('.count .number');
            },

            initStoredValues: function() {
                var name = this.store('name'),
                    counter = this.store('counter'),
                    colors = this.store('colors');

                if(name){ this.$name.text(name); }
                if(counter){ this.$counter.text(counter); }
                if(colors){ this.colors = colors.split('|'); this.setColors(); }
            },

            setEvents: function() {
                var _this = this;
                var didSwipe = false,
                    swipeDirection = ""

                document.ontouchmove = function(event) {
                    event.preventDefault();
                }

                // event management with Hammer.js
                var eventManager = this.el.hammer();

                // edit mode toggle
                eventManager.on('tap', '.toggle', function(e){
                    e.preventDefault();
                    _this.$editPanel.toggle();
                    _this.$dashboardPanel.toggle();
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
                    swipeDirection = (xpos - this.xpos > 0) ? "right" : "left";

                    this.xpos = xpos;
                });

                setInterval(function () {
                    if (didSwipe) {
                        didSwipe = false;

                        _this.updateCounter(swipeDirection);
                    }
                }, 1000 / this.options.fps);


                eventManager.on('tap', '.dashboard .count', function(e){
                    var xpos = e.gesture.center.pageX;
                    var width = $(this).width();

                        if (xpos < (width / 2)) {
                            _this.updateCounter("left");
                        } else {
                            _this.updateCounter("right");
                        }
                });

                eventManager.on('change', '.edit input', function(e){
                    value = $(this).val();
                    _this.el.find('.dashboard .name').text(value);
                    _this.store('name', value);
                });

                eventManager.on('focusin', '.edit input', function(e){
                    $(this).val('');
                });

                /* native event management
                this.$togglePanels.on('touchstart', function(e){
                    e.stopPropagation();
                    e.preventDefault();

                    _this.$editPanel.toggle();
                    _this.$dashboardPanel.toggle();
                });

                this.$colorSelector.on('touchstart', function(e){
                    e.stopPropagation();
                    e.preventDefault();

                    var color = $(e.target).data('color');
                    $(this).toggleClass('selected');
                    _this.selectColor(color);
                    _this.setColors();
                });

                this.el.find('.count').on('touchmove', function(e){
                    var xpos = e.originalEvent.touches[0].pageX,
                        direction = "";

                    if (xpos - this.xpos > 0) {
                        direction = "right";
                    } else {
                        direction = "left";
                    }

                    _this.updateCounter(direction);

                    this.xpos = xpos;

                }).on('touchstart', function(e){
                    var xpos = e.originalEvent.touches[0].pageX;
                    var width = $(this).width();

                        if (xpos < (width / 2)) {
                            _this.updateCounter("left");
                        } else {
                            _this.updateCounter("right");
                        }
                });
                */
            },

            updateCounter: function(direction) {
                var value = this.counter;

                switch (direction) {
                    case "left":
                        value--;
                        break;
                    case "right":
                        value++;
                        break;
                }

                this.$counter.text(value);
                this.counter = value;
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
                    this.$dashboardMana.find('.' + color).hide();
                } else {
                    this.colors.push(color);
                    this.$dashboardMana.find('.' + color).show();
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
                    cssValue = '-webkit-linear-gradient(-45deg, ';

                if (this.colors.length == 0) {
                    cssValue = this.initialBackgroundCssValue;
                    this.el.addClass('initial');
                } else if (this.colors.length == 1) {
                    var color = this.getColorHexaByName(this.colors[0]);
                    cssValue += color + ' 0%,' + this.getColorLuminance(color, this.options.hue)+ ' 100%)';
                    this.el.removeClass('initial');
                } else {
                    numberOfColors = this.colors.length - 1;
                    amplitude = 100 / numberOfColors;

                    for(i=0;i<=numberOfColors;i++) {
                        cssValue += this.getColorHexaByName(this.colors[i]) + ' ' + (i * amplitude) + '%';
                        if (i < numberOfColors) {
                            cssValue += ', ';
                        }
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

            store: function(key, value) {
                var val = '';

                if (!value) {
                    val = localStorage.getItem(key);

                    return val;

                } else {
                    localStorage.setItem(key, value);

                    return true;
                }
            }
        }
    }

    var player1 = new plane('#player1');
    var player2 = new plane('#player2');
    player1.app.init();
    player2.app.init();

});