/** SlideableMenuItem

	This is the default kind for the SlideableMenu. It probably wouldn't make much
	sense to use outside of the SlideableMenu


*/


enyo.kind({
	name: "SlideableMenuItem",
	kind: "Slideable3d",
	unit: "%",
	draggable: false,
	classes: "slideable-menu slideable-menu-item",
	published: {
		//* Path to icon
		icon: "",

		//* Item Content
		content: "",

		//* Algins the icon to the left or right of the item content
		//* Valid values are "left" and "right"
		iconAlign: "left",

		//componentMode: use your own components instead. Set up one component with
		//an isContent property so you can get the content with getContent()
		/*
			{
				kind: "SlideableMenuItem",
				componentMode: true,
				components: [
					{kind: "MyCustomImageStacker", srcUrls: tmp, maxPics: 3, style: "display:inline-block;margin-right:6px;"},
					{content: "My Content",isContent: true, style: "display:inline-block;"}
				]
			}

			Note, you can't use the standard icon with componentsMode.
		*/
		componentMode: false,

		//* If this item has sub menu items, set this is true, and set up a subMenuItems block (see below)
		subMenu: false,

		//* If this item contains a sub menu, this will be the title of the sub menu
		//* (leave blank to use the same title the menu had.)
		subMenuTitle: "",

		//* When there are more items on the screen than will fit,
		//* you can decide if the items put in the "more" section
		//* are pulled from the top or bottom of the menu
		//* subMenuShiftOrPop: "shift" pulls from the top of the menu
		//* subMenuShiftOrPop: "pop" pulls from the bottom of the menu.
		//*
		subMenuShiftOrPop: "shift"
	},
	 /*
	//* subMenuItems block:
	//* use this to include sub menu items in the menu.
		
		{
			kind: "SlideableMenuItem",
			content: "I have a sub-menu!",
			subMenu: true,
			subMenuTitle: "Sub Menu Items",
			subMenuItems: [
				{content: "Sub menu item 1"},
				{content: "Sub menu item 2"},
				{content: "Sub menu item 3"}
			]
		}

		You can also nest sub menus in sub menus
		
		{
			kind: "SlideableMenuItem",
			content: "I have a sub-menu!",
			subMenu: true,
			subMenuTitle: "Sub Menu Items",
			subMenuItems: [
				{content: "Sub menu item 1"},
				{
					content: "I have a sub-menu too!",
					subMenu: true,
					subMenuTitle: "More Sub Menu items!",
					subMenuItems: [
						{content: "Second Sub menu item 1"},
						{content: "Second Sub menu item 2"},
						{content: "Second Sub menu item 3"}
					]
				},
				{content: "Sub menu item 3"}
			]
		}		
	*/
	subMenuItems: [],
	//* @protected
	showing: false,

	menuToolsLeft: [
		{kind: "Image", name: "itemIcon", classes: "slideable-menu-icon"},
		{name: "itemLabel", classes: "slideable-menu-content", allowHtml: true}
	],
	menuToolsRight: [
		{name: "itemLabel", classes: "slideable-menu-content", allowHtml: true},
		{kind: "Image", name: "itemIcon", classes: "slideable-menu-icon"}
	],
	menuToolsNoIcon: [
		{name: "itemLabel", classes: "slideable-menu-content no-icon", allowHtml: true}
	],
	//* @protected
	tap: function() {
		this.addClass("highlight");
		if (!this.subMenu) {
			this.bubbleUp("onSelectCell", {content: this.getContent(), selected: this});
		}
		else {
			this.bubbleUp("onSubMenuSelect", {subMenu: this.subMenuItems, subMenuTitle: this.subMenuTitle, subMenuShiftOrPop: this.subMenuShiftOrPop});
		}
		setTimeout(enyo.bind(this,function() {
			this.removeClass("highlight");
		}), 250);
	},
	//* @protected
	create: function() {
		this.inherited(arguments);
		this.iconChanged();
	},
	//* @protected
	iconChanged: function() {
		if (this.componentMode === true) {return;}
		if (this.icon.length > 0) {
			this.destroyClientControls();
			this.createComponents(this.iconAlign == "left" ? this.menuToolsLeft : this.menuToolsRight, {owner: this});
			this.render();
			this.iconMode = true;
			this.$.itemIcon.setSrc(this.icon);
			this.$.itemLabel.setContent(this.content);
		}
		else {
			this.destroyClientControls();
			this.createComponents(this.menuToolsNoIcon, {owner: this});
			this.render();
			this.iconMode = false;
			this.$.itemLabel.setContent(this.content);
		}
	},
	//* @public
	//* Call to get the content of the menu item
	getContent: function() {
		if (this.componentMode === true) {
			var a = this.getClientControls();
			for (var i = 0; i < a.length; i++) {
				if (a[i].isContent) {
					return a[i].content;
				}
			}
		}
		else {
			return this.$.itemLabel.getContent();
		}
	},
	//* @protected
	contentChanged: function() {
		if (this.$.itemLabel) {
			this.$.itemLabel.setContent(this.content);
		}
	}
});

