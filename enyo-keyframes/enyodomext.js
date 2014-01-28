
enyo.dom.getKeyframesPrefix = function() {
    if (!enyo.dom._keyframesPrefix) {
        if (enyo.platform.firefox || enyo.platform.androidFirefox || enyo.platform.firefoxOS)
            enyo.dom._keyframesPrefix = "-moz-";
        else if (enyo.platform.android || enyo.platform.ios || enyo.platform.webos || enyo.platform.safari || enyo.platform.chrome || enyo.platform.blackberry) {
            enyo.dom._keyframesPrefix = "-webkit-";
        }
        else {
            enyo.dom._keyframesPrefix = "";
        }
        return enyo.dom._keyframesPrefix;
    }
    else {
        return enyo.dom._keyframesPrefix;
    }
    
};

enyo.dom.getAnimationEvent = function(eventname) {
     var c = enyo.dom.getKeyframesPrefix();
     if (c == "-moz-") {c = "";}
     c = c.replace(/-/gi,"");
     return c + eventname;
};

enyo.dom.findKeyframes = function (rulename) {
    // gather all stylesheets into an array
    
    var ss = document.styleSheets;
    var pre = enyo.dom.getKeyframesPrefix().replace(/-/gi, "").toUpperCase();
    if (pre.length !== 0) {pre += "_";}
    // loop through the stylesheets
    for (var i = 0; i < ss.length; ++i) {

        // loop through all the rules
        for (var j = 0; j < ss[i].cssRules.length; ++j) {

            if (ss[i].cssRules[j].type == window.CSSRule[pre + "KEYFRAMES_RULE"] ) {
				if ( ss[i].cssRules[j].name == rulename) {
					return ss[i].cssRules[j];
				}
            }
        }
    }
    
    // rule not found
    return null;
};

enyo.dom.foundPrefixes = [];

enyo.dom.getCSSPrefix = function(cssRule, jsRule) {
    var i = 0;
    for (i = 0; i < enyo.dom.foundPrefixes.length; i++) {
        if (enyo.dom.foundPrefixes[i].cssRule == cssRule) {
            return enyo.dom.foundPrefixes[i].fullRule;
        }
    }
    var prefixes = ["", "-webkit-", "-moz-", "-ms-", "-o-"];
    var styles = ["", "webkit", "moz", "ms", "o"];
    for (i = 0; i < prefixes.length; i++) {
        if (typeof document.body.style[styles[i] + (styles[i].length < 1 ? enyo.uncap(jsRule) : enyo.cap(jsRule))] != "undefined") {
            enyo.dom.foundPrefixes.push({
                cssRule: cssRule,
                fullRule: prefixes[i] + cssRule
            });
            return prefixes[i] + cssRule;
        }
    }
    
};

// remove old keyframes and add new ones
enyo.dom.changeKeyframes = function (keyframe, values) {
    var keyframes = enyo.dom.findKeyframes(keyframe);
    if (keyframes) {
        var keyframeString = [];
        var i = 0;
		for (i = 0; i < length; i ++) {
			keyframeString.push(keyframes[i].keyText);
		}
		for (i = 0; i < keyframeString.length; i ++) {
			keyframes.deleteRule(keyframeString[i]);
		}
        for (i = 0; i < values.length; i++) {
			keyframes.insertRule(values[i].keyText + " " + values[i].keyValue);
        }
        return keyframe;
    }
    return null;
};

enyo.dom.createKeyframes = function(keyframe, values) {
    var k = "@" + enyo.dom.getKeyframesPrefix() + "keyframes " + keyframe + " { ";
	for (i = 0; i < values.length; i++) {
		k += values[i].keyText + " " + values[i].keyValue;
    }
    k = k + " }";
    if( document.styleSheets && document.styleSheets.length ) {

		document.styleSheets[0].insertRule( k, 0 );

	} else {

		var s = document.createElement( "style" );
		s.innerHTML =k;
		document.getElementsByTagName( "head" )[ 0 ].appendChild( s );

	}
};


enyo.dom.createCssRule = function(rule) {
    
    if( document.styleSheets && document.styleSheets.length ) {

        document.styleSheets[0].insertRule( rule, 0 );

    } else {

        var s = document.createElement( "style" );
        s.innerHTML =rule;
        document.getElementsByTagName( "head" )[ 0 ].appendChild( s );

    }
};

enyo.dom.deleteCssRule = function (rule) {
    // gather all stylesheets into an array
    
    var ss = document.styleSheets;
   
   
    for (var i = 0; i < ss.length; ++i) {

        // loop through all the rules
        for (var j = 0; j < ss[i].cssRules.length; ++j) {

                if (ss[i].cssRules[j].selectorText == rule) {
                    ss[i].deleteRule(j);
                    return;
                }
        }
    }
    
    // rule not found
    return null;
};

enyo.dom.deleteKeyframes = function (rulename) {
    // gather all stylesheets into an array
    
    var ss = document.styleSheets;
    var pre = enyo.dom.getKeyframesPrefix().replace(/-/gi, "").toUpperCase();
    if (pre.length !== 0) {pre += "_";}
    // loop through the stylesheets
    for (var i = 0; i < ss.length; ++i) {

        // loop through all the rules
        for (var j = 0; j < ss[i].cssRules.length; ++j) {

            if (ss[i].cssRules[j].type == window.CSSRule[pre + "KEYFRAMES_RULE"] ) {
                if ( ss[i].cssRules[j].name == rulename) {
                    return ss[i].deleteRule(j);
                }
            }
        }
    }
    
    // rule not found
    return null;
};
