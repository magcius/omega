(function(exports) {
    "use strict";

    // Parses database.dat from fb2k. This is a dumb best guess
    // at a reverse-engineer of the format.

    // This seems to be consistent for all databases I generate.
    var fb2kMagic = "\xF9\x8C\x6F\x91\x83\x04\x3E\x4B\x9A\x62\x80\xDF\xA6\xD0\x8C\x81";

    function readString(stream, pos, length) {
        var L = [];
        while (length--)
            L.push(String.fromCharCode(stream.getUint8(pos++)));
        return L.join('');
    }
    function readPString(stream, pos) {
        var length = stream.getUint32(pos, true);
        return readString(stream, pos + 4, length);
    }
    function skipPString(stream, pos) {
        var length = stream.getUint32(pos, true);
        return pos + 4 + length;
    }
    function read0String(stream, pos) {
        var L = [];
        while (true) {
            var c = stream.getUint8(pos++);
            if (c == 0)
                break;
            L.push(String.fromCharCode(c));

            if (L.length > 255)
                AAA
        }
        return L.join('');
    }

    function readFolderTree(stream, pos, db, path) {
        var pathID = ++db._tmp.pathID;
        db.path[pathID] = [];

        var numSongs = stream.getUint32(pos, true);
        pos += 4;
        while (numSongs-- > 0) {
            var trackPos = pos;

            pos = skipPString(stream, trackPos);
            pos += 8; // file time, we don't care about it

            var numTracks = stream.getUint32(pos, true);
            pos += 4;

            if (numTracks == 1)
                pos += 4;
            else if (numTracks > 0)
                throw new Error("has more than one track");

            var numFolders = stream.getUint32(pos, true);
            pos += 4;

            pos += 4; // UNK
            if (numFolders != 0)
                throw new Error("has folders");

            if (numTracks > 0) {
                var entryIdx = db.fileEntries.push({ trackPos: trackPos, path: path }) - 1;
                db.path[pathID].push(entryIdx);
            }
        }

        var numFolders = stream.getUint32(pos, true);
        pos += 4;
        while (numFolders-- > 0) {
            var subFolderName = readPString(stream, pos);
            pos += 4 + subFolderName.length;
            pos = readFolderTree(stream, pos, db, path + '/' + subFolderName);
        }
        return pos;
    }

    function readStringDB(stream, idx, db) {
        if (idx > db.stringDBLength)
            XXX;

        return read0String(stream, db.stringDB + idx);
    }

    function readPlaylist(stream, pos, db) {
        var numPlaylistEntries = stream.getUint32(pos, true);
        pos += 4;

        function processValuesIdx(pos, start, end) {
            var L = [];
            for (var i = start; i < end; i++)
                L.push(stream.getUint32(pos + (i * 4), true));
            return L;
        }

        var interestingKeyNames = {};
        var INTERESTING_KEYS = {
            "artist": true, "album": true, "title": true, "tracknumber": true,
        };
        function getKeyName(keyIdx) {
            var name = interestingKeyNames[keyIdx];
            if (name !== undefined)
                return name;

            name = readStringDB(stream, keyIdx, db);
            if (!INTERESTING_KEYS[name])
                name = null;
            interestingKeyNames[keyIdx] = name;
            return name;
        }
        function indexKey(songID, trackKeys, name) {
            var context = db[name];
            var values = trackKeys[name];
            trackKeys.contexts[name] = [];

            if (!values)
                return;

            values.forEach(function(v) {
                if (context[v] === undefined)
                    context[v] = [v, []];

                var idx = context[v][1].push(songID) - 1;
                trackKeys.contexts[name].push([v, idx]);
            });
        }

        for (var entryIdx = 0; entryIdx < numPlaylistEntries; entryIdx++) {
            pos += 4; // UNK
            pos += 4; // UNK
            pos += 4; // UNK
            var filesize = stream.getUint32(pos, true);
            pos += 4;
            pos += 4; // UNK
            pos += 8; // UNK
            var duration = stream.getFloat64(pos, true);
            pos += 8;
            pos += 4; // replay gain
            pos += 4; // replay gain
            pos += 4; // replay gain
            pos += 4; // replay gain
            pos += 4; // UNK

            var numKeys = stream.getUint32(pos, true);
            pos += 4;
            var numInterleavedKeys = stream.getUint32(pos, true);
            pos += 4;

            pos += 4; // UNK

            var trackKeys = {};

            var firstValue = stream.getUint32(pos, true);
            var lastValue = firstValue;

            pos += 4;
            var valuesStart = pos + (numKeys * 8);

            while (numKeys-- > 0) {
                var keyIdx = stream.getUint32(pos, true);
                pos += 4;

                lastValue = stream.getUint32(pos, true);
                pos += 4;

                var key = getKeyName(keyIdx);
                if (key)
                    trackKeys[key] = processValuesIdx(valuesStart, firstValue, lastValue);

                firstValue = lastValue;
            }

            pos += lastValue * 4;

            while (numInterleavedKeys-- > 0) {
                var keyIdx = stream.getUint32(pos, true);
                pos += 4;

                var valueIdx = stream.getUint32(pos, true);
                pos += 4;

                var key = getKeyName(keyIdx);
                if (key)
                    trackKeys[key] = [valueIdx];
            }

            trackKeys.contexts = {};
            indexKey(entryIdx, trackKeys, "artist");
            indexKey(entryIdx, trackKeys, "album");
            db.songs.push(trackKeys);
        }
        return pos;
    }

    function loadFB2KDatabase(buffer) {
        var stream = new DataView(buffer);

        for (var i = 0; i < fb2kMagic.length; i++)
            if (fb2kMagic.charCodeAt(i) != stream.getUint8(i))
                throw new Error("magic check fail");

        var db = { fileEntries: [], songs: [], artist: {}, album: {}, path: [] };
        db.stream = stream;

        var rootFolder = readPString(stream, 0x14);
        var rootURI = readPString(stream, 0x18 + rootFolder.length + 0x38);

        db._tmp = { _pathID: 0 };
        var pos = 0x18 + rootFolder.length + 0x3C + rootURI.length;
        pos = readFolderTree(stream, pos, db, '');
        delete db._tmp;

        var stringDB = pos + 0x28;
        var stringDBLength = stream.getUint32(stringDB - 4, true);
        db.stringDB = stringDB;
        db.stringDBLength = stringDBLength;

        pos = stringDB + stringDBLength;
        readPlaylist(stream, pos, db);

        db.readString = function(idx) {
            return readStringDB(stream, idx, db);
        };
        db.getSongFilename = function(idx) {
            var fileEntry = db.fileEntries[idx];
            var filename = readPString(stream, fileEntry.trackPos);
            return rootFolder + fileEntry.path + '/' + filename;
        };

        return db;
    }

    exports.loadFB2KDatabase = loadFB2KDatabase;

})(window);
