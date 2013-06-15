$(document).ready(function(){

    var colorScheme = {
        white : "ffeeaa",
        blue : "157dde",
        black : "222222",
        red : "c91800",
        green : "318428"
    }

    var plane = function (element, options) {

        this.app = {
                options: {
                hue : "0.2"
            },

            init: function() {
                this.el = $(element);
                this.colors = [];
                this.initialBackgroundCssValue = this.el.css('background');

                this.setElements();
                this.setEvents();
            },

            setElements: function() {
                this.$dashboardPanel = this.el.find('.dashboard');
                this.$editPanel = this.el.find('.edit');
                this.$colorSelector = this.el.find('.edit .mana li');
                this.$nameLabel = this.el.find('.dashboard header .label');
            },

            setEvents: function() {
                var _this = this;

                this.$nameLabel.on('click', function(e){
                    _this.$editPanel.toggle();
                    _this.$dashboardPanel.toggle();
                });

                this.$colorSelector.on('click', function(e){
                    var color = $(e.target).data('color');
                    $(this).toggleClass('selected');
                    _this.selectColor(color);
                    _this.setBackgroundColors()
                });
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

                // sort array by name
                this.colors.sort();
            },

            getColorHexaByName: function(colorName) {
                var colorHexa = '#' + colorScheme[colorName];
                return colorHexa;
            },

            setBackgroundColors: function() {
                var cssParams = [],
                    i = 0,
                    cssValue = '-webkit-linear-gradient(-45deg, ';

                if (this.colors.length == 0) {
                    cssValue = this.initialBackgroundCssValue;
                } else if (this.colors.length == 1) {
                    var color = this.getColorHexaByName(this.colors[0]);
                    cssValue += color + ' 0%,' + this.getColorLuminance(color, this.options.hue)+ ' 100%)';
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

                }
                console.log(cssValue);
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
            }
        }
    }

    var player1 = new plane('#player1');
    var player2 = new plane('#player2');
    player1.app.init();
    player2.app.init();

});