enyo2-stuff
===========

Titled drawer:

A drawer with a title and an arrow image. Can set animation on and off, can set to auto toggle open/close on clicks

Expanable Menu:

A menu item that has a label, and then clicks to expand a sub menu.
Currently setup to use specific CSS stylings for items.

Example:

enyo.kind({
  kind: "onyx.MenuDecorator", 
	name: "BlogNamesMenu",
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
	openAt: function(dims) {
		var s = "";
		for (j in dims) {
			s = s + j + ":" + dims[j] + "px;"
		}
		this.openLocation = s
		this.loadMenuItems();
		this.$.mainMenu.requestMenuShow();
	},
	loadMenuItems: function() {
  var listItems = []
	  var objSet = {
  		kind: "ExpandableMenuItem",
			content: "Top Level",
			classes: "normal-item",
			components: [
				{ content: "subMenUItem", classes: "dark-item onyx-menu-item"},
				{ content: "subMenuItem", classes: "dark-item onyx-menu-item"}
			]
		};
		for (var i = 0, i < 10, i++) {
      listItems.push(objSet);
    }
		
		var x = (listItems.length * 46);
		if (x > window.innerHeight - 100) {
			x = window.innerHeight - 100;
		}

		this.$.mainMenu.setStyle("width: 300px;max-height: " + x + "px;left:auto;" + this.openLocation);
		this.$.mainMenuItems.destroyClientControls();
		this.$.mainMenuItems.createComponents(listItems, {owner: this.$.mainMenu});
		this.$.mainMenuItems.setStyle("height: " + x + "px;");
		this.$.mainMenuItems.render();

	},
	checkMenuItem: function(iS,iR) {
		this.doSelected({content: iR.content})
	},


});
