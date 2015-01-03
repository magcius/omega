(function(exports) {
    "use strict";

    // Song Display

    function SongDisplay(library) {
        this._library = library;

        this._toplevel = document.createElement('div');
        this._toplevel.classList.add('song-display');

        this._song = document.createElement('p');
        this._toplevel.appendChild(this._song);

        this.elem = this._toplevel;
    }
    SongDisplay.prototype.setSong = function(songID) {
        this._currentSongID = songID;

        var library = this._library;
        function lookupList(L) {
            if (L.length == 0)
                return "";
            else
                return library.getString(L[0]);
        }

        if (this._currentSongID !== undefined) {
            var song = library.getSong(this._currentSongID);

            var title = lookupList(song["title"]);
            this._song.textContent = title;
        } else {
            this._song.textContent = '';
        }
    };
    SongDisplay.prototype.setModel = SongDisplay.prototype.setSong;

    // Context Switchers

    function ContextSwitcher(library) {
        this._library = library;

        this._toplevel = document.createElement('div');

        this._switcherItems = {};
        this._switchersElem = document.createElement('ul');
        this._toplevel.appendChild(this._switchersElem);

        this.elem = this._toplevel;
    }
    ContextSwitcher.prototype._activateSwitcher = function(title) {
    };
    ContextSwitcher.prototype._getSwitcher = function(title) {
        if (this._switcherItems[title])
            return this._switcherItems[title];

        var elem = document.createElement('div');
        elem.textContent = title;
        elem.addEventListener('click', this._activateSwitcher.bind(this, title));
        this._switcherItems[title] = elem;
        return elem;
    };
    ContextSwitcher.prototype.setSong = function(songID) {
        while (this._switchersElem.firstChild)
            this._switchersElem.removeChild(this._switchersElem.firstChild);

        var contexts = this._library.getValidContexts(songID);
        contexts.forEach(function(c) {
            var elem = this._getSwitcher(c.title);
            this._switchersElem.appendChild(elem);
        }.bind(this));
    };

    // Context Display

    function ContextDisplay(library) {
        this._library = library;

        this._toplevel = document.createElement('div');

        this._contextSwitcher = new ContextSwitcher(this._library);
        this._toplevel.appendChild(this._contextSwitcher.elem);

        this._songList = new HomoList(function() {
            return new SongDisplay(this._library);
        }.bind(this));
        this._toplevel.appendChild(this._songList.elem);

        this.elem = this._toplevel;
    }
    ContextDisplay.prototype._redisplay = function() {
        if (this._context === undefined || this._songID === undefined)
            return;

        var g = this._context.get(this._songID);
        var currIdx = g[0], L = g[1];
        this._songList.setModel(L);
        this._songList.centerItem(currIdx);
    };
    ContextDisplay.prototype.setContext = function(context) {
        this._context = context;
        this._redisplay();
    };
    ContextDisplay.prototype.setSong = function(songID) {
        this._songID = songID;
        this._contextSwitcher.setSong(songID);
        this._redisplay();
    };

    // Main View

    function MainView(library) {
        this._library = library;

        this._toplevel = document.createElement('div');

        this._songDisplay = new SongDisplay(this._library);
        this._toplevel.appendChild(this._songDisplay.elem);

        this._contextDisplay = new ContextDisplay(this._library);
        this._toplevel.appendChild(this._contextDisplay.elem);

        this.elem = this._toplevel;
    }
    MainView.prototype.setSong = function(songID) {
        this._songDisplay.setSong(songID);
        this._contextDisplay.setSong(songID);
    };

    var mainView = new MainView(window.$library);
    document.body.appendChild(mainView.elem);
    mainView._contextDisplay.setContext(window.$library._contexts[0]);
    mainView.setSong(0);

})(window);
