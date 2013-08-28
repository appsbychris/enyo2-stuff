enyo.kind({
	name: "SnapScrollerCell",
	kind: "Control",
	classes: "scroller-slide",

	/*
	 * In a snap scroller cell, instead of using the components block, use the
	   cellComponents block. This will ensure your components are only loaded 
	   when needed, and also the owner will become this, and not the HSnapScroller.
	   When using images, you should use the DelayedImage component, as it is
	   hooked up to the events provided by this SnapScrollerCell.
	*/
	cellComponents: [],

	//* @protected
	componentsCreated: false,
	//* @protected
	//* Use the cellComponents:[] block for your components instead.
	components: [
		{name: "client", isChrome: true}
	],
	//* @protected
	create: function() {
		this.inherited(arguments);
	},
	//* @protected
	getClientBounds: function() {
		return this.getBounds();
	},
	//@ public
	/*
	 * Called when controls should be created. You can override or extend this if
	   You want to do extra processing.
	*/
	flowControls: function(loadImages) {
		this.destroyClientControls();
		this.createComponents(this.cellComponents, {owner: this});
		this.render();
		this.componentsCreated = true;
		if (loadImages) {
			this.flowImages();
		}
	},

	//@ public
	/*
	 *Called when components should be removed from memory
	*/
	stripControls: function() {
		this.destroyClientControls();
		this.componentsCreated = false;
	},

	//@ public
	/*
	 *Called when images should be removed from memory. DelayedImage kind will automactically
      destroy its image when this is called. You can override or extend to do extra processing.
	*/
	stripImages: function() {
		this.waterfall("onStripImages");
	},

	//@ public
	/*
	 *Called when images should be rendered. It could be usefull to override or extend this method
	  So images are loaded at a slower pace.
	*/
	flowImages: function() {
		this.waterfall("onFlowImages");
	}
});
