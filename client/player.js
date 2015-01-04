(function(exports) {
    "use strict";

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
    };

    var au = document.createElement('audio');
    au.addEventListener('durationchange', function() {
    });
    au.addEventListener('timeupdate', function() {
    });

    au.src = "file:///W:/Music/Dumb Garbage from Anime/Vocaloid/40mP feat. 初音ミク. からくりピエロ (off vocal).mp3";
    au.play();

})(window);
