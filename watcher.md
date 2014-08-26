## Watcher

- Watches a value on a scope object
- The initial context will always be the scope

### Requirements

- Callback with changes to watched object
    - `add`
    - `update`
    - `remove`
- `add` to be called for each property when object is first watched
- Store arbitrary user data on watched properties
- Move list is only for arrays and must always be in ascending order of index


### Changes Object

```
var changes = {
    addList: (change | null),
    removeList: (change | null),
    updateList: (change | null),
    moveList: (change | null)  
};

var change = {
    type: ("add" | "remove" | "update"),
    record: (primitiveRecord | objectRecord | arrayRecord),
    next: (change | null)
};

var primitiveRecord = {
    context: (scope | parent),
    field: "propertyName",
    value: "last value",
    data: (any | null)
};

var objectRecord = {
    context: (Object),
    field: "propertyName",
    value: (Object), // last value
    records: { // child records
        
    }
};

var arrayRecord = {
    context: (Object),
    field: "someArray",
    value: (Array),
    records: [] // child records,
    recordsByKey: {} // records with hash keys
};

[
    { name: "Matt", $hashKey: "$0" },
    { name: "Decca" },
    2
]
```


```
scope.watch("user", function ( changes ) {
    var removed = changes.removeList;
    while ( removed ) {
        removed.record.data.remove();
        removed = removed.next;
    }
    
    var moved = changes.moveList;
    while ( moved ) {
        var $child = moved.record.data.element;
        $child.remove().insertAfter($element.children(":eq(" + moved.index + ")"));
        moved = moved.next;
    }
});
```