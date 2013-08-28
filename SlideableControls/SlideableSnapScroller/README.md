
## SlideableSnapScroller

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

Check out the sample in the Sample folder.
For a jsFiddle, see  [SlideableSnapScroller on jsFiddle](http://jsfiddle.net/LnURX/)
