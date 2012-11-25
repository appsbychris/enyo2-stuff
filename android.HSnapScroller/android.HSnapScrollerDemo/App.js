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
		onScrollToTop: "scrollToTop",
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
		onTransitionFinish: ""
		
	},
	handlers: {
		ondragstart: "dragstart",
		ondragfinish: "dragfinish"
	},
	components: [
		{kind: "Control", name: "stub", classes: "scroller-slide", isChrome: true}
	],
	//payload of views, all should be the same width and all need to be an android.SnapScrollerCell
	//All items need to have a name property
	//Call setItems to set the items up. 
	//setItems requires 3 paramaters, ([payload of views], currentIndex #, boolean to rerender)
	items: [],

	//*@protected
	viewsToLoad: 3,
	stubWidth: 0,
	viewWidth: 0,
	lastSL: 0,

	//current index number
	index: 0,

	//Amount of px the user needs to drag to make a switch
	triggerDistance: 50,
	
	//*@protected
	snapping: false,
	goingBack: false,
	isDragging: false,

	create: function() {
		this.inherited(arguments);
		var s = this.getStrategy().$.scrollMath;
		s.kFrictionDamping = 0.88;
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
		this.increaseIndex();
		this.goingBack = false;
		this.snapping = true;
		this.transistionNearFinish();
		this.scrollToIndex();
	},
	//*@public
	//animates to previous cell
	previous: function() {
		if (this.animationIsRunning()) {return;}
		this.decreaseIndex();
		this.goingBack = true;
		this.snapping = true;
		this.transistionNearFinish();
		this.scrollToIndex();
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

	You can use this to track if the user is getting near the end of views.

		transitionFinish: function(inSender, inEvent) {
				this.currentIndex = inEvent.index;
				if (inEvent.index > this.myViews.length - 5)	{
					//Request more items
				}
			}

		And when your request for more items comes back, set the items into hsnapscroller again, 
		but this time, don't rerender the whole list:

		moreItemsReceived: function() {
			this.$.hSnapScroller.setItems(this.myViews, this.currentIndex, false)
		}

		This will prevent flickering of the entire list when it rerenders.
	*/
	setItems: function(items, curIndex, reRender) {
		this.items = items;
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
	ensureLoad: function() {
		this.setupNextChildren();
	},
	//*@protected
	resetToZero: function() {
		this.destroyClientControls();
		this.stubWidth = 0;
		this.index = 0;
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
		var noimages = this.items[this.index - 2];
		var invisible = this.items[this.index - 3];

		this.$[cur.name].flowControls(true);

		if (prev) {
			this.$[prev.name].flowControls(true);
		}
		if (nex) {
			this.$[nex.name].flowControls(true);
		}
		if (noimages) {
			this.$[noimages.name].flowControls();
		}
		if (invisible) {
			this.$[invisible.name].flowControls();
			this.$[invisible.name].applyStyle("visibility", "hidden");
		}
		this.stubWidth = start * this.viewWidth;
		this.setStubWidth(this.stubWidth);
		this.scrollToIndex();
	},
	//*@protected
	setStubWidth: function(w) {
		this.$.stub.applyStyle("width", w + "px");
		this.applyStyle("width", (this.viewWidth) + "px");
	},
	//*@public
	/*
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
		this.setScrollLeft(this.index * this.viewWidth, 0);
		
	},
	//*@protected
	dragstart: function() {
		this.isDragging = this.getStrategy().dragging;
		this.lastSL = this.getScrollLeft();
		this.doTransitionStart({index: this.index});
	},
	//*@protected
	scrollStop: function() {
		this.inherited(arguments);
		if (this.snapping) {
			this.stabalizeControl();
		}
	},
	//*@protected
	dragfinish: function(inSender, inEvent) {
		var d = this.isDragging;
		if (d) {
			this.isDragging = false;
			var sL = this.getScrollLeft();
			if (sL > this.lastSL) {
				//forward
				if (sL - this.lastSL > this.triggerDistance){
					this.increaseIndex();
				}
				this.goingBack = false;
				this.snapping = true;
			}
			else {
				//back
				if (this.lastSL - sL > this.triggerDistance){
					this.decreaseIndex();
				}
				this.goingBack = true;
				this.snapping = true;
			}
			this.transistionNearFinish();
			this.scrollToIndex();
		}
	},
	//*@protected
	transistionNearFinish: function() {
		this.doTransitionNearFinish({index: this.index});
	},
	//*@protected
	increaseIndex: function() {
		this.index++;
		var m = this.items.length - 1;
		if (this.index > m) {
			this.index = m;
		}
	},
	//*@protected
	decreaseIndex: function() {
		this.index--;
		if (this.index < 0) {this.index = 0;}
	},
	//*@protected
	scrollToIndex: function() {
		this.scrollTo(this.index * this.viewWidth, 0);
	},
	//*@protected
	stabalizeControl: function() {
		this.snapping = false;
		if (this.goingBack === true) {
			this.moveBack();
		}
		else {
			this.moveForward();
		}
	},
	//*@protected
	moveForward: function() {
		// [stub] [invisble] [no images] [prev] [cur] [next] [skinned]
		if (this.index - this.viewsToLoad > 0) {
			var x = this.index - this.viewsToLoad + 1;
			var b = {};
			var cNoImages$ = this.$[this.items[x].name];
			var cHidden$ = this.$[this.items[x - 1].name];
			
			cNoImages$.stripImages();
			if (cHidden$) {
				
				cHidden$.applyStyle("visibility", "hidden");

				var cDestroy$ = this.$[this.items[x - 2].name];
				if (cDestroy$ && this.items[this.index + 1]) {
					b = cDestroy$.getBounds();
					cDestroy$.destroy();
					this.stubWidth += b.width;
					this.setStubWidth(this.stubWidth);
				}
			}
		}
		this.setupNextChildren();
		this.transitionFinish();
		this.twiddle();
	},
	//*@protected
	setupNextChildren: function() {
		var next = this.items[this.index + 1];
		if (next) {
			var cNext$ = this.$[next.name];
			if (cNext$) {
				cNext$.flowControls(true);
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
		var newControl = this.items[this.index + 2];
		if (newControl && !this.$[newControl.name]) {
			this.$.stub.createComponent(newControl, {owner: this});
			this.addControl(this.$[newControl.name]);
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
		this.transitionFinish();
		this.twiddle();
	},
	twiddle: function() {
		this.getStrategy().twiddle();
	},
	transitionFinish: function() {
		this.doTransitionFinish({index: this.index});
	}
});

enyo.kind({
	name: "App",
	fit: true,
	components:[
		{style: "height:50px;", components: [
			{name: "viewMode", content: "android.HSnapScroller", style: "display: inline-block;"},
			{name: "toggleBtn", kind: "Button", ontap: "toggleViews", content: "Compare to Panels"}
		]},
		{name: "snap", kind: "android.HSnapScroller", onTransitionFinish: "checkIndex"},
		{kind: "Panels", arrangerKind: "enyo.LeftRightArranger", showing: false, name: "panels"}
	],
	cellIndex: 0,
	views: [],
	create: function() {
		this.inherited(arguments);
		this.resetToZero();
	},
	resetToZero: function() {
		this.views = [];
		this.cellIndex = 0;
		this.generateViews(15);
		this.$.snap.setItems(this.views, 0, true);
	},
	createCell: function() {
		var h = window.innerHeight- 50;
		var a = {
			kind: "SnapScrollerCell",
			name: "cell" + this.cellIndex,
			style: "width: " + window.innerWidth + "px;height:" + h + "px;",
			cellComponents: [
				{kind: "android.Scroller", horizontal: "hidden", style: "white-space:normal;border:2px solid black;background: blue;height: " + h + "px;", components: []}
			]
		};
		a.cellComponents[0].components.push({content: "<b>View Number: " + this.cellIndex + "</b>", allowHtml: true});
		for (var i = 0; i < 3; i++) {
			a.cellComponents[0].components.push(this.generateImage("DelayedImage"));
		}
		this.cellIndex++;
		return a;
	},
	generateImage: function(kind) {
		var x = Math.floor(Math.random() * 9) + 1;
		var e = ".jpg";
		var f = x.toString() + e;
		var a = {
			kind: kind,
			src: "images/" + f,
			maxWidth: (window.innerWidth - 50) + "px"
		};
		if (kind == "Image") {
			a.style = "max-width:" + a.maxWidth + ";";
		}
		return a;
	},
	generateViews: function(count) {
		for (var i = 0; i < count; i++) {
			this.views.push(this.createCell());
		}
	},

	checkIndex: function(iS, iE) {
		if (iE.index + 5 > this.views.length) {
			this.generateViews(15);
			this.$.snap.setItems(this.views, iE.index, false);
		}
	},
	switchToSnap: function() {
		this.$.panels.hide();
		this.$.snap.show();
		this.resetToZero();
	},
	toggleViews: function() {
		if (this.$.viewMode.getContent() == "android.HSnapScroller") {
			this.$.viewMode.setContent("Panels");
			this.$.toggleBtn.setContent("Compare To HSnapScroller");
			this.switchToPanels();
		}
		else {
			this.$.viewMode.setContent("android.HSnapScroller");
			this.$.toggleBtn.setContent("Compare To Panels");
			this.switchToSnap();
		}
	},
	///PANELS
	switchToPanels: function() {
		this.$.snap.hide();
		this.$.panels.show();
		this.resetPanels();
	},
	resetPanels: function() {
		this.$.panels.destroyClientControls();
		this.createPanels();
	},
	createPanels: function() {
		var a = [];
		for (var i = 0; i < 35; i++) {
			a.push(this.createPanel(i));
		}
		this.$.panels.applyStyle("height", (window.innerHeight - 50)+ "px");
		this.$.panels.createComponents(a);
		this.$.panels.render();
		this.$.panels.reflow();
	},
	createPanel: function(index) {
		var h = window.innerHeight- 50;
		var a = {
			kind: "Control",
			name: "panel" + index,
			style: "width: " + window.innerWidth + "px;height:" + h + "px;border:2px solid black;background: blue;",
			components: [
				{kind: "android.Scroller", horizontal: "hidden", style: "white-space:normal;height: " + h + "px;", components: []}
			]
		};
		a.components[0].components.push({content: "<b>View Number: " + index + "</b>", allowHtml: true});
		for (var i = 0; i < 3; i++) {
			a.components[0].components.push(this.generateImage("Image"));
		}
		return a;
	},
});