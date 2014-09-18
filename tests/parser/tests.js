var tests = [
  {
    input: "true",
    expect: "true"
  },
  {
    input: "2 + 3",
    expect: "2 + 3"
  },
  {
    input: "{ name: 'Matt' }",
    expect: "{ name: 'Matt' }"
  },
  {
    input: "name",
    expect: "get('name')"
  },
  {
    input: "   name  ",
    expect: "get('name')"
  },
  {
    input: "name = 2",
    expect: "set('name', 2)"
  },
  {
    input: "name = true",
    expect: "set('name', true)"
  },
  {
    input: "name = new Date",
    expect: "set('name', new Date)"
  },
  {
    input: "name = user.name",
    expect: "set('name', get('user.name'))"
  },
  {
    input: "user = { name: 'Matt' }",
    expect: "set('user', { name: 'Matt' })"
  },
  {
    input: "user = { 'name': 'Matt' }",
    expect: "set('user', { 'name': 'Matt' })"
  },
  {
    input: "user = { name: 'Matt', age: 27 }",
    expect: "set('user', { name: 'Matt', age: 27 })"
  },
  {
    input: "user = { name: 'Matt', age: 27, gf: { name: 'Decca', age: 24 } }",
    expect: "set('user', { name: 'Matt', age: 27, gf: { name: 'Decca', age: 24 } })"
  },
  {
    input: "user = getUser(auth.name)",
    expect: "set('user', exec('getUser', get('auth.name')))"
  },
  {
    input: "user = getUser(auth.getName())",
    expect: "set('user', exec('getUser', exec('auth.getName')())"
  }
];

/*

parse
  1 ) remove whitespace
  2a) prop?
  2b)

prop
  1 ) remove whitespace after prop
  2a) equals?
    1a) single is assignment
    1b) OR multiple is comparison, keep going
    2 ) parse()
  2b)


*/
