*
	Slideable3d
	Basically just a slideable tweaked to use translate3d() instead of 
	translateX() and translateY()
	Have found it to have better performance on android 4.1 +

*/

enyo.kind({
	name: "Slideable3d",
	kind: "Slideable",
	use3d: true,
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
	}
});