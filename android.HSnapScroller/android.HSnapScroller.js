enyo.kind({
	name: "DelayedImage",
	published: {
		src: "",
		maxWidth: "100%"
	},
	handlers: {
		onStripImages: "stripImage",
		onFlowImages: "flowImage"
	},
	tag: null,
	tools: [
		{kind: "Image", name: "image"}
	],
	flowImage: function() {
		this.stripImage();
		this.tools[0].src = this.src;
		this.tools[0].style = "max-width:" + this.maxWidth + ";";
		this.createComponents(this.tools);
		this.$.image.render();
	},
	stripImage: function() {
		this.destroyClientControls();
	}

});

enyo.kind({
	name: "android.Scroller",
	kind: "enyo.Scroller",
	handlers: {
		onScrollToTop: "scrollToZero",
		onscroll: "domScroll",
		onScrollStart: "scrollStart",
		onScroll: "scroll",
		onScrollStop: "scrollStop"
	},
	strategyKind: "enyo.TranslateScrollStrategy",
	thumb: true,
	createStrategy: function() {
		this.createComponents(
			[
				{
					name: "strategy",
					maxHeight: this.maxHeight,
					kind: this.strategyKind,
					thumb: this.thumb,
					preventDragPropagation: this.preventDragPropagation,
					overscroll:this.touchOverscroll,
					translateOptimized: true,
					scrim: true,
					isChrome: true
				}
			]
		);
	},
	scrollToZero: function() {
		this.setScrollTop(0);
	}
});


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
	componentsCreated: false,
	components: [
		{name: "client", isChrome: true}
	],
	create: function() {
		this.inherited(arguments);
	},

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

	/*
	 *Called when components should be removed from memory
	*/
	stripControls: function() {
		this.destroyClientControls();
		this.componentsCreated = false;
	},


	/*
	 *Called when images should be removed from memory. DelayedImage kind will automactically
      destroy its image when this is called. You can override or extend to do extra processing.
	*/
	stripImages: function() {
		this.waterfall("onStripImages");
	},

	/*
	 *Called when images should be rendered. It could be usefull to override or extend this method
	  So images are loaded at a slower pace.
	*/
	flowImages: function() {
		this.waterfall("onFlowImages");
	}
});




