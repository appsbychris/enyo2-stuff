/*
this is a work in progress.

it assumes each item will have a border image with a 5px border. it may display weird without.




*/

enyo.kind({
	name: "TitledDrawer",
	kind: "onyx.Drawer",
	open: false,
	allowClick: false, //allows auto opening of drawer
	noAnimate: false, //can turn off animation for situations where animations looks bad
	handlers:{
		ontap: "toggleOpen",
		onSubMenuOpen: "adjustSize"
	},
	events: {
		onOpenChanged: ""
	},
	tools: [
		{kind: "Control", name: "contain", showing: false, classes: "enyo-border-box", components: [
			{kind: "Control",name: "title", style: "float:left;padding: 10px;", content: ""/*, classes: "onyx-menu-item"*/},
			{kind: "Image", name: "image", src: "assets/more-items-arrow.png", style: "float: right;border: none !important;margin-top:10px;"}
		]},
		{kind: "Animator", onStep: "animatorStep", onEnd: "animatorEnd"},
		{kind: "Control", style: "clear:both;position: relative;overflow: hidden;height:100%;width:100%;",components: [
			{kind: "Control",name: "client", style: "position: relative;", classes: "enyo-border-box"}
		]}
	],
	initComponents: function() {
		if (this.content && this.content.length > 0) {
			this.tools[0].showing = true;
			this.tools[0].components[0].content = this.content;
			this.tools[0].style = "position: relative;display: block;";
		}
		this.inherited(arguments);

	},
	adjustSize: function() {
		var x = this.noAnimate;
		this.noAnimate = true;
		this.openChanged();
		this.noAnimate = x;
	},
	openChanged: function() {
		this.$.client.show();

		if (this.hasNode()) {
			var v = this.orient == "v";
			var d = v ? "height" : "width";
			var p = v ? "top" : "left";
			this.applyStyle(d, null);
			var subItems = this.getClientControls();

			var s = this.hasNode()[v ? "scrollHeight" : "scrollWidth"] + ((subItems.length-1) * 10);
			var t = this.$.contain.hasNode();
			var tH = 0;
			if (t) {
				tH = 10 + (v ? t.scrollHeight : t.scrollWidth);
			}
			//to turn off animation in case it doesn't work well on target platforms
			if (this.noAnimate === false) {
				this.$.animator.play({
					startValue: this.open ? 0 + (t ? tH : 0): s,
					endValue: this.open ? s : 0 + (t ? tH : 0),
					dimension: d,
					position: p
				});
			}
			else {
				this.applyStyle(d,this.open ? 0 + (t ? tH : 0): s + (t ? tH : 0));
				this.$.client.setShowing(this.open);
			}
		} else {
			this.$.client.setShowing(this.open);
		}
		this.$.image.setAttribute("src", this.open ? "assets/close-more-items-arrow.png" : "assets/more-items-arrow.png");
		this.doOpenChanged({open: this.open});
		this.bubbleUp("onSubMenuOpen");
	},
	toggleOpen: function() {
		if (this.allowClick === true) {
			this.setOpen(!this.getOpen());
			return true;
		}
	}
});
enyo.kind({
	name: "ExpandableMenuItem",
	kind: "TitledDrawer",
	classes: "",
	defaultKind: "onyx.MenuItem",
	events: {
		onSelect: ""
	},
	handlers: {
		ontap: "toggleDrawer"
	},
	toggleDrawer: function() {
		this.setOpen(!this.getOpen());
		return true;
	}
});