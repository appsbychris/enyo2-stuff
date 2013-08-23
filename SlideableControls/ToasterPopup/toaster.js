 /* ToasterPopup
//* A popup that slides in from a side of the screen.
//* You can have it anchored to a side, or un-anchored
//* to have it float to a position.
//* modal, autoDismiss, floating, and centered that
//* behave just like enyo.Popup.
//* Also has support for centeredX and centeredY to 
//* align just 1 axis.
//* To show the popup, simple call show() on it, and to hide
//* simple call hide();
//* 
//* this.$.toasterPopup.show();
//* this.$.toasterPopup.hide();
//* 
//* To position the popup, you can either set the "top" and "left"
//* properties when declaring the ToasterPopup, or you can call
//* the setPosition() method, or just the setTop() and setLeft() methods.
//*
//* Note Toaster popup is based off Slideable3d, but will work
//* with just the normal Slideable if you wish.
*/

enyo.kind({
	name: "ToasterPopup",
	kind: "Slideable3d",
	classes: "toaster",
	published: {
		//* Sets which side of the screen the ToasterPopup will slide out from
		//* valid values are "left", "right", "top", "bottom"
		align: "left",

		//* sets the top and left of where the popup will render.
		//* if anchor is true, 
		//* 	for align: "right" || "left" only top is used
		//*		for align: "top" || "bottom" only left is used
		//* if anchor is false, you need to provide both a top and a left to render from
		top: 0,
		left: 0,

		//* Set to true to prevent controls outside the menu from receiving
		//* events while the menu is showing
		modal: true,

		//* By default, the menu will animate closed when the user taps outside it or
		//* presses ESC.  Set to false to prevent this behavior.
		autoDismiss: true,

		//* Use a scrim under the popup
		scrim: false,

		//* By default, the menu will anchor to the sides of the window.
		//* If false, provide both a top and left value for where to open the menu.
		anchor: true,

		//* Set to true to render the popup in a floating layer outside of other
		//* controls. This can be used to guarantee that the popup will be
		//* shown on top of other controls.
		floating: false,

		//* Set to true to center the popup on the screen.
		//* If your popup is anchored, you should use the
		//* centeredX and centeredY propertys
		centered: false,

		//* Centers the popup along the Y axis.
		centeredY: false,

		//* Centers the popup along the X axis.
		centeredX: false,

		//* Number of MS to use for the animator
		duration: 500
	},
	//* @protected
	unit: "%",
	//* @protected
	draggable: false,
	//* @public
	events: {
		//* Fires after the popup is shown.
		onShow: "",
		//* Fires after the popup is hidden.
		onHide: ""
	},
	showing: false,
	//* @protected
	handlers: {
		ondown: "down",
		onkeydown: "keydown",
		ondragstart: "dragstart",
		onAnimateFinish: "checkForHide"
	},
	scrimTools: [
		{kind: "onyx.Scrim", classes: "onyx-scrim-translucent", isChrome: true, name: "scrim", style: "-webkit-transform: translate3d(0,0,0);", ontap: "scrimTap"}
	],
	components: [
		
	],
	defaultZ: 120,
	//* @protected
	create: function() {
		this.inherited(arguments);
		this.canGenerate = !this.floating;
		this.scrimChanged();
		this.applyAlign(true);
		this.$.animator.setDuration(this.duration);
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
		this.centeredChanged();
	},
	//* @public
	//* Provide an object with either or both "top" and "left" properties.
	//* this.$.toasterPopup.setPosition({top:100,left:50});
	setPosition: function(position) {
		if (position) {
			if (position.left) {
				this.setLeft(position.left);
			}
			if (position.top) {
				this.setTop(position.top);
			}
		}
	},
	//* @protected
	calcViewportSize: function() {
		return {
			width: enyo.dom.getWindowWidth(),
			height: enyo.dom.getWindowHeight()
		};
	},
	//* @protected
	centeredChanged: function() {
		this.updatePosition(false);
	},
	//* @protected
	centeredXChanged: function() {
		this.updatePosition(false);
	},
	//* @protected
	centeredYChanged: function() {
		this.updatePosition(false);
	},
	//* @protected
	resizeHandler: function() {
		this.inherited(arguments);
		this.updatePosition(false);
	},
	//* @protected
	updatePosition: function(changeValue) {
		if (this.centered || this.centeredY || this.centeredX) {
			var d = this.calcViewportSize();
			var b = this.getBounds();
			if (b.top === undefined || b.width === 0) {return;}
			if (this.centeredX) {
				this.left= Math.max( ( ( d.width - b.width ) / 2 ), 0 );
			}
			else if (this.centeredY) {
				this.top = Math.max( ( ( d.height - b.height ) / 2 ), 0 );
			}
			else if (this.centered) {
				this.top = Math.max( ( ( d.height - b.height ) / 2 ), 0 );
				this.left= Math.max( ( ( d.width - b.width ) / 2 ), 0 );
			}
		}
		this.applyAlign(changeValue);
	},
	//* @protected
	_zIndex: 120,
	//* @protected
	applyZIndex: function() {
		// Adjust the zIndex so that popups will properly stack on each other.
		if (onyx.Popup.highestZ && onyx.Popup.highestZ >= this._zIndex) {
			this._zIndex = onyx.Popup.highestZ + 4;
			onyx.Popup.highestZ = this._zIndex;
		}
		this.applyStyle("z-index", this._zIndex);
		if (this.scrim) {
			this.$.scrim.setZIndex(this._zIndex-1);
		}
		
	},
	//* @protected
	createScrim: function() {
		if (this.scrim) {
			if (!this.$.scrim) {
				this.createComponents(this.scrimTools, {owner: this, floating: this.floating});
				if (!this.floating) {
					this.$.scrim.setContainer(this.parent);
				}
				this.$.scrim.render();
				if (this.isOpen) {this.$.scrim.show();}
			}
		}
	},
	//* @protected
	scrimChanged: function() {
		if (this.scrim) {
			this.createScrim();
		}
		else {
			if (this.$.scrim) {
				this.$.scrim.destroy();
			}
		}
	},
	//* @protected
	alignChanged: function(inOld) {
		if (this.canTransform) {
			if (this.use3d) {
				enyo.dom.transformValue(this, "translate3d", null);
			}
			else {
				enyo.dom.transformValue(this, "translateX", null);
				enyo.dom.transformValue(this, "translateY", null);
			}
		} else {
			this.setInlineStyles(null, false);
		}
		this.removeClass(inOld);
		this.applyAlign(false);
	},
	//* @protected
	applyAlign: function(changeValue) {
		var b = this.getBounds();
		if (!b || b.height === 0 || b.height === undefined) {return;}
		if (!this.hasClass(this.align)) {this.addClass(this.align);}
		this.applyStyle("top", null);
		this.applyStyle("left", null);
		var viewport = this.calcViewportSize();
		var w = viewport.width;
		var h = viewport.height;
		switch (this.align) {
			case "left":
				this.setAxis("h");
				this.setMax(0);
				this.applyStyle("top", this.top + "px");
				if (!this.anchor) {
					this.applyStyle("left", this.left + "px");
					x =  Math.floor((w / b.width) * 100);
					x = x * -1;
					this.setMin(x);
					if (changeValue) {this.setValue(x);}
					this.addClass("full-radius");
				}
				else {
					this.setMin(-100);
					if (changeValue) {this.setValue(-100);}
				}
				break;
			case "right":
				this.setAxis("h");
				this.setMin(0);
				this.applyStyle("top", this.top + "px");
				if (!this.anchor) {
					this.applyStyle("left", this.left + "px");
					x =  Math.floor((w / b.width) * 100);
					this.setMax(x);
					if (changeValue) {this.setValue(x);}
					this.addClass("full-radius");
				}
				else {
					this.setMax(100);
					if (changeValue) {this.setValue(100);}
				}
				break;
			case "top":
				this.setAxis("v");
				this.setMax(0);
				this.applyStyle("left", this.left + "px");
				if (!this.anchor) {
					this.applyStyle("top", this.top + "px");
					x =  Math.floor((h / b.height) * 100);
					x = x * -1;
					this.setMin(x);
					if (changeValue) {this.setValue(x);}
				}
				else {
					this.setMin(-100);
					if (changeValue) {this.setValue(-100);}
				}
				break;
			case "bottom":
				this.setAxis("v");
				this.setMin(0);
				
				this.applyStyle("left", this.left + "px");
				if (!this.anchor) {
					this.applyStyle("top", this.top + "px");
					x =  Math.floor((h / b.height) * 100);
					this.setMax(x);
					if (changeValue) {this.setValue(x);}
				}
				else {
					this.setMax(100);
					if (changeValue) {this.setValue(100);}
				}
				break;
		}
	},
	//* @protected
	animateCellOpen: function() {
		switch (this.align) {
			case "left": case "top":
				this.animateToMax();
				break;
			case "right": case "bottom":
				this.animateToMin();
				break;
		}
		
	},
	//* @protected
	animateCellClose: function() {
		switch (this.align) {
			case "left": case "top":
				this.animateToMin();
				break;
			case "right": case "bottom":
				this.animateToMax();
				break;
		}
	},
	//* @public
	//* If needed, you can check if the popup is open with this flag
	//* if (this.$.toasterPopup.isOpen === true) {//Do something}
	isOpen: false,
	//* @protected
	showingChanged: function() {
		// auto render when shown.

		if (this.floating && this.showing && !this.hasNode()) {
			this.render();
		}
		if (this.showing) {
			this.applyStyle("visibility", "hidden");
			this.updatePosition(true);
		}
		
		if (this.showing) {
			this.inherited(arguments);
			
			this.resized();
			this.setValue(this.align == "left" || this.align == "top" ? this.min : this.max);
			this.applyStyle("visibility", null);
			this.animateOpen();
			this.doShow();
			this.isOpen = true;
		} else {

			this.hideScrim();
			if (this.isOpen === true) {
				this.animateClose();
			}
			else {
				this.inherited(arguments);
				this.isOpen = false;
			}
		}
	},
	//* @protected
	animateOpen: function() {
		this.show();
		ToasterPopup.count++;
		this.applyZIndex();
		if (this.scrim) {this.$.scrim.show();}
		this.animateCellOpen();
		this.capture();
	},
	//* @protected
	animateClose: function() {
		if(ToasterPopup.count > 0) {
			ToasterPopup.count--;
		}
		this.calledClose = true;
		this.animateCellClose();
	},
	//* @protected
	calledClose: false,
	//* @protected
	checkForHide: function() {
		if (!this.calledClose) {return;}
		switch (this.align) {
			case "left": case "top":
				if (this.value == this.min) {
					this.release();
					this.showing = false;
					this.syncDisplayToShowing();
					this.isOpen = false;
					this.doHide();
				}
				break;
			case "right": case "bottom":
				if (this.value == this.max) {
					this.release();
					this.showing = false;
					this.syncDisplayToShowing();
					this.isOpen = false;
					this.doHide();
				}
				break;
		}
		this.calledClose = false;
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
			this.hideScrim();
			this.animateClose();
			return true;
		}
	},
	//* @protected
	// if a drag event occurs outside a popup, hide
	dragstart: function(inSender, inEvent) {
		var inScope = (inEvent.dispatchTarget === this || inEvent.dispatchTarget.isDescendantOf(this));
		if (inSender.autoDismiss && !inScope) {
			this.hideScrim();
			inSender.animateClose();
		}
		return true;
	},
	//* @protected
	keydown: function(inSender, inEvent) {
		if (this.autoDismiss && inEvent.keyCode == 27 /* escape */) {
			this.hideScrim();
			this.animateClose();
		}
	},
	//* @protected
	hideScrim: function() {
		if (this.$.scrim) {
			this.$.scrim.hide();
		}
	},
	//* @protected
	scrimTap: function() {
		if (this.autoDismiss) {
			this.hideScrim();
			this.animateClose();
		}
	}
});