enyo.kind({
	name: "android.HSnapScroller",
	kind: "android.Scroller",
	classes: "scroller",
	thumb: false,
	vertical: "hidden",
	preventDragPropagation: false,
	published: {
		
	},
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
		onLoadingViewHidden: ""
		
	},
	handlers: {
		onScroll: "scrolling",
		onScrollStart: "snapStart",
		onScrollStop: "snapFinish",
		ondragstart: "dragstart",
		ondragfinish: "dragfinish"
	},
	components: [
		{kind: "Control", name: "stub", classes: "scroller-slide", isChrome: true}
	],
	//payload of views, all MUST BE the same width and all MUST BE an SnapScrollerCell
	//All items MUST have a name property
	//Call setItems to set the items up. 
	//setItems requires 3 paramaters, ([payload of views], currentIndex #, boolean to rerender)
	items: [],

	//*@protected
	viewsToLoad: 3,
	stubWidth: 0,
	viewWidth: 0,
	lastSL: 0,
	loadingViewIndex: -1,
	wentInOverScroll: 0,
	//current index number
	index: 0,

	//* @public
	//Amount of px the user needs to drag to make a switch
	triggerDistance: 20,
	
	//*@protected
	snapping: false,
	goingBack: false,
	isDragging: false,
	shouldFireStartEvent: true,
	//*@protected
	create: function() {
		this.inherited(arguments);
		var s = this.getStrategy().$.scrollMath;
		s.kFrictionDamping = 0.8;
		s.interval = 1;
		s.kSnapFriction = 0.5;
		s.kDragDamping = 0.2;
		s.kSpringDamping = 0.7;
		s.frame = 1;

	},

	//*@public
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
		if (this.animationIsRunning()) {return;}
		this.transitionStart();
		this.increaseIndex();
		this.goingBack = false;
		this.transistionNearFinish();
		this.scrollToIndex(true);
	},
	//*@public
	//animates to previous cell
	previous: function() {
		if (this.animationIsRunning()) {return;}
		this.transitionStart();
		this.decreaseIndex();
		this.goingBack = true;
		this.transistionNearFinish();
		this.scrollToIndex(true);
	},
	//*@protected
	animationIsRunning: function() {
		return this.getStrategy().$.scrollMath.isScrolling();
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
			this.wentInOverScroll = 0;
			this.scrollToIndex();
			this.$[this.loadingView.name].destroy();
			this.loadingViewIndex = -1;
			this.loadingViewHidden();
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
		this.stubWidth = 0;
		this.setStubWidth(0);
	},
	//*@protected
	renderAtIndex: function() {
		// [stub] [invisble] [no images] [prev] [cur] [next] [skinned]
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
				end += 2;
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
		this.viewWidth = b.width || window.innerWidth;

		var cur = this.items[this.index];
		var prev = this.items[this.index - 1];
		var nex = this.items[this.index + 1];
		var skinned = this.items[this.index + 2];
		var noimages = this.items[this.index - 2];
		var invisible = this.items[this.index - 3];

		this.$[cur.name].flowControls(true);

		if (prev) {
			this.$[prev.name].flowControls(true);
		}
		if (nex) {
			this.$[nex.name].flowControls(true);
		}
		if (skinned) {
			this.$[skinned.name].flowControls();
		}
		if (noimages) {
			this.$[noimages.name].flowControls();
		}
		if (invisible) {
			this.$[invisible.name].flowControls();
			this.$[invisible.name].applyStyle("visibility", "hidden");
		}
		this.recalculateSize();
	},
	//*@protected
	setStubWidth: function(w) {
		this.$.stub.applyStyle("width", w + "px");
		this.applyStyle("width", (this.viewWidth) + "px");
	},
	//*@public
	/**
	 *Call after you resize any views to setup the correct scroll location
	*/
	recalculateSize: function() {
		var b = {};
		if (this.$[this.items[this.index].name]) {
			b = this.$[this.items[this.index].name].getBounds();
		}
		this.viewWidth = b.width || window.innerWidth;
		var start = this.index - 3;
		if (start < 0) {start = 0;}
		this.stubWidth = start * this.viewWidth;
		this.setStubWidth(this.stubWidth);
		this.setDirect();
		
	},

	//*@protected
	snapStart: function() {
		this.lastSL = this.getScrollLeft();
	},
	//*@protected
	scrolling: function() {
		if (this.getStrategy().dragging) {
			this.isDragging = true;
			if (this.shouldFireStartEvent) {this.transitionStart();}
		}
		else if (!this.snapping && this.isDragging) {
			this.isDragging = false;
			this.snap();
		}
		else if (this.snapping && this.closeEnough()) {
			this.snapFinish();
		}
	},
	//*@protected
	snapFinish: function() {
		if (this.snapping) {
			this.snapping = false;
			this.transitionFinish();
			enyo.asyncMethod(this, function() {this.stabalizeControl();});
		}
	},
	//*@protected
	snap: function() {
		var sL = this.getScrollLeft();
		var prevIndex = this.index;
		var atEnd = (this.index == (this.items.length - 1) && sL >= this.lastSL);
		if (sL > this.lastSL || atEnd) {
			//forward
			if (sL - this.lastSL > this.triggerDistance || atEnd){
				this.increaseIndex();
			}
			this.goingBack = false;
		}
		else if (sL <= this.lastSL) {
			//back
			if (this.lastSL - sL > this.triggerDistance){
				if (this.wentInOverScroll > 0) {
					this.loadingViewHidden();
					this.wentInOverScroll = 0;
				}
				else {
					this.decreaseIndex();
				}
			}
			this.goingBack = true;
		}
		this.transistionNearFinish();
		this.scrollToIndex(true);
	},
	//* @protected
	/**
	 * Checks if the scroll is within 6 px of the correct location
	 * this is needed to speed up the animation end event, otherwise
	 * there is upto a half second lag time while the scroller
	 * slowing gets into the last position
	*/
	closeEnough: function() {
		var x = Math.round(this.getScrollLeft());
		var y = this.index * this.viewWidth;
		var min = y - 3;
		var max = y + 3;
		if (x > min && x < max) {
			return true;
		}
		return false;
	},
	//*@protected
	//* needed on android due to some light drags not firing the full touchdown, touchmove, touchend cycle
	dragfinish: function(inSender, inEvent) {
		var d = this.closeEnough();
		if (d) {
			this.setDirect();
		}
	},
	//*@protected
	//*If we are about to snap, and the user drags again, stop and start over
	dragstart:function() {
		if (this.snapping) {
			this.snapping = false;
			this.isDragging = false;
			this.stop();
			if (this.needsStabalize) {
				this.stabalizeControl();
			}
		}
	},
	//*@protected
	increaseIndex: function() {
		this.needsStabalize = false;
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
		else {
			this.needsStabalize = true;
		}
	},

	//*@protected
	decreaseIndex: function() {
		this.needsStabalize = false;
		this.index--;
		if (this.index < 0) {
			this.index = 0;
		}
		else {
			this.needsStabalize = true;
		}
	},
	//*@protected
	stop: function() {
		this.getStrategy().$.scrollMath.stop();
	},
	//*@protected
	scrollToIndex: function(snap) {
		//If we are on the loadingView, when need to
		//go one more then the index since the loadingView
		//does not retain an index number
		this.stop();
		if (this.wentInOverScroll > 0) {
			this.scrollTo((this.index + 1) * this.viewWidth, 0);
		}
		else {
			this.scrollTo(this.index * this.viewWidth, 0);
		}
		this.snapping = !snap ? false : snap;
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
				this.stubWidth = s_w * this.viewWidth;
				this.setStubWidth(this.stubWidth);
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
				this.stubWidth = this.stubWidth - this.viewWidth;
				this.setStubWidth(this.stubWidth);
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
			this.setScrollLeft((this.index + 1) * this.viewWidth);
		}
		else {
			this.setScrollLeft(this.index * this.viewWidth);
		}
	},
	//*@protected
	twiddle: function() {
		this.getStrategy().twiddle();
		this.twiddleMore();
	},
	//*can't seem to twiddle enough on android...
	twiddleMore: function() {
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
	}
});