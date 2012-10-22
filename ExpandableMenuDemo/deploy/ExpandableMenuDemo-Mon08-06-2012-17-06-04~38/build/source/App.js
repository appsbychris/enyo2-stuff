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

enyo.kind({
  kind: "onyx.MenuDecorator",
	name: "MyMenu",
	published: {

	},
	events: {
		onSelected: ""
	},
	components: [
		{kind: "onyx.Menu", name: "mainMenu", onSelect: "checkMenuItem", components: [
			{kind: "Scroller", horizontal: "hidden", defaultKind: "onyx.MenuItem", strategyKind: "enyo.TranslateScrollStrategy", thumb: false, name: "mainMenuItems", components:[

			]}
		]}
	],
	openLocation: "top:0;left:0;",
	itemHeight: 46,
	openAt: function(dims) {
		var s = "";
		for (props in dims) {
			s = s + props + ":" + dims[props] + "px;";
		}
		this.openLocation = s;
		this.loadMenuItems();
		this.$.mainMenu.requestMenuShow();
	},
	loadMenuItems: function() {
		var listItems = [];
		var objSet = function() {
			return {
				kind: "ExpandableMenuItem",
				content: "Top Level",
				classes: "normal-item",
				components: [
					{content: "subMenUItem", classes: "dark-item onyx-menu-item"},
					{content: "subMenuItem", classes: "dark-item onyx-menu-item"},
					{
						kind: "ExpandableMenuItem",
						content: "Mid Level",
						classes: "dark-item",
						components: [
							{ content: "2nd Level subMenUItem", classes: "very-dark-item onyx-menu-item"},
							{ content: "2nd Level subMenuItem", classes: "very-dark-item onyx-menu-item"}
						]
					}
				]};
			
		};

		for (var i = 0; i < 10; i++) {
			var y = new objSet();
			y.content += i;
			y.components[0].content += i;
			y.components[1].content += i;
			y.components[2].content += i;
			y.components[2].components[0].content += i;
			y.components[2].components[1].content += i;
			listItems.push(y);
		}
		
		var x = (listItems.length * this.itemHeight);
		if (x > window.innerHeight - 100) {
			x = window.innerHeight - 100;
		}

		this.$.mainMenu.setStyle("max-height: " + x + "px;left:auto;" + this.openLocation);
		this.$.mainMenuItems.destroyClientControls();
		this.$.mainMenuItems.createComponents(listItems, {owner: this.$.mainMenu});
		this.$.mainMenuItems.setStyle("height: " + x + "px;");
		this.$.mainMenuItems.render();

	},
	checkMenuItem: function(iS,iR) {
		this.doSelected({content: iR.content});
	}


});

enyo.kind({
	name: "App",
	fit: true,
	components:[
		{kind: "onyx.Button", content: "Click for menu", ontap: "openMenu"},
		{name: "clicked"},
		{kind: "MyMenu", name: "myMenu", onSelected: "writeSelected"}
	],
	openMenu: function(inSender, inEvent) {
		this.$.myMenu.openAt({top: 15, left:20});
	},
	writeSelected: function(iS, iE) {
		this.$.clicked.setContent(iE.content);

	}
});
