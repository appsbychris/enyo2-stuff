enyo2-stuff
===========

Titled drawer:

A drawer with a title and an arrow image. Can set animation on and off, can set to auto toggle open/close on clicks

Expanable Menu:

A menu item that has a label, and then clicks to expand a sub menu.
Currently setup to use specific CSS stylings for items.

Example:
<pre><code>
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
	  var objSet = function() {
  		return {kind: "ExpandableMenuItem",
			content: "Top Level",
			classes: "normal-item",
			components: [
				{ content: "subMenUItem", classes: "dark-item onyx-menu-item"},
				{ content: "subMenuItem", classes: "dark-item onyx-menu-item"},
				kind: "ExpandableMenuItem",
				content: "Mid Level",
				classes: "dark-item",
				components: [		
					{ content: "2nd Level subMenUItem", classes: "very-dark-item onyx-menu-item"},
					{ content: "2nd Level subMenuItem", classes: "very-dark-item onyx-menu-item"},
				]
			}
		};
		for (var i = 0, i < 10, i++) {
			var y = new objSet();
			y.content += i;
			y.components[0].content += i;
			y.components[1].content += i; 
			y.components[2].content += i;
			y.components[2].components[0].content += i;
			y.components[2].components[1].content += i;
		        listItems.push(y);
		    }
		
		var x = (listItems.length * 46);
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
		this.doSelected({content: iR.content})
	},


});</code></pre>
