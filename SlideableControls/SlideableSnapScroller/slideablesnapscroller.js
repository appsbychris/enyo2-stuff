/*
	SlideableSnapScroller

	A SnapScroller control that is meant to handle many views (upto hundreds or thousands).
	It uses this pattern to render the views:

	[internal stub item]
		[visibility: hidden view]
			[Rendered View with no images]
				[Fully loaded previous view]
					[Current View]
						[Full loaded next view]
							[Rendered view without components]
	
	The stub item is there to reduce the number of elements currently rendered. There will
	be at most 5 views "rendered" at once, but only 3 will have everything fully loaded.
	As the user scrolls through the views, older views are destroyed, and there width added
	to the stub item's width. New views are loaded in 2 stages. First the view itself is
	rendered without components, and when that view gets moved in the the next view slot, 
	all components are then rendered.
	Views are unloaded in 3 stages. First, once a view moves behind the previous view, The
	SlideableSnapScroller sends an event for the view to destroy all images. The SnapScrollerCell
	has built in functions to handle these events, but you need to hook up the destruction
	of the images yourself. (unless you use one of my buffered image controls.)
	Once the view gets pushed back another step, it gets the visibility: hidden style added to it, 
	so it takes up the same amount of space, but doesn't need to be rendered.
	And the last step is for the view to be destroyed and its width added to the stub item's width
	to maintain the same scroll position.
	
	Each view needs to be a SnapScrollerCell (the defaultKind). In each SnapScrollerCell, put it's
	components in the cellComponents: [] block so the components are only rendered when needed.
	See the SnapScrollerCell for more info.

	SlideableSnapScroller is based on the Slideable3d control that uses transform3d() instead of
	translateX() and translateY(). It will work as a normal Slideable, or you can set use3d to false.

	Currently only supports horizontal scrolling.

	All views need to be created dynamically. Use the setItems() function to insert your views
	into the SnapScroller.

	See the sample for more details.

*/


