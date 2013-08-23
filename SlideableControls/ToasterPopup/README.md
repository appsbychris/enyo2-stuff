
## ToasterPopup

ToasterPopup
A popup that slides in from a side of the screen.
You can have it anchored to a side, or un-anchored to have it float to a position.
modal, autoDismiss, floating, and centered that behave just like enyo.Popup.
Also has support for centeredX and centeredY to align just 1 axis.
To show the popup, simply call show() on it, and to hide simply call hide();

this.$.toasterPopup.show();
this.$.toasterPopup.hide();

To position the popup, you can either set the "top" and "left" properties when declaring the ToasterPopup, or you can call the setPosition() method, or just the setTop() and setLeft() methods.

Note Toaster popup is based off Slideable3d, but will work with just the normal Slideable if you wish.

Check out the sample in the Sample folder.
For a jsFiddle, see  [SlideableMenu on jsFiddle](http://jsfiddle.net/B4QHA/)

