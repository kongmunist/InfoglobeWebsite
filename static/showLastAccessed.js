// This loads in a text file as a string
async function loadFile(filePath) {
  var result = null;
  result = await fetch(filePath, {
    method: 'get'
  })
  .then((response) => {
    if (response.ok) {
      return response.text();
    }
  })
  .then((response) => {
    return response;
  })
  return result;
}

// Get the last time the Infoglobe accessed this website
async function writeLastAccessed(){
    timeStr = await loadFile("static/lastLogged.txt");
    lastTime = new Date(parseInt(timeStr + "000")); // 000 needed to account for milliseconds
    timeShowcase = document.getElementById("lastAccessed");

//    timestr =
//    datestr = lastTime.toLocaleDateString([], {dateStyle:"long"});
    timeShowcase.innerHTML = "Infoglobe Last Visit Time: "
                + lastTime.toLocaleTimeString([], {timeStyle:"short"})
                + ", "
                + lastTime.toLocaleDateString([], {dateStyle:"long"});

    // Color the display box
    diff = (new Date() - lastTime)/1000; // in seconds
    greenSecond = 600 // 10 min
    yellowSecond = 3600 // 1 hour
    if (diff < greenSecond){
        timeShowcase.style.backgroundColor = "LightGreen";
    } else if (diff < yellowSecond){
        timeShowcase.style.backgroundColor = "moccasin";
    } else {
        timeShowcase.style.backgroundColor = "salmon";
    }
}

document.addEventListener("DOMContentLoaded", function(event) {
    writeLastAccessed();
})
