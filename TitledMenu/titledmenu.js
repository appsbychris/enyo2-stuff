enyo.kind({
    name: "TitledMenu",
    kind: "onyx.Menu",
    published: {
        //* Title to be displayed
        menuTitle: "Menu:",
        //* Height of the title bar, in px
        titleHeight: 20,
        //* Classes for the title bar
        titleClasses: "menu-title",
        //* Maximum height of the menu
        maxHeight: 200,
        //* Toggle scrolling
        scrolling: true
    },
    childComponents: [
        {name: "title", kind: "Control"},
        {name: "client", kind: "enyo.Scroller", strategyKind: "TouchScrollStrategy"}
    ],
    create: function() {
        this.inherited(arguments);
        this.menuTitleChanged();
        this.titleHeightChanged();
        this.titleClassChanged();
    },
    menuTitleChanged: function() {
        if (this.$.title) {
            this.$.title.setContent(this.menuTitle);
        }
    },
    origMaxHeight: 200,
    titleHeightChanged: function() {
        if (this.$.title) {
            this.$.title.applyStyle("height", this.titleHeight + "px");
            this.maxHeight = this.origMaxHeight - this.titleHeight;
        }
    },
    titleClassChanged: function() {
        if (this.$.title) {
            this.$.title.setClasses(this.titleClasses);
        }    
    },
    maxHeightChanged: function() {
        this.origMaxHeight = this.maxHeight;
        this.maxHeight = this.origMaxHeight - this.titleHeight;
        this.inherited(arguments);
    }
});