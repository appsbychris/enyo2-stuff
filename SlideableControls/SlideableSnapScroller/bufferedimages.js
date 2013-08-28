
//Hooks up to a SnapScrollerCell to only load 
//the image when needed
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


//* hooks up to a SnapScrollerCell, and has special
// handling for gifs.
// If the src has a .gif image, it will first load the
// image into a canvas so it doesn't animate until needed.
// When hooked up right in a SlideableSnapScroller, you can
// have the animated gif freeze when the user starts a drag.
// Improves the performance on mobile a ton.

//This control is really rough around the edges, as it was 
//pulled from one of my projects.
enyo.kind({
	name: "BufferedCanvasImage",
	kind: "Control",
	published: {
		src: "",
		border: true
	},
	style: "white-space:nowrap;",
	handlers: {
		onFlowGifs: "showGif",
		onStripGifs: "hideGif"
	},
	components: [
		{tag: "canvas",name: "image",style: "", classes: "unselectable", isChrome: true}

		//{name: "buffer", showing: false, classes: "buffer-image-class"}
		
	],
	create: function() {
		this.inherited(arguments);
		this[this.name + "imgSize"] = {};
		this[this.name + "imgSize"].width = 40;
		this[this.name + "imgSize"].height = 40;
		if (this.border) {
			this.$.image.setStyle("border: 2px solid black;border-radius: 10px;position: relative;margin-right: 5px;-webkit-transform:translate3d(0,0,0);");
			
		}
		else {
			this.$.image.setStyle("border: 2px solid white;border-radius: 0px;position: relative;-webkit-transform:translate3d(0,0,0);");
		}
		this.srcChanged();
	},
	showingGif: false,
	showGif: function() {
		if (this.src.indexOf(".gif") < 0) {return;}

		this.log(this.src);
		if (this.$.image) {
			//setTimeout(enyo.bind(this,function() {
				this.$.image.hide();	
			//}), 500);
			
		}
		if (this.$.realImage) {this.$.realImage.destroy();}
		var w = this[this.name + "imgSize"].width;
		var h = this[this.name + "imgSize"].height;
		this.createComponent({kind: "Image", name: "realImage", style:this.border ? "position: relative;-webkit-transform:translate3d(0,0,0);width:" + w + "px;height:" + h + "px;" : "border: 2px solid white;border-radius: 0px;position: relative;-webkit-transform:translate3d(0,0,0);width:" + w + "px;height:" + h + "px;"}, {owner: this});
		
		this.render();
		if (this.transformParams) {
			enyo.dom.transform(this.$.realImage, this.transformParams);
		}
		this.$.realImage.setAttribute("src", this[this.name + "imgObj"].src);
		
		this.showingGif = true;
		return true;
	},
	hideGif: function() {
		if (this.src.indexOf(".gif") < 0) {return;}
		if (this[this.name + "imgObj"]) {
			this.removeBuffer();
		}
		if (this.$.image) {
			this.$.image.show();
		}
		if (this.$.realImage) {
			this.$.realImage.destroy();
		}
		this.showingGif = false;
		return true;
	},
	transform: function(params) {
		if (this.$.realImage) {
			enyo.dom.transform(this.$.realImage, params);
		}
		else {
			enyo.dom.transform(this.$.image, params);
		}
		this.transformParams = params;
	},
	srcChanged: function(inOld) {
		enyo.asyncMethod(this, function() {
			if (this.src.length < 1) {return;}
			if (this.src.indexOf(".gif") >= 0) {
				if (this.src == inOld || (this[this.name + "imgObj"] && this[this.name + "imgObj"].src == this.src)) {
					this.removeBuffer();
					return true;
				}
				if (this.src != inOld) {

					this.hideGif();
				}
				if (this.showingGif === false) {
					//this.showBuffer();
					this[this.name + "imgObj"] = new Image();
					this[this.name + "imgObj"].onload = enyo.bind(this, function() {
						//this.log(this[this.name + "imgObj"].width, this[this.name + "imgObj"].height)
						var x = Math.min(GET_IMAGE_SIZE(), this[this.name + "imgObj"].width);
						//this.log(x, this[this.name + "imgObj"].width)
						this[this.name + "imgSize"].width = x;
						var h = 0;
						if (this[this.name + "imgObj"].width > x) {
							var r = this[this.name + "imgObj"].width / (this[this.name + "imgObj"].width - x);
							h = this[this.name + "imgObj"].height - (this[this.name + "imgObj"].height / r);
						}
						else {
							h = this[this.name + "imgObj"].height;
						}
						//this.log(h, this[this.name + "imgObj"].width)
						this[this.name + "imgSize"].height = h;
						this.applyStyle("height", h + "px");
						if (this.$.realImage) {
							var pw = this[this.name + "imgSize"].width;
							var ph = this[this.name + "imgSize"].height;
							this.$.realImage.applyStyle("height", ph + "px");
							this.$.realImage.applyStyle("width", pw + "px");
						}
						this.removeBuffer();
					});
					this[this.name + "imgObj"].onerror = enyo.bind(this, function() {
						this[this.name + "imgObj"].src = "assets/nopic.png";
					});
					this[this.name + "imgObj"].src = this.src;
				}
			}
			else {
				if (this.$.realImage) {this.$.realImage.destroy();}
				this.createComponent({kind: "Image", name: "realImage", style: "position: relative;-webkit-transform:translate3d(0,0,0);",classes: (this.border ? "" : "no-limits")}, {owner: this});
				
				this.render();
				if (this.transformParams) {
					enyo.dom.transform(this.$.realImage, this.transformParams);
				}
				this.$.realImage.setAttribute("src", this.src);
				if (this.$.image) {
					this.$.image.hide();
				}
			}
		});
	},
	removeBuffer: function() {
			if (this.$.image) {
				this.$.image.hasNode();
				var can = this.$.image.node;
				if (can) {
					var w = this[this.name + "imgSize"].width;
					var h = this[this.name + "imgSize"].height;
					if (can.width != w) {can.width = w;}
					if (can.height !=h) {can.height = h;}
					var c = can.getContext('2d');
					c.drawImage(this[this.name + "imgObj"],0 ,0 ,w,h);
					
					
				}
			}
		
	}
});

var GET_IMAGE_SIZE = function() {
  var w = enyo.dom.getWindowWidth();
  if (w > 600) {
    return 500;
  }
  else if (w <= 600 && w >=350) {
    return 305;
  }
  else if (w <= 349) {
    return 260;
  }
};