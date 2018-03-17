function readBins() {
    var select = document.getElementsByClassName("rating-histogram-bar");
    var bins = [];

    for (var i = 0; i < select.length; i++) {
        var tt = select[i].getElementsByClassName("ir tooltip")[0];

        if(typeof tt != "undefined") bins[i] = parseInt(tt.getAttribute("data-original-title").split(" ")[0].replace(",", ""));
        else bins[i] = 0;
    };

    return bins;
}

function sumSubBins(bins, a, b) {
    return bins.slice(a, b).reduce((pv, cv) => pv+cv, 0);
}

function getBigBins(bins) {
    return [sumSubBins(bins, 0, 5), sumSubBins(bins, 5, 8), sumSubBins(bins, 8, 10)];
}

function getHareNiemeyer(bigBins) {
    var sum = bigBins.reduce((pv, cv) => pv+cv, 0);
    var raw = bigBins.map(function(x){return x/sum*100;});
    var floors = raw.map(Math.floor);

    var remainder = [];
    for(var i = 0; i < floors.length; i++) {
        remainder[i] = raw[i] - floors[i];
    }

    var percentageSum = floors.reduce((pv, cv) => pv+cv, 0);
    while(percentageSum < 100){
        maxi = 0;
        maxv = 0;

        for(var i = 0; i < remainder.length; i++) {
            if(maxv < remainder[i]) {
                maxv = remainder[i];
                maxi = i;
            }
        }

        floors[maxi]++;
        percentageSum++;
    }

    return floors.map(function(x){return x + "%"});
}

function getPercentages(bins, decimals) {
    exp = Math.pow(10, decimals);
    return bins.map(function(x){return (Math.round(x*100*exp)/exp) + "%"})
}

function putBigBins(bigBins){
    var section = document.getElementsByClassName("sidebar")[0];
    var div = document.createElement("div");

    for (var i = 0; i < bigBins.length; i++) {
        var span = document.createElement("span");
        span.className = "text-slug";
        span.appendChild(document.createTextNode(bigBins[i]));

        div.appendChild(span);
        div.appendChild(document.createTextNode(" "));
    };

    section.appendChild(div);
}

function dyeBars() {
  const COLORS = ["#ff9933", "#66cc22", "#88ccff"];

  var select = document.getElementsByClassName("rating-histogram-bar");

  id = 0;

  for (var i = 0; i < select.length; i++) {
      var bar = select[i].getElementsByTagName("i")[0];
      var style = bar.getAttribute("style");

      style += "background-color: " + COLORS[id] + ";";
      bar.setAttribute("style", style);

      if(i == 4) id++;
      else if(i == 7) id++;
  };
}

function calcEqRatio(bins) {
    var half = 0;
    var full = 0;

    for(var i = 0; i < bins.length; i += 2) {
        half += bins[i];
        full += bins[i+1];
    }

    if(half + full < 100) return -1;
    else return full / half;
}

function equalizeBins(bins, ratio) {
    var correctedBins = [];

    for(var i = 0; i < bins.length; i += 2) {
        correctedBins[i] = ratio * bins[i];
        correctedBins[i+1] = bins[i+1];
    }

    return correctedBins;
}

function getAvg(bins) {
    var ratings = 0;
    var avgRating = 0.0;
    for(var i = 0; i < bins.length; i++) {
        ratings += bins[i];
        avgRating += (i+1) * bins[i];
    }

    avgRating /= 2 * ratings;

    return avgRating;
}

function adjustBins(correctedBins) {
    var maxHeight = 30.0;
    var maxValue = Math.max.apply(Math, correctedBins);

    var select = document.getElementsByClassName("rating-histogram");
    var bars = select[0].getElementsByTagName("i");

    for (var i = 0; i < bars.length; i++) {
        var style = bars[i].getAttribute("style");
        var newHeight = Math.max(maxHeight * correctedBins[i] / maxValue, 1);

        bars[i].setAttribute("style", "height: " + newHeight + "px;");
    };

    var rating = document.getElementsByClassName("display-rating")[0];
    rating.innerText = Math.round(getAvg(correctedBins) * 100) / 100;
}

function getAccepted(bins) {
    var sum = bins.reduce((pv, cv) => pv+cv, 0);
    return [sumSubBins(bins, 5, 10) / sum, sumSubBins(bins, 8, 10) / sum];
}

function putStdDev(bins) {
    var avg = getAvg(bins);
    var sum = bins.reduce((pv, cv) => pv+cv, 0);

    var stdDev = 0.0;
    for(var i = 0; i < bins.length; i++) {
        var div = (i+1)/2 - avg;
        stdDev += bins[i]/sum * div * div;
    }

    stdDev = Math.sqrt(stdDev);

    var section = document.getElementsByClassName("sidebar")[0];
    var div = document.createElement("div");

    var span = document.createElement("span");
    span.className = "text-slug";
    span.appendChild(document.createTextNode(Math.round(stdDev*100)/100));
    div.appendChild(span);

    section.appendChild(div);

    return div;
}

function putBeta(bins) {
    var sum = bins.reduce((pv, cv) => pv+cv, 0);

    if(sum < 100) return;

    var m0 = 0, m1 = 0;
    for(var i = 0; i < correctedBins.length; i++) {
        var j = (i+1) / 2.0;
        m0 += j*correctedBins[i];
        m1 += j*j*correctedBins[i];
    }

    m0 /= sum;
    m1 /= sum;

    var xi0 = m0;
    var xi1 = m1/m0;

    var tmp = (sum-1-xi0) / (xi0 + sum*(xi1-xi0));
    var alpha = xi0 * tmp;
    var beta = (sum-xi0) * tmp;

    var section = document.getElementsByClassName("sidebar")[0];
    var div = document.createElement("div");

    var span = document.createElement("span");
    span.className = "text-slug";
    span.appendChild(document.createTextNode(Math.round(beta/sum*1000)/1000));
    div.appendChild(span);

    section.appendChild(div);
}

function putLevel(level) {
    var header = document.getElementById("featured-film-header");
    var paragraph = header.getElementsByTagName("p")[0];
    paragraph.appendChild(document.createTextNode(level));
}

function getCenter(bins, portion) {
    var idx, max = 0.0;

    for(var i = 0; i < bins.length; i++) {
        if(max < bins[i])  {
            max = bins[i];
            idx = i;
        }
    }

    var sum = bins[idx];
    var a = idx, b = idx+1;

    portion *= bins.reduce((pv, cv) => pv+cv, 0);

    while(sum < portion) {
        if(a == 0) {
            sum += bins[b++];
        } else if(b == bins.length) {
            sum += bins[--a];
        } else if(bins[a-1] > bins[b]) {
            sum += bins[--a];
        } else {
            sum += bins[b++];
        }
    }

    return [(a+1)/2, b/2];
}

function appendCenter(div, ab) {
    div.appendChild(document.createTextNode(" "));

    var span = document.createElement("span");
    span.className = "text-slug";
    span.appendChild(document.createTextNode(ab[0] + ' - ' + ab[1]));
    div.appendChild(span);
}

function main() {
  var bins = readBins();
  console.log(bins);

  var correctedBins = equalizeBins(bins, 4/3);
  adjustBins(correctedBins);
  dyeBars();

  var accepted = getAccepted(correctedBins);

  putLevel(Math.floor(accepted[1]*10));
  putBigBins(getPercentages(accepted, 1));
  var div = putStdDev(correctedBins);
  appendCenter(div, getCenter(correctedBins, 0.75));
}

var headline = document.getElementsByClassName("headline-1")[0];
headline.onclick = function() {main()};
