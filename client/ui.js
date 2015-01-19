(function(exports) {
    "use strict";

    // Song Display

    function SongDisplay(library) {
        this._library = library;

        this._toplevel = document.createElement('div');
        this._toplevel.classList.add('song-display');

        this._song = document.createElement('div');
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
    SongDisplay.prototype.setModel = function(songID, currSongID) {
        this.setSong(songID);
        this._toplevel.classList.toggle('active', songID == currSongID);
    };
 
    // Context Switchers

    function ContextSwitcher(driver) {
        this._driver = driver;
        this._driver.connect('song-changed', this._songChanged.bind(this));
        this._driver.connect('context-changed', this._contextChanged.bind(this));

        this._library = driver.library;

        this._toplevel = document.createElement('div');

        this._switcherItems = {};
        this._switchersElem = document.createElement('div');
        this._switchersElem.classList.add('context-switchers');
        this._toplevel.appendChild(this._switchersElem);

        this.elem = this._toplevel;
    }
    ContextSwitcher.prototype._getSwitcher = function(context) {
        var title = context.title;

        if (this._switcherItems[title])
            return this._switcherItems[title];

        var elem = document.createElement('div');
        elem.classList.add('context-switcher');
        elem.textContent = title;
        elem.addEventListener('click', function() {
            this._driver.setContext(context);
        }.bind(this));
        this._switcherItems[title] = elem;
        return elem;
    };
    ContextSwitcher.prototype._songChanged = function() {
        while (this._switchersElem.firstChild)
            this._switchersElem.removeChild(this._switchersElem.firstChild);

        var songID = this._driver.getSong();
        var contexts = this._library.getValidContexts(songID);
        contexts.forEach(function(c) {
            var elem = this._getSwitcher(c);
            this._switchersElem.appendChild(elem);
        }.bind(this));
    };
    ContextSwitcher.prototype._contextChanged = function() {
        if (this._context)
            this._switcherItems[this._context.title].classList.remove('active');

        this._context = this._driver.getContext();
        this._switcherItems[this._context.title].classList.add('active');
    };

    // Context Display

    function ContextDisplay(driver) {
        this._driver = driver;
        this._driver.connect('context-changed', this._contextChanged.bind(this));
        this._driver.connect('song-changed', this._songChanged.bind(this));

        this._toplevel = document.createElement('div');

        this._contextSwitcher = new ContextSwitcher(this._driver);
        this._toplevel.appendChild(this._contextSwitcher.elem);

        this._songList = new HomoList(function() {
            return new SongDisplay(this._driver.library);
        }.bind(this));
        this._songList.elem.classList.add('song-list');
        this._toplevel.appendChild(this._songList.elem);

        this.elem = this._toplevel;
    }
    ContextDisplay.prototype._redisplay = function() {
        if (this._context === undefined || this._songID === undefined)
            return;

        var g = this._context.get(this._songID);
        var currIdx = g[0], L = g[1];
        this._songList.setModel(L, L[currIdx]);
        this._songList.centerItem(currIdx);
    };
    ContextDisplay.prototype._contextChanged = function() {
        this._context = this._driver.getContext();
        this._redisplay();
    };
    ContextDisplay.prototype._songChanged = function() {
        this._songID = this._driver.getSong();
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

    var PlaybackSymbols = {
        PLAY     : "\u25B6",
        PAUSE    : "\u2759\u2759",
        PREVIOUS : "\u23EA",
        NEXT     : "\u23E9",
    };

    function PlaybackControls(driver) {
        this._driver = driver;

        this._toplevel = document.createElement('div');

        this._toplevel.classList.add('playback-controls');

        this._previous = document.createElement('div');
        this._previous.classList.add('playback-control');
        this._previous.classList.add('previous');
        this._previous.textContent = PlaybackSymbols.PREVIOUS;
        this._previous.addEventListener('click', function() {
            this._driver.prevSong();
        }.bind(this));
        this._toplevel.appendChild(this._previous);

        this._playPause = document.createElement('div');
        this._playPause.classList.add('playback-control');
        this._playPause.classList.add('play-pause');
        this._playPause.addEventListener('click', function() {
            this._driver.playPause();
        }.bind(this));
        this._toplevel.appendChild(this._playPause);

        this._next = document.createElement('div');
        this._next.classList.add('playback-control');
        this._next.classList.add('next');
        this._next.textContent = PlaybackSymbols.NEXT;
        this._next.addEventListener('click', function() {
            this._driver.nextSong();
        }.bind(this));
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
        this._slider.connect('value-changed', function() {
            var v = this._slider.getValue();
            this._driver.player.currentTime = (v * this._driver.player.duration);
        }.bind(this));
        this._toplevel.appendChild(this._slider.elem);

        this.elem = this._toplevel;

        this._driver.player.addEventListener('durationchange', this._updateTime.bind(this));
        this._driver.player.addEventListener('timeupdate', this._updateTime.bind(this));

        this._driver.player.addEventListener('pause', this._updateState.bind(this));
        this._driver.player.addEventListener('playing', this._updateState.bind(this));
        this._driver.player.addEventListener('play', this._updateState.bind(this));

        this._updateTime();
        this._updateState();
    }
    PlaybackControls.prototype._updateTime = function() {
        var duration = this._driver.player.duration;
        if (isNaN(duration))
            duration = 0;
        this._durationTime.setTime(duration);

        var time = this._driver.player.currentTime;
        this._playbackTime.setTime(time);

        var sliderTime = (duration > 0) ? (time / duration) : 0;
        this._slider.setValue(sliderTime);
    };
    PlaybackControls.prototype._updateState = function() {
        if (this._driver.player.paused)
            this._playPause.textContent = PlaybackSymbols.PLAY;
        else
            this._playPause.textContent = PlaybackSymbols.PAUSE;
    };

    // Main View

    function MainView(driver) {
        this._driver = driver;

        this._toplevel = document.createElement('div');
        this._toplevel.classList.add('main-view');

        this._header = document.createElement('div');
        this._header.classList.add('main-header');
        this._toplevel.appendChild(this._header);

        this._content = document.createElement('div');
        this._content.classList.add('main-content');
        this._toplevel.appendChild(this._content);

        this._contextDisplay = new ContextDisplay(this._driver);
        this._content.appendChild(this._contextDisplay.elem);

        this._footer = document.createElement('div');
        this._footer.classList.add('main-footer');
        this._toplevel.appendChild(this._footer);

        this._playbackControls = new PlaybackControls(this._driver);
        this._footer.appendChild(this._playbackControls.elem);

        this.elem = this._toplevel;
    }

    function filenameToURI(filename) {
        return "file:///" + filename.replace(/\\/g, '/');
    }

    function Driver(library) {
        this.library = library;
        this.player = document.createElement('audio');

        this._mainView = new MainView(this);
        this.elem = this._mainView.elem;

        this._context = null;
    }
    Driver.prototype.setContext = function(context) {
        if (this._context == context)
            return;

        this._context = context;
        this.emit('context-changed');
    };
    Driver.prototype.getContext = function() {
        return this._context;
    };
    Driver.prototype.setSong = function(songID) {
        if (this._songID  == songID)
            return;

        this._songID = songID;
        this.emit('song-changed');

        // If we don't have a valid context, pick the first one. It should
        // always be "artists".
        if (!this._context)
            this.setContext(this.library.getValidContexts(songID)[0]);

        var wasPaused = this.player.paused;
        var filename = this.library.getSongFilename(songID);
        this.player.src = filenameToURI(filename);
        if (!wasPaused)
            this.player.play();
    };
    Driver.prototype.getSong = function() {
        return this._songID;
    };

    Driver.prototype.playPause = function() {
        if (this.player.paused)
            this.player.play();
        else
            this.player.pause();
    };
    Driver.prototype.prevSong = function() {
        // If we're more than five seconds in, then just restart.
        if (this.player.currentTime > 2)
            this.player.currentTime = 0;
        else
            this.setSong(this._context.prev(this._songID));
    };
    Driver.prototype.nextSong = function() {
        this.setSong(this._context.next(this._songID));
    };

    Signals.addSignalMethods(Driver.prototype);

    var driver = new Driver(window.$library);
    document.body.appendChild(driver.elem);
    driver.setSong(0);

})(window);
