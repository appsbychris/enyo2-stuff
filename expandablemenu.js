/*
this is a work in progress.

it assumes each item will have a border image with a 5px border. it may display weird without.




*/

enyo.kind({
	name: "TitledDrawer",
	kind: "onyx.Drawer",
	open: false,
	tools: [
		{kind: "Control", name: "contain", showing: false, classes: "enyo-border-box", components: [
			{kind: "Control",name: "title", style: "float:left;padding: 10px;", content: ""/*, classes: "onyx-menu-item"*/},
			{kind: "Image", name: "image", src: "images/more-items-arrow.png", style: "float: right;border: none !important;margin-top:10px;"},
		]},
		{kind: "Animator", onStep: "animatorStep", onEnd: "animatorEnd"},
		{kind: "Control", components: [
			{kind: "Control",name: "client", style: "clear:both;position: relative;", classes: "enyo-border-box"}
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
			if (t) {
				var tH = 10 + (v ? t.scrollHeight : t.scrollWidth);
			}
			this.$.animator.play({
				startValue: this.open ? 0 + (t ? tH : 0): s,
				endValue: this.open ? s : 0 + (t ? tH : 0),
				dimension: d,
				position: p
			});
		} else {
			this.$.client.setShowing(this.open);
		}
		this.$.image.setAttribute("src", this.open ? "images/close-more-items-arrow.png" : "images/more-items-arrow.png")
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
	tap: function(inSender) {
		/*this.inherited(arguments);
		this.bubble("onRequestHideMenu");
		this.doSelect({selected:this, content:this.content});*/
	},
	toggleDrawer: function() {
		this.setOpen(!this.getOpen());
	},
});