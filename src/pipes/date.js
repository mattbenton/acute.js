acute.pipes.date = (function () {

  var transforms = {
    // Abbreviated day name. Sun through Mon.
    a: function ( date, options ) {
      return options.daysShort[date.getDay()];
    },
    // Full day name. Sunday through Monday.
    A: function ( date, options ) {
      return options.daysLong[date.getDay()];
    },
    // Two-digit day of the month (with leading zeros). 01 through 31.
    d: function ( date ) {
      return pad(date.getDate());
    },
    // Two-digit day of the month (space padded). 1 through 31.
    e: function ( date ) {
      return pad(date.getDate(), " ");
    },
    // Abbreviated month name. Jan through Dec.
    b: function ( date, options ) {
      return options.monthsShort[date.getMonth()];
    },
    // Full month name. January through December.
    B: function ( date, options ) {
      return options.monthsLong[date.getMonth()];
    },
    // Two digit representation of the month. 01 (for January) through 12 (for December).
    m: function ( date ) {
      return pad(date.getMonth() + 1);
    },
    // Two digit representation for the year. 13.
    y: function ( date ) {
      return String(date.getFullYear()).substr(2, 2);
    },
    // Four digit representation for the year. 2013.
    Y: function ( date ) {
      return date.getFullYear();
    },
    // Two digit representation of the hour in 24-hour format. 00 through 23.
    H: function ( date ) {
      return pad(date.getHours());
    },
    // Two digit representation of the hour in 24-hour format, with a space preceding single digits. 0 through 23.
    k: function ( date ) {
      return pad(date.getHours(), " ");
    },
    // Two digit representation of the hour in 12-hour format. 01 through 12.
    I: function ( date ) {
      var hour = date.getHours() + 1;
      return pad(hour > 12 ? hour - 12 : hour);
    },
    // Hour in 12-hour format, with a space preceding single digits. 1 through 12.
    l: function ( date ) {
      var hour = date.getHours() + 1;
      return pad(hour > 12 ? hour - 12 : hour, " ");
    },
    // Two digit representation of the minute. 00 through 59.
    M: function ( date ) {
      return pad(date.getMinutes());
    },
    // UPPER-CASE "AM" or "PM" based on the given time. Example: AM for 00:31, PM for 22:23.
    p: function ( date ) {
      return date.getHours() < 12 ? "AM" : "PM";
    },
    // lower-case "am" or "pm" based on the given time. Example: am for 00:31, pm for 22:23.
    P: function ( date ) {
      return date.getHours() < 12 ? "am" : "pm";
    },
    // Two digit representation of the second. 00 through 59.
    S: function ( date ) {
      return pad(date.getSeconds());
    }
  };

  function pad ( number, padChar ) {
    padChar = padChar || "0";
    return number < 10 ? padChar + number : number;
  }

  // "%Y-%m-%d"
  function strftime ( date, format, options ) {
    if ( typeof date === "number" ) {
      date = new Date(date);
    }
    if ( !(date instanceof Date) ) {
      throw new Error("Date formatter value must be a date or integer");
    }
    return format.replace(/%([aAdebBmyYHkIlMpPS])/g, function ( line, symbol ) {
      var fn = transforms[symbol];
      return fn ? fn(date, options) : "%" + symbol;
    });
  }



  // "{ new Date() | date { format: '%Y-%m-%d' } }"
  // return format('date', new Date(), { format: '%Y-%m-%d'})

  // "{ offer.expires | date }"
  // return format('date', scope.get('offers.expires'))

  // "{ offer.expires | date | bold }"
  // return format('bold', format('date', scope.get('offers.expires')))
  // return format(scope.get('offers.expires')).pipe('date').pipe('bold').value()

  // ac-click="action(offer.expiry | date)"
  // scope.exec('action')(format(scope.get('offer.expiry')).pipe(date).value())

  // exec('action', format('date', get('offer.expiry')))
  // action
  //   offer.expiry | date | bold


  // "text = 'action(offer.expiry | date)', name = true, age = fred"

  var formatter = {
    format: function ( date ) {
      return strftime(date, "%Y-%m-%d");
    },
    parse: function () {

    }
  };

  return formatter;
}());