enyo.kind({
	name: "SlideableSnapScroller",
	kind: "Slideable3d",
	classes: "slideable-snapscroller",
	defaultKind: "SnapScrollerCell",
	//* @protected - Currently only supports horizontal snap scroller
	axis: "h",

	//* @protected
	min:-70,
	//* @protected
	max:0,
	//* @protected
	unit: "px",
	//* @protected
	kDragScalar: 1.65,

	//* @public
	//* Allows the user to drag past the boundries, and then snap back
	//* Note: loadingView will not load with this set to false.
	overMoving: true,

	//* @protected
	preventDragPropagation: true,

	/** @public
	 *  A SnapScrollerCell that will be inserted when the user reaches to end of the list
	 *  while new views are being fetched.
	 *  MUST have a name property,
	 *  MUST be same width and height of other views and
	 *  MUST be a SnapScrollerCell
	*/
	loadingView: {

	},
	events: {
		//All events send an object with the current index number
		/*
		*	transitionStart: function(inSender, inEvent) {
				this.log(inEvent.index)	
			}


			TransitionStart will have the current index number,
			TransitionNearFinish and TransitionFinish will have the 
			new index number
		*/

		//fired when the user starts to drag
		onTransitionStart: "",

		//fired after the user releases the drag, but before the animation has completed
		onTransitionNearFinish: "",

		//fired after animation is complete
		onTransitionFinish: "",

		//fired when the loading view is visible
		onLoadingViewVisible: "",

		//fired when the loading view is no longer on the screen.
		onLoadingViewHidden: "",

		//fired when attempting to render 0 views
		onRenderError: ""
		
	},
	//* @protected
	handlers: {
		ondragstart: "dragstart",
		ondrag: "drag",
		ondragfinish: "dragfinish",
		onAnimateFinish: "snapFinish"
	},
	//* @protected
	//* All components need to be dynamically created.
	//* Use the setItems() function to add views.
	components: [
		{kind: "Control", name: "stub", classes: "scroller-slide", isChrome: true, style: "visibility:hidden;"}
	],

	//@public
	//payload of views, all MUST BE the same width and all MUST BE a SnapScrollerCell
	//All items MUST have a name property
	//Call setItems() to set the items up. 
	//setItems requires 3 paramaters, ([payload of views], currentIndex #, boolean to rerender)
	items: [],

	//*@protected
	viewsToLoad: 3,
	stubWidth: 0,
	viewWidth: 0,
	lastSL: 0,
	loadingViewIndex: -1,
	wentInOverScroll: 0,
	index: 0,

	//* @public
	//Amount of px the user needs to drag to make a switch
	triggerDistance: 40,
	
	//*@protected
	snapping: false,
	goingBack: false,
	shouldFireStartEvent: true,

	//*@protected
	dragstart: function(inSender, inEvent) {
		if (this.shouldDrag(inEvent)) {
			this.transitionStart();
			inEvent.preventDefault();
			inEvent.dragInfo = {};
			this.dragging = true;
			this.drag0 = this.value;
			this.lastSL = this.value;
			this.dragd0 = 0;
			return this.preventDragPropagation;
		}
	},

	//*@protected
	drag: function(inSender, inEvent) {
		if (this.dragging) {
			inEvent.preventDefault();
			var d = this.canTransform ? inEvent[this.dragMoveProp] * this.kDragScalar : this.pixelsToPercent(inEvent[this.dragMoveProp]);
			var v = this.drag0 + d;
			var dd = d - this.dragd0;
			this.dragd0 = d;
			if (dd) {
				inEvent.dragInfo.minimizing = dd < 0;
			}
			this.setValue(v);
			this.ensureSnapFinsih();
			return this.preventDragPropagation;
		}
	},

	//*@protected
	currentViewName: "",

	//*@protected
	dragfinish: function(inSender, inEvent) {
		if (this.dragging) {
			this.dragging = false;
			this.snapping = true;
			this.goingBack = false;
			if (this.value <= this.lastSL) {
				//forward
				if ((Math.abs(this.value) - Math.abs(this.lastSL)) > this.triggerDistance) {
					this.animateToMin();
					this.snap();
				}
				else {
					this.scrollToIndex();
				}
			}
			else if (this.value > this.lastSL ) {
				//back
				if ((Math.abs(this.lastSL) - Math.abs(this.value)) > this.triggerDistance) {
					this.goingBack = true;
					this.animateTo(((this.index - 1 + this.wentInOverScroll) * this.viewWidth) * -1);
					this.snap();
				}
				else {
					this.scrollToIndex();
				}
			}
			this.ensureSnapFinsih();
			this.twiddle();
			inEvent.preventTap();
			return this.preventDragPropagation;
		}
	},

	//*@protected
	valueChanged: function(inLast) {
		if (isNaN(this.value)) {this.value = this.max;}
		this.inherited(arguments);
		this.twiddle();
		
	},

	//*@protected
	updateMin: function() {
		this.min = -1 * (this.viewWidth * (this.index + 1));
	},

	//*@public
	//* Returns the current index number
	getIndex: function() {
		return this.index;
	},

	//*@public
	//Rerenders the list at the specified index
	setIndex: function(inIndex) {
		this.index = inIndex;
		this.resetToZero();
		this.renderAtIndex();
	},

	//*@public
	//animates to the next cell
	next: function() {
		this.transitionStart();
		this.goingBack = false;
		this.snapping = true;
		this.snap();
		this.scrollToIndex();

	},

	//*@public
	//animates to previous cell
	previous: function() {
		this.transitionStart();
		this.goingBack = true;
		this.snapping = true;
		this.snap();
		this.scrollToIndex();
	},

	//*@public setItems(items, curIndex, reRender)
	//sets up the snap scroller with views.
	/*
	 *HSnapScroller is set up to be infinite in the number of views it can show.
	 You should keep an array of all your views in the parent kind of this.
	 When you first call setItems, You will give it your initial set of views, the current
	 index number to view (usually 0), and a true to rerender the list.
	 :
	 this.$.hSnapScroller.setItems(this.myViews, 0, true);

	 ** When the user starts swiping through the views, listen to the onTransitionFinsih event
	 to get the current index number. It will be in the inEvent paramater under 'index'

	 transitionFinish: function(inSender, inEvent) {
				this.log(inEvent.index)	
			}

	You can use this to track if the user is getting near to the end of views.

		transitionFinish: function(inSender, inEvent) {
				this.currentIndex = inEvent.index;
				if (inEvent.index > this.myViews.length - 5)	{
					//Request more items
				}
			}

		And when your request for more items comes back, set the items into hSnapScroller again, 
		but this time, don't rerender the whole list:

		moreItemsReceived: function() {
			this.$.hSnapScroller.setItems(this.myViews, this.currentIndex, false)
		}

		This will prevent flickering of the entire list when it rerenders.
	*/
	setItems: function(items, curIndex, reRender) {
		this.items = items;
		if (this.loadingViewIndex >=0) {
			this.destroyLoadingView();
		}
		this.index = curIndex;
		this.loadItems(reRender);
	},

	//*@protected
	loadItems: function(reRender) {
		if (reRender) {
			this.resetToZero();
			this.renderAtIndex();
		}
		else {
			this.ensureLoad();
		}
		this.updateMin();

	},

	//*@protected
	//* needed on android due to some light drags not firing the full touchdown, touchmove, touchend cycle
	tap: function() {
		this.setDirect();
	},

	//*@protected
	ensureLoad: function() {
		this.setupNextChildren();
	},

	//*@protected
	resetToZero: function() {
		this.destroyClientControls();
		this.wentInOverScroll = 0;
		this.loadingViewIndex = -1;
		this.setStubWidth(0);
	},

	//*@protected
	renderAtIndex: function() {
		// [stub] [invisble] [no images] [prev] [cur] [next] [skinned]
		if (this.items.length < 1) {
			console.error("ERROR - No items in list");
			this.doRenderError();
			return;
		}
		var c = 0;
		var i = 0;
		var Arr = [];
		var start = this.index - this.viewsToLoad;
		var end = this.viewsToLoad;
		if (start < 0) {
			start = 0;
		}
		else {
			if (this.index == 2) {
				end++;
			}
			else if (this.index > 2) {
				end += this.viewsToLoad;
			}
		}
		for (i = start; i < this.items.length; i++) {
			Arr.push(this.items[i]);
			c++;
			if (c > end) {break;}
		}

		this.createComponents(Arr, {owner: this});
		this.render();
		var b = this.$[Arr[0].name].getBounds();
		this.viewWidth = b.width || enyo.dom.getWindowWidth();

		var cur = this.items[this.index];
		var prev = this.items[this.index - 1];
		var nex = this.items[this.index + 1];
		var skinned = this.items[this.index + 2];
		var noimages = this.items[this.index - 2];
		var invisible = this.items[this.index - 3];
		this.$[cur.name].flowControls(true);

		if (prev) {
			var cPrev$ = this.$[prev.name];
			if (cPrev$) {
				cPrev$.flowControls(true);
			}
		}
		if (nex) {
			var cNex$ = this.$[nex.name];
			if (cNex$) {
				cNex$.flowControls(true);
			}
		}
		if (skinned) {
			var cSkinned$ = this.$[skinned.name];
			if (cSkinned$) {
				cSkinned$.flowControls();
			}
		}
		if (noimages) {
			var cNoImages$ = this.$[noimages.name];
			if (cNoImages$) {
				cNoImages$.flowControls();
			}
		}
		if (invisible) {
			var cInvisible$ = this.$[invisible.name];
			if (cInvisible$) {
				cInvisible$.flowControls();
				cInvisible$.applyStyle("visibility", "hidden");
			}
		}
		this.recalculateSize();
	},

	//*@protected
	setStubWidth: function(w) {
		this.stubWidth = w;
		this.$.stub.applyStyle("width", w + "px");
		this.applyStyle("width", w + ((this.getClientControls().length) * this.viewWidth) + "px");
		this.updateMin();
	},

	//*@public
	/**
	 *Call after you resize any views to setup the correct scroll location
	*/
	recalculateSize: function() {
		var b = {};
		var c = this.items[this.index];
		if (c) {
			var c$ = this.$[c.name];
			if (c$) {
				b = c$.getBounds();
			}
		}
		this.viewWidth = b.width || enyo.dom.getWindowWidth();
		var start = this.index - this.viewsToLoad;
		if (start < 0) {start = 0;}
		this.setStubWidth(start * this.viewWidth);
		this.setDirect();
	},

	//* @protected
	//* This is needed mostly for mobile devices.
	//* Depending on what content you have in your SnapScrollCells,
	//* you may lose the full event cycle. Animated gifs are the main
	//* culprit here.
	//* This function will force the SnapScroller to animate to the
	//* current index number after just 350MS.
	ensureSnapFinsih: function() {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}

		this.timeout = setTimeout(enyo.bind(this,function() {
			if (this.snapping && !this.dragging) {
				this.snapFinish();
			}
			else if (this.value != -1 * (this.viewWidth * (this.index))) {
				this.dragging = false;
				this.scrollToIndex();
			}

		}), 350);
	},

	//*@protected
	snapFinish: function() {
		if (this.snapping) {
			this.snapping = false;
			this.transitionFinish();
			this.stabalizeControl();
		}
	},

	//*@protected
	snap: function() {
		var atEnd = (this.index == (this.items.length - 1) && this.goingBack === false);
		if (this.goingBack === false || atEnd) {
			this.increaseIndex();
		}
		else if (this.goingBack === true) {
			if (this.wentInOverScroll > 0) {
				this.loadingViewHidden();
				this.wentInOverScroll = 0;
			}
			else {
				this.decreaseIndex();
			}
		}
		this.currentViewName = this.items[this.index].name;
		this.transistionNearFinish();
	},
	
	//*@protected
	increaseIndex: function() {
		this.index++;
		var m = this.items.length - 1;
		if (this.index > m) {
			if (this.loadingView.name && this.loadingViewIndex == -1) {
				//*If there is a loading view, create it
				//*and set the index so we know its made
				this.loadingViewIndex = m + 1;
				this.createNextChild(this.loadingView);
			}
			if (this.loadingViewIndex >= 0) {
				//*if we are going to scroll the the loading view
				//*fire the event that it will be active
				//*Note, this sends the index of the last
				//*actual view, not the index of the loading view.
				this.doLoadingViewVisible({index: m});
			}
			//*This is for the scrollTo function to know
			//*if we are scrolling onto the loading view.
			this.wentInOverScroll = 1;
			this.index = m;
		}
	},

	//*@protected
	decreaseIndex: function() {
		this.index--;
		if (this.index < 0) {this.index = 0;}
		if (this.loadingViewIndex >= 0) {
			if (this.index <= this.items.length - 1) {
				this.destroyLoadingView(true);
			}
		}
	},

	//*@protected
	destroyLoadingView: function(noscroll) {
		this.wentInOverScroll = 0;
		if (!noscroll) {this.scrollToIndex();}
		this.$[this.loadingView.name].destroy();
		this.loadingViewIndex = -1;
		this.loadingViewHidden();
	},

	//*@protected
	scrollToIndex: function() {
		//If we are on the loadingView, when need to
		//go one more then the index since the loadingView
		//does not retain an index number
		if (this.wentInOverScroll > 0) {
			this.animateTo(((this.index+1) * this.viewWidth) * -1);
		}
		else {
			this.animateTo(((this.index) * this.viewWidth) * -1);
		}
	},

	//*@protected
	stabalizeControl: function() {
		if (this.goingBack === true) {
			this.moveBack();
		}
		else {
			this.moveForward();
		}

		this.recalculateSize();
		this.twiddle();
	},

	//*@protected
	moveForward: function() {
		// [stub] [invisble] [no images] [prev] [cur] [next] [skinned]
		var x = this.index;
		var i = this.items;
		var destroy = i[x - 4];
		var invisible = i[x - 3];
		var noimages = i[x - 2];
		if (destroy) {
			var cDestroy$ = this.$[destroy.name];
			if (cDestroy$) {
				var s_w = x - 3;
				if (s_w < 0) {s_w = 0;}
				cDestroy$.destroy();
				this.setStubWidth(s_w * this.viewWidth);
			}
		}
		if (invisible) {
			var cInvisible$ = this.$[invisible.name];
			if (cInvisible$) {
				cInvisible$.applyStyle("visibility", "hidden");
			}
		}
		if (noimages) {
			var cNoImages$ = this.$[noimages.name];
			if (cNoImages$) {
				cNoImages$.stripImages();
			}
		}
		
		this.setupNextChildren();
	},

	//*@protected
	setupNextChildren: function() {
		// [stub] [invisble] [no images] [prev] [cur] [next] [skinned]
		var next = this.items[this.index + 1];
		if (next) {
			var cNext$ = this.$[next.name];
			if (cNext$) {
				if (cNext$.componentsCreated === false) {
					cNext$.flowControls(true);
				}
				else {
					cNext$.flowImages();
				}
				
				this.createNewestChild();
			}
			else {
				this.createNextChild(next);
			}
		}
	},

	//*@protected
	createNextChild: function(next) {
		this.$.stub.createComponent(next, {owner: this});
		this.addControl(this.$[next.name]);
		this.$[next.name].flowControls(true);
		this.createNewestChild();
	},

	//*@protected
	createNewestChild: function() {
		var skinned = this.items[this.index + 2];
		if (skinned) {
			var cSkinned$ = this.$[skinned.name];
			if (!cSkinned$) {
				this.$.stub.createComponent(skinned, {owner: this});
				this.addControl(this.$[skinned.name]);
				this.$[skinned.name].flowControls();
			}
		}
	},

	//*@protected
	moveBack: function() {

		// [stub] [invisble] [no images] [prev] [cur] [next] [skinned]
		var newest = this.items[this.index + 3];
		var skinned = this.items[this.index + 2];
		var prev = this.items[this.index - 1];
		var noimages = this.items[this.index - 2];
		var invisible = this.items[this.index - 3];
		if (newest) {
			var cDestroy$ = this.$[newest.name];
			if (cDestroy$) {
				cDestroy$.destroy();
			}
		}
		if (skinned) {
			var cSkinned$ = this.$[skinned.name];
			if (cSkinned$) {
				cSkinned$.stripControls();
			}
		}
		if (prev) {
			var cPrev$ = this.$[prev.name];
			if (cPrev$) {
				cPrev$.flowImages();
			}
		}
		if (noimages) {
			var cNoImages$ = this.$[noimages.name];
			if (cNoImages$) {
				cNoImages$.applyStyle("visibility", null);
				if (cNoImages$.componentsCreated === false) {
					cNoImages$.flowControls();
				}
			}
		}
		if (invisible) {
			if (!this.$[invisible.name]) {
				invisible.addBefore = this.$[noimages.name];
				this.createComponent(invisible, {owner: this});
				invisible.addBefore = undefined;
				this.setStubWidth(this.stubWidth - this.viewWidth);
			}
			this.$[invisible.name].flowControls();
			this.$[invisible.name].applyStyle("visibility", "hidden");

		}
		this.goingBack = false;
	},

	//*@protected
	//*Sets the scroll position to the exact PX with no animation
	setDirect: function() {
		if (this.wentInOverScroll > 0) {
			this.setValue(-1 * (this.viewWidth * (this.index + 1)));
		}
		else {
			this.setValue(-1 * (this.viewWidth * (this.index)));
		}
	},

	//*@protected
	twiddle: function() {
		if (this.hasNode()) {
			this.node.scrollTop = 1;
			this.node.scrollTop = 0;
		}
		document.body.scrollTop = 1;
		document.body.scrollTop = 0;
	},

	//* @protected
	transitionStart: function() {
		if (this.wentInOverScroll === 0) {
			this.doTransitionStart({index: this.index});
		}
		this.shouldFireStartEvent = false;
	},

	//*@protected
	transistionNearFinish: function() {
		if (this.wentInOverScroll === 0) {
			this.doTransitionNearFinish({index: this.index});
		}
	},

	//*@protected
	transitionFinish: function() {
		if (this.wentInOverScroll === 0) {
			this.doTransitionFinish({index: this.index});
		}
		this.shouldFireStartEvent = true;
	},

	//* @protected
	loadingViewHidden: function() {
		//fired when the loadingView is no longer the active view.
		this.doLoadingViewHidden({index: this.index});
	},

	/*
		These are functions i made internally for an app.
		I have included a buffered image that handles gifs
		a bit differently then non-gif images. The buffered
		image control is a bit rough around the edges, but
		i designed it for what was needed in my app.

	*/
	flowGifs: function() {
		var c = this.items[this.index];
		if (c) {
			var c$ = this.$[c.name];
			if (c$) {
				c$.waterfallDown("onFlowGifs");
			}
		}

	},
	stripGifs: function() {
		var c = this.items[this.index];
		if (c) {
			var c$ = this.$[c.name];
			if (c$) {
				c$.waterfallDown("onStripGifs");
			}
		}
	}
});