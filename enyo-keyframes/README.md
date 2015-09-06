
## Enyo Dynamic Keyframes

enyodomext.js contains some functions to adjust keyframes at runtime.
NOTE: This is targeted for mobile devices. This won't work in a normal browser without security restrictions taken away.

On android, the performance gained is insane.

I based my most recent app off of the Slideable. I first modified it to use translate3d() for improved performance, which worked,
but still wasn't smooth when animating.

So i stuck in keyframes to take place of the animator and you get really nice results.

To setup the keyframes, here is some sample code:
```javascript
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
```

If you have multiple instances of the same control, you will want to have a different keyframe rule for each instance, otherwise
you will end up with some animations cut short if you try to adjust the keyframe while another is running.

enyo.dom.createKeyframes() takes 2 arguments
The first is a string that has the name of the keyframe, and the second is an array of objects that has the keyframes function.

keyText is the percentage or a keyword (from, to)
keyValue is the CSS properties that will be changed.

NOTE: you need to include the {} around your CSS styles.

To change keyframes at runtime:

Assuming inStart is your start value and inEnd is your end value.

```javascript
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
```

You can use enyo.dom.changeKeyframes() which takes 2 arguments.
The first is the keyframe Rule name as a string, and then an array of values like before.

All rules from the original keyframes will be deleted and your new rules added.
enyo.dom.changeKeyframes() returns the name of the keyframe rule, so you can place it right in the applyStyle of animation-name, like above.


PLEASE NOTE: on Android, using animation-fill-mode of forwards or both on a control that needs drag ability will not work. Not sure why, but it doesn't.

On BB10, i have found keyframes actually functions worse, so i have disabled it for blackberry.

Check out the sample, and also the ToasterPopup modified to use keyframes.

(please note you need to have web security disabled to use this on a normal browser.)
For a jsFiddle, see  [Slideable keyframes sample](http://jsfiddle.net/jq7yM/2/)
