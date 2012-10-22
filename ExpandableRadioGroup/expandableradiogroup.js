enyo.kind({
	name: "expandable.RadioButton",
	kind: "Button",
	classes: "expand-radiobutton"
});


enyo.kind({
	name: "expandable.RadioGroup",
	kind: "Group",
	published: {
		controlWidth: 142,
		unit: "px"
	},
	//* If true (the default), only one radio button may be active at a time.
	highlander: true,
	defaultKind: "expandable.RadioButton",
	create: function() {
		this.inherited(arguments);
		setTimeout(enyo.bind(this,function() {
			this.flowSize();
		}), 250);
		
	},
	controlWidthChanged: function() {
		this.flowSize();
	},
	unitChanged: function() {
		this.flowSize();
	},
	flowSize: function() {
		var c = this.getClientControls();
		var i = 0;
		for (i = 0; i < c.length; i++) {
			c[i].applyStyle ("width", this.controlWidth + this.unit);
			c[i].removeClass("expand-radiobutton-top-left");
			c[i].removeClass("expand-radiobutton-top-right");
			c[i].removeClass("expand-radiobutton-bottom-left");
			c[i].removeClass("expand-radiobutton-bottom-right");
			c[i].removeClass("expand-radiobutton-right-border");
		}
		var b = this.getBounds();
		var w = this.controlWidth;

		//sometimes getbounds doesn't return a width,
		//i use the window width if its not there
		if (!b.width) {b.width = window.innerWidth - 20;}
		if (b.width) {
			if ((w * c.length) > b.width) {
				var c_w = Math.floor(b.width / w);
				var maxLevels = Math.ceil(c.length / c_w);
				var level = 1;
				var row = 1;
				var bool = false;
				for (i = 0; i < c.length; i++) {
					bool = false;
					if (row === 1 && level === 1) {
						c[i].addClass("expand-radiobutton-top-left");
						if (c_w > 1) {
							row++;
						}
						bool = (c_w == 1 ? false : true);
					}
					if (row == c_w && (level == 1 || i + c_w >= c.length) && bool === false) {
						if (level == 1) {
							c[i].addClass("expand-radiobutton-top-right");
						}
						c[i].addClass("expand-radiobutton-right-border");
						if ((i + c_w >= c.length)) {
							c[i].addClass("expand-radiobutton-bottom-right");
						
						}
						level++;
						row = 1;
						bool = true;
					}

					if (row == 1 && level == maxLevels && bool === false) {
						c[i].addClass("expand-radiobutton-bottom-left");
						
						if (c_w > 1) {
							row++;
						}
						bool = (c_w == 1 ? false : true);
					}
					if ((row == c_w && level == maxLevels && bool === false) || i == (c.length - 1)) {
						c[i].addClass("expand-radiobutton-bottom-right");
						c[i].addClass("expand-radiobutton-right-border");
						break;
					}
					if (bool === false ) {
						//
						if (row >= c_w) {
							c[i].addClass("expand-radiobutton-right-border");
							level++;
							row = 1;
						}
						else {
							row++;
						}
					}
				}
			}
			else {
				c[0].addClass("expand-radiobutton-top-left");
				c[0].addClass("expand-radiobutton-bottom-left");
				c[c.length - 1].addClass("expand-radiobutton-top-right");
				c[c.length - 1].addClass("expand-radiobutton-right-border");
				c[c.length - 1].addClass("expand-radiobutton-bottom-right");
			}
		}
		
	},
	resizeHandler: function() {
		this.flowSize();
	}
});