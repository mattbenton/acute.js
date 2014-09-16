```
{> i18n.help }
```



# Requirements

1. Observers should not have duplicate listeners.
2. A listener should not be called more than once for a specific change.


## Change Detection

- The scope creates an `Observer` for each unique path being watched.
- Observers keep track of all listeners for that path.
- Observers maintain the last digested value for their path as `value`.
- A change occurs when an observer's value differs from the current value of its path.

### Observers

The scope maintains a list of observers sorted in alphabetically ascending order. This list is used when digesting the scope.

##### Example

```
// Scope observer paths
age
name
gf
gf.age
gf.cat
gf.cat.name
gf.name
```
The scope descends this sorted list, calling `observer.digset()` on each observer.

#### Example 1

The property `gf.age` gets updated.

<pre style="float:left; margin-right: 10px">
Scope
├─ name: "Matt"
├─ age: 26
└─ gf:
   ├─ name: "Decca"
   ├─ age: 24
   └─ cat:
      └─ name: "The Wedge"
</pre>

<pre style="float:left; margin-right: 10px">
Scope
├─ name: "Matt"
├─ age: 26
└─ gf:
   ├─ name: "Decca"
   ├─ <b style="color: blue">age: 25</b>
   └─ cat:
      └─ name: "The Wedge"
</pre>

<div style="clear: both"></div>

1. `Scope.digest()` is called.
2. For each observed path:
    1. Store current value of path in `current`.
    2. If `current !== lastDigestedValue` record change.
2. Create a hash, `changedParentPaths`, of changed parent paths.
3. Remove the last property from the current path and add it to `changedParentPaths`. It would now be `{ gf: true }`
2. Remove the laTraverse up the alphabetically sorted paths and update
