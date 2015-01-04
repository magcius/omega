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

    // Time Display -- "00:01"

    function TimeDisplay() {
        this._toplevel = document.createElement('div');
        this._toplevel.classList.add('time-display');

        this._time = document.createElement('div');
        this._time.classList.add('time-display-time');
        this._time.textContent = "00:00";
        this._toplevel.appendChild(this._time);

        // This is a bit fancy. We want to have the time take up the same
        // space no matter what text is being displayed, but we don't want
        // to hardcode a width. To do this, we have an element always
        // showing "00:00" but with visibility: hidden on it, which pads our
        // layout to what we want.
        this._layoutTime = document.createElement('div');
        this._layoutTime.classList.add('time-display-layout-time');
        this._layoutTime.textContent = "00:00";
        this._toplevel.appendChild(this._layoutTime);

        this.elem = this._toplevel;
    }
    TimeDisplay.prototype.setTime = function(secs) {
        function zfill(n) {
            if (n >= 10)
                return '' + n;
            else
                return '0' + n;
        }
        function getTimeString(time) {
            var hours, mins, secs;

            mins = Math.floor(time / 60)
            secs = Math.floor(time % 60);

            hours = Math.floor(mins / 60);
            mins = Math.floor(mins % 60);

            var str = zfill(mins) + ":" + zfill(secs);
            if (hours > 0)
                str = zfill(hours) + ":" + str;
            return str;
        }

        this._time.textContent = getTimeString(secs);
    };

    // Playback Controls

    var PLAYBACK_SYMBOLS = {
        PLAY     : "\u25B6",
        PAUSE    : "\u2759\u2759",
        PREVIOUS : "\u23EA",
        NEXT     : "\u23E9",
    };

    function PlaybackControls() {
        this._toplevel = document.createElement('div');

        this._toplevel.classList.add('playback-controls');

        this._previous = document.createElement('div');
        this._previous.classList.add('playback-control');
        this._previous.classList.add('previous');
        this._previous.textContent = PLAYBACK_SYMBOLS.PREVIOUS;
        this._toplevel.appendChild(this._previous);

        this._playPause = document.createElement('div');
        this._playPause.classList.add('playback-control');
        this._playPause.classList.add('play-pause');
        this._playPause.textContent = PLAYBACK_SYMBOLS.PLAY;
        this._toplevel.appendChild(this._playPause);

        this._next = document.createElement('div');
        this._next.classList.add('playback-control');
        this._next.classList.add('next');
        this._next.textContent = PLAYBACK_SYMBOLS.NEXT;
        this._toplevel.appendChild(this._next);

        this._times = document.createElement('div');
        this._times.classList.add('times');
        this._toplevel.appendChild(this._times);

        this._playbackTime = new TimeDisplay();
        this._playbackTime.elem.classList.add('playback-time');
        this._times.appendChild(this._playbackTime.elem);

        this._times.appendChild(document.createTextNode('/'));

        this._durationTime = new TimeDisplay();
        this._durationTime.elem.classList.add('duration-time');
        this._times.appendChild(this._durationTime.elem);

        this._slider = new Slider();
        this._slider.elem.classList.add('playback-slider');
        this._toplevel.appendChild(this._slider.elem);

        this.elem = this._toplevel;
    }
    Signals.addSignalMethods(PlaybackControls.prototype);

    // Main View

    function MainView(library) {
        this._library = library;

        this._toplevel = document.createElement('div');

        this._songDisplay = new SongDisplay(this._library);
        this._toplevel.appendChild(this._songDisplay.elem);

        this._contextDisplay = new ContextDisplay(this._library);
        this._toplevel.appendChild(this._contextDisplay.elem);

        this._playbackControls = new PlaybackControls();
        this._toplevel.appendChild(this._playbackControls.elem);

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
