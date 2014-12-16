// https://code.google.com/p/javascript-number-formatter/

var mod = module.exports = {
  symbol: "¥",
  formats: {
    "$": "SV",
    "€": "VS",
    "¥": "V円",
    "RUB": "V S",
    "Rs": "SV"
  },
  format: function ( value ) {
    if ( value ) {
      var symbol = mod.symbol || "$";
      var format = mod.formats[symbol];
      if ( typeof format === "string" ) {
        return format.replace("S", symbol).replace("V", value);
      }
      return symbol + value;
    }
  }
};