enyo.kind({
	//*Not usually used by it self. The SlideableMenu control creates one of these for the title
	name: "SlideableMenuTitle",
	kind: "Slideable3d",
	unit: "%",
	draggable: false,
	classes: "slideable-menu slideable-menu-title"
});


/*
	SlideableMenu:

	An animating menu that slides in from on of the sides of the screen.
	You can have it "anchored" to a side of the screen, or "unanchored"
	to open at your desired coords.
	You can align it to any sides of the screen.
	Left and Right have a slide in from the sides of the screen.
	Top and Bottom kind of "float" in from the top or bottom of the screen.
	Has scrim support, floating support, autoDismiss support, and modal support.
	


*/

enyo.kind({
	name: "SlideableMenu",
	published: {
		//* Sets which side of the screen the SlideableMenu will slide out from
		//* valid values are "left", "right", "top", "bottom"
		align: "right",

		//* sets the top and left of where the popup will render.
		//* if anchor is true, 
		//* 	for align: "right" || "left" only top is used
		//*		for align: "top" || "bottom" only left is used
		//* if anchor is false, you need to provide both a top and a left to render from
		top: 0,
		left: 0,
		
		//* Diminsions of each menu item. (in px)
		cellHeight: 40,
		cellWidth: 200,

		//* offset % of each menu item.
		//* set to 0 to have all menu items line up
		//* the higher the value, the farther away each item will render
		//* (Only supports "left" and "right" align menus)
		offset: 10,

		//* Set to true to prevent controls outside the menu from receiving
		//* events while the menu is showing
		modal: true,
		
		//* By default, the menu will animate closed when the user taps outside it or
		//* presses ESC.  Set to false to prevent this behavior.
		autoDismiss: true,
		
		//* Use a scrim under the menu
		scrim: false,
		//* Forces the scrim to stay open
		//* (Mainly used internally, but may have other uses to prevent scrim flickering...)
		forceScrim: false,
		
		//* Menu's title. If blank, menu will have no header.
		//* if a title is provided, a menu header will be inserted in for you.
		menuTitle: "",

		//* By default, the menu will anchor to the sides of the window.
		//* If false, provide both a top and left value for where to open the menu.
		//* Note: "bottom" align menus render from the last item in the menu,
		//* so the last item of the menu will be the at the top you specify.
		anchor: true,

		//* Set to true to render the popup in a floating layer outside of other
		//* controls. This can be used to guarantee that the popup will be
		//* shown on top of other controls.
		floating: false,

		//* When determining if the menu will fit, use this number to make the screen
		//* height smaller then it really is.
		//* (use full if you have a toolbar you don't want to cover)
		//* Use a positive number, as SlideableMenu will subtract this number from the
		//* windows height.
		windowHeightOffset: 0,
		
		//* When there are more items on the screen than will fit,
		//* you can decide if the items put in the "more" section
		//* are pulled from the top or bottom of the menu
		//* shiftOrPop: "shift" pulls from the top of the menu
		//* shiftOrPop: "pop" pulls from the bottom of the menu.
		shiftOrPop: "shift"
	},
	events: {
		//* Fired when menu finishes closing
		onFinishClose: "",

		//* Fired when menu finishes opening
		onFinishOpen: ""
	},
	classes: "slideable-menu-overflow",
	//* @protected
	showing: false,
	handlers: {
		ondown: "down",
		onkeydown: "keydown",
		ondragstart: "dragstart",
		onSelectCell: "storeCell",
		onSubMenuSelect: "openSubMenu"
	},
	//* @protected
	defaultKind: "SlideableMenuItem",
	scrimTools: [
		{kind: "onyx.Scrim", classes: "onyx-scrim-translucent slideable-menu-scrim", isChrome: true, name: "scrim", ontap: "scrimTap"}
	],
	titleTools: [
		{kind: "SlideableMenuTitle", name: "menuTitle"}
	],

	//* @public
	//* These items are created when there are sub menus or there are more
	//* items than can fit on the screen.
	//* back:
	/** 
		This is used when there is a sub-menu.
		content: String value for the content of the menu.
		item: Just needs to be an object ( {} ) 
		icon: string path to the icon image.
		iconAlign: valid values "left" and "right" to align the icon to the left or right of the content.
	*/
	back: {
		content: "Back",
		item: {content: "Back"},
		icon: "",
		iconAlign: "left"
	},

	/** 
		This is used when there is more items then can fit on the screen.
		content: String value for the content of the menu.
		item: Just needs to be an object ( {} ) 
		icon: string path to the icon image.
		iconAlign: valid values "left" and "right" to align the icon to the left or right of the content.
	*/
	more: {
		content: "More...",
		item: {content: "More..."},
		icon: "",
		iconAlign: "left"
	},

	/** 
		This is used when there is more items then can fit on the screen, and the user pressed the "more" item to 
		see more items.
		content: String value for the content of the menu.
		item: Just needs to be an object ( {} ) 
		icon: string path to the icon image.
		iconAlign: valid values "left" and "right" to align the icon to the left or right of the content.
	*/
	previous: {
		content: "Previous...",
		item: {content: "Previous..."},
		icon: "",
		iconAlign: "left"
	},
	components: [
		
	],
	//* @protected
	menuStackIndex: 0,
	internalSubMenu: false,
	internalMoreItems: false,
	moreItemStackIndex: 0,
	//* @protected
	create: function() {
		this.runtimeComponents = [];
		this.menuStack = [];
		this.nextSubMenuItems = [];
		this.moreItemStack = [];
		this.inherited(arguments);
		this.canGenerate = !this.floating;
		this.scrimChanged();
		this._title = this.menuTitle;
		this.styleItems();

	},
	//* @protected
	render: function() {
		if (this.floating) {
			if (!enyo.floatingLayer.hasNode()) {
				enyo.floatingLayer.render();
			}
			this.parentNode = enyo.floatingLayer.hasNode();
		}
		this.inherited(arguments);

	},
	//* @protected
	openSubMenu: function(iS, iE) {
		var i = 0;
		if (this.moreItemStack.length > 0) {
			this.runtimeComponents = [];
			if (this.shiftOrPop == "shift") {
				for (i = this.moreItemStack.length - 1; i >= 0; i--) {
					this.runtimeComponents = this.runtimeComponents.concat(this.moreItemStack[i]);
				}
			}
			else {
				for (i = 0; i < this.moreItemStack.length; i++) {
					this.runtimeComponents = this.runtimeComponents.concat(this.moreItemStack[i]);
				}
			}
			var b = false;
			var c = "";
			do {
				b = false;
				for (var j = 0; j < this.runtimeComponents.length; j++) {
					c = this.runtimeComponents[j].content;
					if (c == this.moreMenuContent || c == this.previousMenuContent) {
						this.runtimeComponents.splice(j,1);
						b = true;
						break;
					}
					
				}
			}
			while (b === true);
			this.moreItemStack = [];
			this.moreItemStackIndex = 0;
			this.internalMoreItems = false;
		}
		this.menuStackIndex = this.menuStack.push({title: this._title || this.menuTitle, items: enyo.cloneArray(this.runtimeComponents), shiftOrPop: this.shiftOrPop}) - 1;
		this.internalSubMenu = true;
		this.nextSubMenuItems = iE.subMenu;
		this._title = iE.subMenuTitle;
		this.shiftOrPop = iE.subMenuShiftOrPop;
		if (!this.doesItemExist({content: this.back.content}, this.nextSubMenuItems)) {
			var bmi = enyo.clone(this.back.item);
			bmi.content = this.back.content;
			bmi.icon = this.back.icon;
			bmi.iconAlign = this.back.iconAlign;
			this.nextSubMenuItems.unshift(bmi);
		}
		this.animateClose();
	},
	//* @protected
	doesItemExist: function(item, arr) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].content == item.content) {
				return true;
			}
		}
		return false;
	},
	//* @protected
	_zIndex: 120,
	applyZIndex: function() {
		// Adjust the zIndex so that popups will properly stack on each other.
		if (onyx.Popup.highestZ && onyx.Popup.highestZ >= this._zIndex) {
			this._zIndex = onyx.Popup.highestZ + 4;
			onyx.Popup.highestZ = this._zIndex;
		}
		var c$ = this.getClientControls();
		for (var i = 0; i < c$.length; i++) {
			c$[i].applyStyle("z-index", this._zIndex);
		}
		if (this.scrim) {
			this.$.scrim.applyStyle("z-index", this._zIndex-1);
		}
		
	},
	//* @protected
	createScrim: function() {
		if (this.scrim) {
			if (!this.$.scrim) {
				this.createComponents(this.scrimTools, {owner: this});
				this.render();
			}
		}
	},
	//* @protected
	scrimChanged: function() {
		this.createScrim();
	},
	//* @protected
	getCellHeight: function() {
		return this.cellHeight + this.topPadding + this.bottomPadding;
	},
	//* @public
	//* if you change the padding of the menu items, you may
	//* need to adjust these values for the menu to render
	//* correctly
	topPadding: 1,
	bottomPadding: 1,

	//* @protected
	getMenuTop: function(arr, offset) {
		return enyo.dom.getWindowHeight() - this.getMenuLength(arr, offset);
	},
	//* @protected
	getMenuLength: function(arr, offset) {
		return (arr.length * this.getCellHeight()) + offset;
	},
	//* @protected
	makeMenuFit: function(c$) {
		this._top = this.top;
		var addedCells = (this.getCellHeight() * (this._title.length > 0 ? 2 : 1));
		var offset = this.align == "top" || this.align == "bottom" ? this.getCellHeight() : 0;
		var t = this.getMenuTop(c$, this.windowHeightOffset + addedCells);
		
		if (t < 0 && !this.internalMoreItems) {
			var arr = this.runtimeComponents;

			//More items than can fit on screen...
			var tmp = [];

			do {
				if (arr[0].content == this.previous.content && this.shiftOrPop == "shift") {
					tmp.push(arr[1]);
					arr.splice(1,1);
				}
				else if (arr[arr.length-1].content == this.previous.content && this.shiftOrPop == "pop") {
					tmp.unshift(arr[arr.length-2]);
					arr.splice(arr.length-2,1);
				}
				else {
					if (this.shiftOrPop == "shift") {
						tmp.push(arr.shift());
					}
					else {
						tmp.unshift(arr.pop());
					}
					
				}

				t = this.getMenuTop(arr, this.windowHeightOffset + addedCells);
				//this.log(t)
				
			}
			while (t < 0);
			var m = enyo.clone(this.more.item);
			m.content = this.more.content;
			m.icon = this.more.icon;
			m.iconAlign = this.more.iconAlign;
			this.internalMoreItems = true;
			if (!this.doesItemExist(m, arr)) {
				arr.unshift(m);
			}
			if (this.align == "bottom") {
				if (this._top - this.getMenuLength(arr, this.windowHeightOffset)  < 0 ) {
					do {
						this._top = this._top + Math.floor(this.getCellHeight() / 2);
					}
					while (this._top - this.getMenuLength(arr, this.windowHeightOffset)  < 0);
					this.styleItems();
				}
			}
			else {
				
				if (this._top + this.getMenuLength(arr, this.windowHeightOffset + offset) >  enyo.dom.getWindowHeight()) {
					do {
						this._top = this._top - Math.floor(this.getCellHeight() / 2);
					}
					while (this._top + this.getMenuLength(arr, this.windowHeightOffset + offset) >  enyo.dom.getWindowHeight());
					this.styleItems();
				}
			}
			this.moreItemStack.pop();
			this.moreItemStackIndex = this.moreItemStack.push(arr) - 1;
			this.moreItemStack.push(tmp);
			this.destroyClientControls();
			this.createComponents(this.moreItemStack[this.moreItemStackIndex]);
			this.render();
			this.animateOpen();
			return false;
		}
		else {
			if (this.align == "bottom") {
				if (this._top - this.getMenuLength(c$, this.windowHeightOffset)  < 0 ) {
					do {
						this._top = this._top + Math.floor(this.getCellHeight() / 2);
					}
					while (this._top - this.getMenuLength(c$, this.windowHeightOffset)  < 0);
				}
			}
			else {
				if (this._top + this.getMenuLength(c$, this.windowHeightOffset + offset) >  enyo.dom.getWindowHeight()) {
					do {
						this._top = this._top - Math.floor(this.getCellHeight() / 2);
					}
					while (this._top + this.getMenuLength(c$, this.windowHeightOffset + offset) >  enyo.dom.getWindowHeight());
				}
			}
			this.internalMoreItems = false;
			return true;
		}

	},
	removeUneededClasses: function() {
		var a = {left:0, right:0, top:0, bottom:0};
		var c$ = this.getClientControls();
		var align = this.align.toLowerCase();
		if (c$.length > 0) {
			for (var i = 0; i < c$.length; i++) {
				for (var j in a) {
					if (j != align) {
						c$[i].removeClass(j);
					}
				}
			}
		}
	},
	//* @protected
	styleItems: function() {
		var c$ = this.getClientControls();
		var x = 0;
		if (!this._title) {this._title = this.menuTitle;}
		if (c$.length > 0) {
			if (this._title.length > 0) {
				if (!this.$.menuTitle) {
					this.createComponents(this.titleTools, {owner: this, addBefore: null});
					this.render();
					return;
				}
				this.$.menuTitle.setContent(this._title);
			}
			if (!this.internalMoreItems) {
				if (this.makeMenuFit(c$) === false) {return;}
			}
			for (var i = 0; i < c$.length; i++) {
				this.removeUneededClasses();
				if (!c$[i].hasClass(this.align)) {
					c$[i].addClass(this.align);
				}
				c$[i].applyStyle("height", this.cellHeight + "px");
				c$[i].applyStyle("width", this.cellWidth + "px");
				c$[i].applyStyle("z-index", 5);
				switch (this.align) {
					case "left":
						c$[i].setAxis("h");
						c$[i].setMax((0 - (i + (i > 0 || this._title.length < 1 ? this.offset : 0))));
						c$[i].applyStyle("top", this._top + ((this.getCellHeight()) * i)  + "px");
						if (!this.anchor) {
							c$[i].applyStyle("left", this.left + "px");
							x =  Math.floor((this.left / enyo.dom.getWindowWidth()) * 100);
							x = (300 + x) * -1;
							c$[i].setMin(x);
							c$[i].setValue(x);
							c$[i].addClass("full-radius");
						}
						else {
							c$[i].setMin(-100);
							c$[i].setValue(-100);
						}
						break;
					case "right":
						c$[i].setAxis("h");
						c$[i].setMin(i +  (i > 0 || this._title.length < 1 ? this.offset : 0));
						c$[i].applyStyle("top", this._top + ((this.getCellHeight()) * i)  + "px");
						if (!this.anchor) {
							c$[i].applyStyle("left", this.left + "px");
							x =  Math.floor((this.left / enyo.dom.getWindowWidth()) * 100);
							x = (300 + x);
							c$[i].setMax(x);
							c$[i].setValue(x);
							c$[i].addClass("full-radius");
						}
						else {
							c$[i].setMax(100);
							c$[i].setValue(100);
						}
						break;
					case "top":
						c$[i].setAxis("v");
						c$[i].setMax(i * 90);
						c$[i].applyStyle("left", this.left + "px");
						if (!this.anchor) {
							c$[i].applyStyle("top", this._top + "px");
							x =  Math.floor((this._top / enyo.dom.getWindowHeight()) * 100);
							x = (400 + x) * -2;
							c$[i].setMin(x);
							c$[i].setValue(x);
						}
						else {
							c$[i].setMin(-100);
							c$[i].setValue(-100);
						}
						break;
					case "bottom":
						c$[i].setAxis("v");
						c$[i].setMin(((c$.length-1) - i) * -90);
						
						c$[i].applyStyle("left", this.left + "px");
						if (!this.anchor) {
							c$[i].applyStyle("top", this._top + "px");
							x =  Math.floor((this._top / enyo.dom.getWindowHeight()) * 100);
							x = (300 + x) * 2;
							c$[i].setMax(x);
							c$[i].setValue(x);
						}
						else {
							c$[i].setMax(100);
							c$[i].setValue(100);
						}
						break;
				}
				c$[i].show();
			}
		}
		
	},
	//* @protected
	createComponent: function(inInfo, inMoreInfo) {
		this.runtimeComponents.push(inInfo);
		return this._createComponent(inInfo, inMoreInfo);
	},
	createComponents: function(inInfos, inCommonInfo) {
		if (inInfos) {
			var cs = [];
			for (var i=0, ci; (ci=inInfos[i]); i++) {
				if (!inInfos[i].name || (inInfos[i].name && inInfos[i].name != "menuTitle" && inInfos[i].name != "scrim")) {
					this.runtimeComponents.push(enyo.clone(inInfos[i]));
				}
				cs.push(this._createComponent(ci, inCommonInfo));
			}
			this.styleItems();
			return cs;
		}
	},
	destroyClientControls: function() {
		this.inherited(arguments);
		this.runtimeComponents = [];
	},
	//* @public
	//* sets the menu title
	setMenuTitle: function(t) {
		this.menuTitle = t;
		this._title = this.menuTitle;
	},
	//* @protected
	animateCellOpen: function(c$) {
		switch (this.align) {
			case "left": case "top":
				c$.animateToMax();
				break;
			case "right": case "bottom":
				c$.animateToMin();
				break;
		}
		
	},
	//* @protected
	animateCellClose: function(c$) {
		switch (this.align) {
			case "left": case "top":
				c$.animateToMin();
				break;
			case "right": case "bottom":
				c$.animateToMax();
				break;
		}
	},

	//* @public
	//* Call to set the top value for the menu.
	//* include a second parameter of true to have
	//* the menu restyle all the items to the new top.
	//*
	//* this.$.slideableMenu.setTop(100, true) Will restyle the items
	//* this.$.slideableMenu.setTop(100) will change the value, but won't move the items
	setTop: function(inVal, update) {
		this.top = inVal;
		if (update) {
			this.styleItems();
		}
	},

	//* @public
	//* Call to set the left value for the menu.
	//* include a second parameter of true to have
	//* the menu restyle all the items to the new left.
	//*
	//* this.$.slideableMenu.setLeft(100, true) Will restyle the items
	//* this.$.slideableMenu.setLeft(100) will change the value, but won't move the items
	setLeft: function(inVal, update) {
		this.left = inVal;
		if (update) {
			this.styleItems();
		}	
	},

	//* @public
	//* Sets which side of the screen the SlideableMenu will slide out from
	//* valid values are "left", "right", "top", "bottom"
	//*
	//* include a second parameter of true to have
	//* the menu restyle all the items to the new position.
	//* this.$.slideableMenu.setLeft(100, true) Will restyle the items and move them.
	//* this.$.slideableMenu.setLeft(100) will change the position, but won't move the items
	setAlign: function(inVal, update) {
		this.align = inVal;
		if (update) {
			this.styleItems();
		}
	},
	//* @public
	//* call to open the menu.
	//* include an object with left, top, or both of them to specify
	//* where to open the menu from.
	//*
	//* If your menu is anchored to the "left" or "right", you only
	//* need to specify a "top"
	//* this.$.slideableMenu.open({top: 100});
	//*
	//* If your menu is anchored to the "top" or "bottom" you only
	//* need to specify a "left"
	//* this.$.slideableMenu.open({left: 100});
	//*
	//* If your menu is not anchored, you should supply both a "left" and "top" value
	//* this.$.slideableMenu.open({left: 100, top: 50});
	open: function(coords) {
		if (coords) {
			if (coords.top) {
				this.top = coords.top;
			}
			if (coords.left) {
				this.left = coords.left;
			}
			this.styleItems();
		}
		this.animateOpen();
	},
	//* @protected
	animateOpen: function() {
		this.show();
		onyx.Popup.count++;
		this.applyZIndex();
		if (this.scrim) {this.$.scrim.show();}
		this.cCycle = (this.align == "bottom" ? this.getClientControls().length - 1 : 0);
		this.cycleOpen();
	},
	//* @protected
	cycleOpen: function() {
		if (this.align != "bottom" && this.cCycle <= this.getClientControls().length -1) {
			this.animateCellOpen(this.getClientControls()[this.cCycle]);
			this.cCycle++;
		}
		else if (this.align == "bottom" && this.cCycle >= 0) {
			this.animateCellOpen(this.getClientControls()[this.cCycle]);
			this.cCycle--;
		}
		else {
			this.capture();
			setTimeout(enyo.bind(this,function() {
				this.doFinishOpen();

			}), 250);
			return;
		}
		setTimeout(enyo.bind(this,function() {
			this.cycleOpen();
		}), 50);
	},
	//* @public
	//* call to close the menu programatically
	//* The menu will auto close when an item is selected
	close: function() {
		this.animateClose();
	},
	//* @protected
	animateClose: function() {
		if(onyx.Popup.count > 0) {
			onyx.Popup.count--;
		}
		this.cCycle = (this.align != "bottom" ? this.getClientControls().length - 1 : 0);
		this.cycleClose();
	},
	//* @protected
	cycleClose: function() {
		if (this.align != "bottom" && this.cCycle >= 0) {
			this.animateCellClose(this.getClientControls()[this.cCycle]);
			this.cCycle--;
		}
		else if (this.align == "bottom" && this.cCycle <= this.getClientControls().length -1) {
			this.animateCellClose(this.getClientControls()[this.cCycle]);
			this.cCycle++;
		}
		else {
			
			this.release();
			setTimeout(enyo.bind(this,function() {
				if (this.internalSubMenu) {
					this.destroyClientControls();
					this.createComponents(this.nextSubMenuItems);
					this.render();
					this.animateOpen();
					this.internalSubMenu = false;
				}
				else {
					if (this.lastSelected && (this.lastSelected.content == this.back.content)) {

						this.destroyClientControls();
						this.internalSubMenu = false;
						this.internalMoreItems = false;
						this.moreItemStack = [];
						this.moreItemStackIndex = 0;
						this.shiftOrPop = this.menuStack[this.menuStackIndex].shiftOrPop;
						this._title = this.menuStack[this.menuStackIndex].title;
						this.createComponents(this.menuStack[this.menuStackIndex].items);
						this.render();
						this.menuStack.pop();
						this.menuStackIndex = this.menuStack.length - 1;
						this.animateOpen();
					}
					else if (this.lastSelected && (this.lastSelected.content == this.more.content)) {
						this.destroyClientControls();
						this.moreItemStackIndex++;
						if (this.moreItemStackIndex >= this.moreItemStack.length) {this.moreItemStackIndex = this.moreItemStack.length - 1;}
						var a = this.moreItemStack[this.moreItemStackIndex];
						var p = enyo.clone(this.previous.item);
						p.content = this.previous.content;
						p.icon = this.previous.icon;
						p.iconAlign = this.previous.iconAlign;
						if (!this.doesItemExist(p, a)) {
							a.unshift(p);
						}
						this.createComponents(a);
						this.render();
						this.animateOpen();
					}
					else if (this.lastSelected && (this.lastSelected.content == this.previous.content)) {
						this.destroyClientControls();
						this.moreItemStackIndex--;
						if (this.moreItemStackIndex <= 0) {this.moreItemStackIndex = 0;}
						var ap = this.moreItemStack[this.moreItemStackIndex];
						this.createComponents(ap);
						this.render();
						this.animateOpen();
					}
					else {
						if (this.scrim && !this.forceScrim) {this.$.scrim.hide();}
						this.hide();
						this.clearAllStores();

						if (this.lastSelected) {
							this.bubble("onSelect", this.lastSelected);
						}
						this.doFinishClose(this.lastSelected ? this.lastSelected : {});

					}
				}
				this.lastSelected = null;
			}), 250);
			return;
		}
		setTimeout(enyo.bind(this,function() {
			this.cycleClose();
		}), 50);
	},
	//* @protected
	clearAllStores: function() {
		if (this.menuStack[0]){
			this.shiftOrPop = this.menuStack[0].shiftOrPop;
		}
		this.menuStack = [];
		this.menuStackIndex = 0;

		this.moreItemStack = [];
		this.moreItemStackIndex = 0;
		this.internalSubMenu = false;
		this.internalMoreItems = false;
	},
	//* @protected
	storeCell: function(iS, iE) {
		this.lastSelected = iE;
		this.animateClose();
		return true;
	},
	//* @protected
	captured: false,
	//* @protected
	capture: function() {
		if (this.captured === false) {
			enyo.dispatcher.capture(this, !this.modal);
			this.captured = true;
		}
	},
	//* @protected
	release: function() {
		enyo.dispatcher.release(this);
		this.captured = false;
	},
	//* @protected
	down: function(inSender, inEvent) {
		//record the down event to verify in tap
		this.downEvent = inEvent;

		// prevent focus from shifting outside the popup when modal.
		if (this.modal && !inEvent.dispatchTarget.isDescendantOf(this)) {
			inEvent.preventDefault();
		}
	},
	//* @protected
	tap: function(inSender, inEvent) {
		// dismiss on tap if property is set and click started & ended outside the popup
		if (this.autoDismiss && (!inEvent.dispatchTarget.isDescendantOf(this)) && this.downEvent &&
			(!this.downEvent.dispatchTarget.isDescendantOf(this))) {
			this.downEvent = null;
			this.forceScrim = false;
			this.animateClose();
			return true;
		}
	},
	//* @protected
	// if a drag event occurs outside a popup, hide
	dragstart: function(inSender, inEvent) {
		var inScope = (inEvent.dispatchTarget === this || inEvent.dispatchTarget.isDescendantOf(this));
		if (inSender.autoDismiss && !inScope) {
			this.forceScrim = false;
			inSender.animateClose();
		}
		return true;
	},
	//* @protected
	keydown: function(inSender, inEvent) {
		if (this.autoDismiss && inEvent.keyCode == 27 /* escape */) {
			this.forceScrim = false;
			this.animateClose();
		}
	},
	//* @protected
	scrimTap: function() {
		if (this.autoDismiss) {
			this.forceScrim = false;
			this.animateClose();
		}
	}
});

