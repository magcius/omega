
from collections import defaultdict
import json
import mutagen
import os

def listify(v):
    if isinstance(v, list):
        return v
    elif isinstance(v, basestring):
        return [v]
    else:
        print type(v)
        assert False

class ConstantPool(object):
    def __init__(self):
        self._pool = {}
        self._items = []
        self._next_index = 0

    def add(self, value):
        if value in self._pool:
            return self._pool[value]
        else:
            index = self._next_index
            self._pool[value] = index
            self._items.append(value)
            self._next_index += 1
            return index

    def add_list(self, value):
        assert type(value) == list
        return [self.add(v) for v in value]

    def get_json(self):
        return self._items

POOL = ConstantPool()

class Context(object):
    def __init__(self, id):
        self.id = id
        self.songs = []

class ContextBag(object):
    def __init__(self, key_func):
        self._next_id = 0
        self._contexts = {}
        self._contexts_order = []
        self._key_func = key_func

    def _new_context(self):
        c = Context(self._next_id)
        self._next_id += 1
        return c

    def _get_context(self, key):
        if key in self._contexts:
            return self._contexts[key]
        else:
            context = self._new_context()
            self._contexts[key] = context
            self._contexts_order.append(key)
            return context

    def contextualize(self, song):
        keys = listify(self._key_func(song))

        ids = []
        for key in keys:
            context = self._get_context(key)
            idx = len(context.songs)
            context.songs.append(song.id)
            ids.append([context.id, idx])
        return ids

    def get_json(self):
        return [[POOL.add(key), self._contexts[key].songs] for key in self._contexts_order]

CONTEXT_BAGS = {
    "artist": ContextBag(lambda song: song.metadata.get("artist", [])),
    "album" : ContextBag(lambda song: song.metadata.get("album", [])),
    "path"  : ContextBag(lambda song: song.path),
}

class Song(object):
    def __init__(self, id, path, filename, metadata):
        self.id = id
        self.path = path
        self.filename = filename
        self.metadata = metadata
        self._contexts = {}

    def index_in_contexts(self):
        for key, bag in CONTEXT_BAGS.iteritems():
            self._contexts[key] = bag.contextualize(self)

    def get_json(self):
        METADATA_KEYS = ["artist", "album", "title", "tracknumber", "date"]

        obj = {}
        for key in METADATA_KEYS:
            value = listify(self.metadata.get(key, []))
            # obj['_' + key] = value
            obj[key] = POOL.add_list(value)
        obj["path"] = POOL.add(self.path)
        obj["filename"] = POOL.add(self.filename)
        obj["contexts"] = self._contexts
        return obj

def index_path(root):
    next_id = 0

    songs = []

    for path, subdirs, files in os.walk(root):
        subpath = path[len(root)+1:]
        for filename in files:
            full_path = os.path.join(path, filename)
            metadata = mutagen.File(full_path, easy=True)
            if not metadata:
                continue

            song = Song(next_id, subpath, filename, metadata)
            song.index_in_contexts()
            songs.append(song.get_json())
            next_id += 1
        if next_id > 10:
            break

    toplevel = {}
    toplevel["root"] = root
    toplevel["songs"] = songs
    toplevel["pool"] = POOL.get_json()
    for key, bag in CONTEXT_BAGS.iteritems():
        toplevel[key] = bag.get_json()
    print json.dumps(toplevel)

def main():
    path = ur'W:\Music\Dumb Garbage from Anime\Vocaloid'
    index_path(path)

main()
