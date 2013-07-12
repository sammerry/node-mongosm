Array.prototype.matchOrder = function (idArray) {

  var i = idArray.length;
  var b = this.lenght;
  var newOrder = [];

  for (i;i--;) {// array to match to
    for (b;b--;) {// array being matched
      if (this[b].osm_id == idArray[i]) {
        newOrder.unshift(this[b]);
        continue;
      }
    }
  }
  return newOrder;
};


