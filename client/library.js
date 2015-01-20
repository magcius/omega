(function(exports) {
    "use strict";

    function range(start, end) {
        var L = [];
        for (var i = start; i < end; i++)
            L.push(i);
        return L;
    }

    function Library(libraryData) {
        this.$data = libraryData;

        this._contexts = [
            new MetadataContext("artist"),
            new MetadataContext("album"),
            new PathContext(),
            new SongsContext(),
            new SingleContext(),
        ];
        this._contexts.forEach(function(c) { c.$library = this }.bind(this));
    }
    Library.prototype.getSong = function(songID) {
        return this.$data.songs[songID];
    };
    Library.prototype.getString = function(cpoolID) {
        return this.$data.readString(cpoolID);
    };
    Library.prototype.getValidContexts = function(songID) {
        return this._contexts.filter(function(c) {
            return c.isValid(songID);
        });
    };
    Library.prototype.getSongURI = function(songID) {
        return this.$data.getSongURI(songID);
    };
    Library.prototype.getContextForName = function(contextName) {
        for (var i = 0; i < this._contexts.length; i++)
            if (this._contexts[i].title == contextName)
                return this._contexts[i];
    };

    // Returns N items around i inside L. The returned
    // list is always of size N*2+1, with the middle item
    // being the item at i. If there aren't enough items,
    // missing items are padded with undefined.
    function listContext(L, i, N) {
        var contextL = [];
        for (var x = i - N; x <= i + N; x++)
            contextL[x - i + N] = L[x];
        return contextL;
    }

    function mod(a, b) {
        return (a + b) % b;
    }

    function Context() {}
    Context.prototype.isValid = function(songID) {
        return true;
    };
    Context.prototype.prev = function(songID) {
        var g = this.get(songID);
        var currIdx = g[0], L = g[1];
        return L[mod(currIdx - 1, L.length)];
    };
    Context.prototype.next = function(songID) {
        var g = this.get(songID);
        var currIdx = g[0], L = g[1];
        return L[mod(currIdx + 1, L.length)];
    };

    function MetadataContext(contextKey) { this.$contextKey = contextKey; this.title = contextKey; }
    MetadataContext.prototype = Object.create(Context.prototype);
    MetadataContext.prototype.isValid = function(songID) {
        var contextIDs = this.$library.$data.songs[songID].contexts[this.$contextKey];
        return contextIDs.length > 0;
    };
    MetadataContext.prototype.get = function(songID) {
        var contextIDs = this.$library.$data.songs[songID].contexts[this.$contextKey];
        var contextPair = contextIDs[0];
        var contextId = contextPair[0];
        var contextIdx = contextPair[1];
        var L = this.$library.$data[this.$contextKey][contextId][1];
        return [contextIdx, L];
    };

    function PathContext() {}
    PathContext.prototype = Object.create(Context.prototype);
    PathContext.prototype.title = "path";
    PathContext.prototype.get = function(songID) {
        var fileEntry = this.$library.$data.fileEntries[songID];
        var pathID = fileEntry.pathID;
        var pathIdx = fileEntry.pathIdx;
        var L = this.$library.$data.path[pathID];
        return [pathIdx, L];
    };

    function SongsContext() {}
    SongsContext.prototype = Object.create(Context.prototype);
    SongsContext.prototype.title = "songs";
    SongsContext.prototype.get = function(songID) {
        return [songID, range(0, this.$library.$data.songs.length)];
    };

    function SingleContext() {}
    SingleContext.prototype = Object.create(Context.prototype);
    SingleContext.prototype.title = "single";
    SingleContext.prototype.get = function(songID) {
        return [0, [songID]];
    };

    function libraryFromFB2K(buffer) {
        var db = loadFB2KDatabase(buffer);
        return new Library(db);
    }

    exports.libraryFromFB2K = libraryFromFB2K;

})(window);
