enyo.kind({
	name: "android.List",
	kind: "enyo.List",
	statics: {
		swipeCount: 0
	},
	listTools: [
		{name: "port", classes: "enyo-list-port enyo-border-box", components: [
			{name: "generator", kind: "FlyweightRepeater", canGenerate: false, components: [
				{tag: null, name: "client"}
			]},
			{name: "holdingarea", allowHtml: true, classes: "enyo-list-holdingarea"},
			{name: "page0", allowHtml: true, classes: "enyo-list-page"},
			{name: "page1", allowHtml: true, classes: "enyo-list-page"},
			{name: "placeholder"},
			{name: "swipeableComponents", style: "position:absolute;top:-1000px;", showing: false, onwebkitAnimationEnd: "completeSwipe"}
		]}
		//{kind: "Signals", onWebkitAnimationEnd: "completeSwipe"}
	],
	percentageDraggedThreshold: 0.05,
	create: function() {
		this.inherited(arguments);
		if (enyo.platform.blackberry){
			this.$.swipeableComponents.addStyles("position:absolute; display:block; top:-1000px; left:0;");
		}
		else {
			if (this.enableSwipe) {
				android.List.swipeCount++;
				var values = [];
				values.push({
					keyText: "0%",
					keyValue: "{" + enyo.dom.getCssTransformProp() + ": translate3d(0,0,0);}"
				});
				values.push({
					keyText: "100%",
					keyValue: "{" + enyo.dom.getCssTransformProp() +": translate3d(0,0,0);}"
				});
				enyo.dom.createKeyframes("swipeable-slide" + android.List.swipeCount, values);
				this.keyFrameRule = "swipeable-slide" + android.List.swipeCount;
				
			}
		}
	},
	updateMetrics: function() {
		this.defaultPageHeight = this.rowsPerPage * (this.rowHeight || 100);
		this.pageCount = Math.ceil(this.count / this.rowsPerPage);
		this.portSize = 0;
		//*******Added to support small list as well...
		if (this.pageCount < 2 || this.fixedHeight === true) {
			this.portSize = this.count * (this.rowHeight || 100);
			//this.log(this.count + " r=" + this.rowHeight)
		}
		else {
		//******
			for (var i=0; i < this.pageCount; i++) {
				this.portSize += this.getPageHeight(i);
			}
			//this.log("loop")
		//*****
		}
		//******
		if (this.portSize === 0) {this.portSize = 150;}
		//this.log(this.portSize)
		this.adjustPortSize();
	},
	
	createStrategy: function() {
		this.controlParentName = "strategy";
		this.createComponents(
			[
				{
					name: "strategy",
					maxHeight: this.maxHeight,
					kind: "enyo.TranslateScrollStrategy",
					thumb: this.thumb,
					preventDragPropagation: this.preventDragPropagation,
					overscroll:this.touchOverscroll,
					translateOptimized: true,
					scrim: true,
					isChrome: true
				}
			]
		);
		this.createChrome(this.listTools);
		this.controlParentName = "client";
		this.discoverControlParent();
	},
	/**
		---- Swipeable functionality ------------
	*/
	openSwipeable: function(e) {
		this.$.swipeableComponents.setShowing(false);
		this.swipeIndex = e.index;
		this.startSwipe(e);
		this.swipe(this.fastSwipeSpeedMS);
	},
	attachedEvent: false,
	extractXY: function(translate) {
		if (translate) {
			var i = translate.indexOf("(") + 1;
			var j = translate.indexOf(",");
			var k = translate.indexOf(",", j+1);
			return {x: translate.substr(i,j-i), y: translate.substr(j+ 1, k - j - 1)};
		}
		else {
			return {x: 0, y: 0};
		}
	},
	animateSwipe: function(targetX,totalTimeMS) {
		if (enyo.platform.blackberry) {
			this.inherited(arguments);
			return;
		}
		this.animation = true;
		this.$.swipeableComponents.applyStyle(enyo.dom.getCSSPrefix("animation-name", "AnimationName"), "none");
		var $item = this.$.swipeableComponents;
		var pos = this.extractXY($item.domStyles[enyo.dom.getCssTransformProp()]);
		//pos.y = (parseInt(pos.y, 10) + 1000) + "px";
		var origX = parseInt(pos.x,10);
		var xDelta = targetX - origX;
		if (xDelta === 0) {return;}
		var values = [];
		values.push({
			keyText: "0%",
			keyValue:  "{" + enyo.dom.getCssTransformProp() + ": translate3d(" + origX +"px," + pos.y + ",0);}"
		});
		values.push({
			keyText: "100%",
			keyValue:  "{" + enyo.dom.getCssTransformProp() + ": translate3d(" + targetX +"px," + pos.y + ",0);}"
		});
		$item.finsihedValue = enyo.dom.getCssTransformProp() + ": translate3d(" + targetX +"px," + pos.y + ",0);";
		//$item.applyStyle("left", null);
		// + " " + totalTimeMS + "ms linear"
		$item.applyStyle(enyo.dom.getCSSPrefix("animation-duration", "AnimationDuration"), totalTimeMS + "ms");
		$item.applyStyle(enyo.dom.getCSSPrefix("animation-timing-function", "AnimationTimingFunction"), "linear");
		//$item.applyStyle(enyo.dom.getCSSPrefix("animation-fill-mode", "AnimationFillMode"), "forwards");
		$item.applyStyle(enyo.dom.getCssTransformProp(), null);
		setTimeout(enyo.bind(this,function() {
			$item.applyStyle(enyo.dom.getCSSPrefix("animation-name", "AnimationName"), enyo.dom.changeKeyframes(this.keyFrameRule, values));
		}), 0);
		
	},
	stopAnimateSwipe: function() {
		if (enyo.platform.blackberry) {
			this.inherited(arguments);
			return;
		}
		return;
	},
	slideAwayItem: function() {
		if (enyo.platform.blackberry) {
			this.inherited(arguments);
			return;
		}
		var $item = this.$.swipeableComponents;
		var parentWidth = $item.getBounds().width;
		var xPos = (this.persistentItemOrigin == "left") ? -1*parentWidth : parentWidth;
		this.animateSwipe(xPos,this.normalSwipeSpeedMS);
		this.persistentItemVisible = false;
		this.setPersistSwipeableItem(false);

		this.completeSwipeTimeout = setTimeout(enyo.bind(this,function() {
			this.completeSwipe();
		}), this.normalSwipeSpeedMS + 10);
	},
	startSwipe: function(e) {
		// modify event index to always have this swipeItem value
		e.index = this.swipeIndex;
		this.positionSwipeableContainer(this.swipeIndex,e);
		this.$.swipeableComponents.setShowing(true);
		this.setPersistentItemOrigin(e.xDirection);
		this.doSetupSwipeItem(e);
	},
	// Positions the swipeable components block at the current row.
	positionSwipeableContainer: function(index,e) {
		if (enyo.platform.blackberry) {
			this.inherited(arguments);
			return;
		}
		var node = this.$.generator.fetchRowNode(index);
		if(!node) {
			return;
		}
		var offset = this.getRelativeOffset(node, this.hasNode());
		offset.top += 1000;
		var dimensions = enyo.dom.getBounds(node);
		var x = (e.xDirection == 1) ? -1*(dimensions.width - e.pageX) : dimensions.width - (dimensions.width - e.pageX);
		this.$.swipeableComponents.applyStyle(enyo.dom.getCSSPrefix("animation-name", "AnimationName"), "none");
		this.$.swipeableComponents.addStyles(enyo.dom.getCssTransformProp() + ": translate3d(" + x +"px," + offset.top + "px, 0);height: "+dimensions.height+"px; width: "+dimensions.width+"px;");
		//this.$.swipeableComponents.applyStyle("left", null);
		//this.$.swipeableComponents.applyStyle("top", null);
	},
	/**
		Calculates new position for the swipeable container based on the user's
		drag action. Don't allow the container to drag beyond either edge.
	*/
	calcNewDragPosition: function(dx) {
		if (enyo.platform.blackberry) {
			this.inherited(arguments);
			return;
		}
		var parentBounds = this.extractXY(this.$.swipeableComponents.domStyles[enyo.dom.getCssTransformProp()]);
		var xPos = parseInt(parentBounds.x, 10);
		var dimensions = this.$.swipeableComponents.getBounds();
		var xlimit = (this.swipeDirection == 1) ? 0 : -1*dimensions.width;
		var x = (this.swipeDirection == 1)
			? (xPos + dx > xlimit)
				? xlimit
				: xPos + dx
			: (xPos + dx < xlimit)
				? xlimit
				: xPos + dx;
		return {x: x, y: parseInt(parentBounds.y, 10)};
	},
	dragSwipeableComponents: function(x) {
		if (enyo.platform.blackberry) {
			this.inherited(arguments);
			return;
		}
		enyo.dom.transformValue(this.$.swipeableComponents, "translate3d",x.x + "px," + x.y + "px, 0");
	},
	/**
		Begins swiping sequence by positioning the swipeable container and
		bubbling the setupSwipeItem event.
	*/
	
	backOutSwipe: function(e) {
		if (enyo.platform.blackberry) {
			this.inherited(arguments);
			return;
		}
		this.completeSwipeTimeout = setTimeout(enyo.bind(this, this.completeSwipe), this.fastSwipeSpeedMS + 15);
		this.inherited(arguments);
		this.setPersistSwipeableItem(false);
		
	},
	// If a persistent swipeableItem is still showing, drags it away or bounces it.
	dragPersistentItem: function(e) {
		if (enyo.platform.blackberry) {
			this.inherited(arguments);
			return;
		}
		var dimensions = this.$.swipeableComponents.getBounds();
		dimensions.top = parseInt(this.extractXY(this.$.swipeableComponents.domStyles[enyo.dom.getCssTransformProp()]).y, 10);
		var xPos = 0;
		var x = (this.persistentItemOrigin == "right")
			? Math.max(xPos, (xPos + e.dx))
			: Math.min(xPos, (xPos + e.dx));
		enyo.dom.transformValue(this.$.swipeableComponents, "translate3d", x +"px," + dimensions.top + "px, 0");
	},
	bounceItem: function(e) {
		if (enyo.platform.blackberry) {
			this.inherited(arguments);
			return;
		}
		var bounds = this.$.swipeableComponents.getBounds();
		bounds.left = parseInt(this.extractXY(this.$.swipeableComponents.domStyles[enyo.dom.getCssTransformProp()]).x,10);
		if(bounds.left != bounds.width) {
			this.animateSwipe(0,this.normalSwipeSpeedMS);
		}

	},
	// Completes swipe and hides active swipeable item.
	completeSwipe: function(e) {
		if (enyo.platform.blackberry) {
			this.inherited(arguments);
			return;
		}
		this.$.swipeableComponents.addStyles(this.$.swipeableComponents.finsihedValue);

		if(this.completeSwipeTimeout) {
			clearTimeout(this.completeSwipeTimeout);
			this.completeSwipeTimeout = null;
		}
		
		// if this wasn't a persistent item, hide it upon completion and send swipe complete event
		if(!this.getPersistSwipeableItem()) {
			this.$.swipeableComponents.setShowing(false);
			// if the swipe was completed, update the current row and bubble swipeComplete event
			if(this.swipeComplete) {
				this.doSwipeComplete({index: this.swipeIndex, xDirection: this.swipeDirection});
			}
		} else {
			this.persistentItemVisible = true;
		}
		this.swipeIndex = null;
		this.swipeDirection = null;
		this.$.swipeableComponents.applyStyle(enyo.dom.getCSSPrefix("animation-name", "AnimationName"), "none");
	}
});

