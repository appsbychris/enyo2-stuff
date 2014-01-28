


/*
	Slideable3d
	Basically just a slideable tweaked to use translate3d() instead of 
	translateX() and translateY()
	Have found it to have better performance on android 4.1 +

*/

enyo.kind({
	name: "Slideable3d",
	kind: "Slideable",
	
	published: {
		//animation duration in seconds
		timingDuration: 0.3,
		timingFunction: "linear"
	},
	use3d: true,
	useKeyframes: true,
	freeze: false,
	statics: {
		count: 0
	},
	create: function() {
		this.inherited(arguments);
		if (enyo.platform.blackberry) {
			this.useKeyframes = false;
		}
		if (this.useKeyframes === true) {
			Slideable3d.count++;
			var values = [];
			values.push({
				keyText: "0%",
				keyValue: "{" + enyo.dom.getCssTransformProp() + ": translate3d(0,0,0);}"
			});
			values.push({
				keyText: "100%",
				keyValue: "{" + enyo.dom.getCssTransformProp() +": translate3d(0,0,0);}"
			});
			this.applyStyle(enyo.dom.getCSSPrefix("animation-duration", "AnimationDuration"), this.timingDuration + "s");
			this.applyStyle(enyo.dom.getCSSPrefix("animation-timing-function", "AnimationTimingFunction"), this.timingFunction);
			//this.applyStyle(enyo.dom.getCSSPrefix("animation-fill-mode", "AnimationFillMode"), "forwards");
			enyo.dom.createKeyframes("slideable-slide" + Slideable3d.count, values);
			this.keyFrameRule = "slideable-slide" + Slideable3d.count;
			/*if (!this.draggable) {
				this.addClass("fill-forwards");
			}*/
		}
	},
	rendered: function() {

		this.inherited(arguments);
		if (this.useKeyframes === true) {
			enyo.dispatcher.listen(this.hasNode(), enyo.dom.getAnimationEvent("AnimationEnd"), enyo.bind(this,this.animateEnd));
		}
	},
	lastEvent: {},
	animateEnd: function(iE) {
		//if (this.lastEvent.timeStamp == iE.timeStamp) {return;}

		if (this.useKeyframes === true) {
			//this.lastEvent.timeStamp = iE.timeStamp;
			this.valueChanged(this.value);
			this.applyStyle(enyo.dom.getCSSPrefix("animation-name", "AnimationName"), "none");
			this.bubble("onAnimateFinish");
			//setTimeout(enyo.bind(this,function() {this.lastEvent = {};}), 10);
		}
	},
	destroy: function() {
		if (this.useKeyframes === true) {
			Slideable3d.count--;
			enyo.dom.deleteKeyframes(this.keyFrameRule);
		}
		this.inherited(arguments);
	},
	valueChanged: function(inLast) {
		var v = this.value;
		if (this.isOob(v) && !this.isAnimating()) {
				this.value = this.overMoving ? this.dampValue(v) : this.clampValue(v);
		}
		// FIXME: android cannot handle nested compositing well so apply acceleration only if needed
		// desktop chrome doesn't like this code path so avoid...
		if (enyo.platform.android > 2) {
			if (this.value) {
				if (inLast === 0 || inLast === undefined) {
					enyo.dom.accelerate(this, this.accelerated);
				}
			} else {
				enyo.dom.accelerate(this, false);
			}
		}

		// If platform supports transforms
		if (this.canTransform) {
			if (this.use3d) {
				if (this.transform == "translateX") {
					enyo.dom.transformValue(this, "translate3d", this.value + this.unit + ",0,0");
				}
				else {
					enyo.dom.transformValue(this, "translate3d","0," +  this.value + this.unit + ",0");
				}
			}
			else {
				enyo.dom.transformValue(this, this.transform, this.value + this.unit);
			}
		// else update inline styles
		} else {
			this.setInlineStyles(this.value, false);
		}
		this.doChange();
	},
	play: function(inStart, inEnd) {
		if (this.use3d && this.useKeyframes) {
			
			var values = [];
			values.push({
				keyText: "0%",
				keyValue: (this.transform == "translateX" ? "{" + enyo.dom.getCssTransformProp() + ": translate3d(" + inStart + this.unit +",0,0);}" : "{" + enyo.dom.getCssTransformProp() + ": translate3d(0," + inStart + this.unit + ",0);}")
			});
			values.push({
				keyText: "100%",
				keyValue: (this.transform == "translateX" ? "{" + enyo.dom.getCssTransformProp() + ": translate3d(" + inEnd + this.unit +",0,0);}" : "{" + enyo.dom.getCssTransformProp() + ": translate3d(0," + inEnd + this.unit + ",0);}")
			});
			this.applyStyle(enyo.dom.getCSSPrefix("animation-name", "AnimationName"), enyo.dom.changeKeyframes(this.keyFrameRule, values));
			this.value = inEnd;
			this.valueChanged(inEnd);
			
		}
		else {
			this.inherited(arguments);
		}
	},
	dragfinish: function(inSender, inEvent) {
		if (this.freeze === true) {
			if (this.dragging) {
				this.dragging = false;
				if (this.value > this.max) {
					this.animateToMax();
				}
				if (this.value < this.min) {
					this.animateToMin();
				}
				inEvent.preventTap();
				return this.preventDragPropagation;
			}
		}
		else {
			this.inherited(arguments);
		}
	}
});

