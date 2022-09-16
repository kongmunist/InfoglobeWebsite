// Make the DIV element draggable:
dragElement(document.getElementById("mydiv"));


// Green/red button that controls the layers
var button = document.getElementById("editButton")


function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    elmnt.children[0].onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

    // Set the dot's position too if its not invisible
    if (button.style.display != "none"){
        moveDotBeside(curFocusedCell)
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}








function createEntry(){
    return createEntryWithText("");
}

function createEntryWithText(txt){
  elem = document.createElement("div");
  elem.className = "entry";
  elem.contentEditable = true;

  elem.onfocus = () => focAndAddDot(event)
  elem.onblur = () => unfoc(event)

  elem.innerText = txt;

  return elem;
}

function createSublist(){
  elem = document.createElement("div");
  elem.className = "entrySublist";
  elem.contentEditable = true;

  elem.onfocus = () => focAndAddDot(event)
  elem.onblur = () => unfoc(event)


  inDiv = document.createElement("div");
  inDiv.contentEditable = true;
  inDiv.className = "innerDiv";

  elem.appendChild(inDiv)

  return elem;
}

var expose;
function plusRow(event){
  let pDiv = getCurrentFocusedTable(event.path);
  let kids = pDiv.children;
  kids[kids.length - 2].before(createEntry());
}

function minusRow(event){
  let pDiv = getCurrentFocusedTable(event.path)
  let kids = pDiv.children;
  expose = event.path

  let maybeRemove = kids[kids.length-3];

  if (maybeRemove.className == "entry"){
  	if (maybeRemove.innerText == ""){
    	maybeRemove.remove();
    }
  	console.log("entry")
  } else if (maybeRemove.className == "entrySublist"){
    // Need to remove entry sublist if its empty, otherwise
  	console.log("entrySublist")
  	if (maybeRemove.innerText == ""){
    	maybeRemove.remove();
        // shrink the entryExpanded too
        shrink = kids[kids.length-3];
        shrink.className = "entry"
    }
  }
}

function addEnToTable(tableID, entry){
    table = document.getElementById(tableID)
    kids = table.children
    kids[kids.length-2].before(entry);
}







// When a box is highlighted, this function moves the dot to its side and
// allows us to add/remove layers to the nesting
var curFocusedCell;
function focAndAddDot(event){
    button.style.display = "";
    clicked = event.path[0];

    moveDotBeside(clicked)
    curFocusedCell = clicked;
}


// When clicking off the element, stop sticking the mouse to that table
function unfoc(event){
    console.log("esbo blur")
//    button.style.display = "none";
//    curFocusedCell = null;
}

function moveDotBeside(elmnt){
    // set dot location
    let cellPos = getPos(elmnt)
    button.style.left = (cellPos.left+clicked.clientWidth + 10) + "px";
    button.style.top = (cellPos.top) + "px";
}

function entry2Expanded(entry){
    if (entry.className != "entry"){
        return;
    }
    // convert entry to entryExpanded
    entry.className = "entryExpanded"

    // Add a new sublist
    elem = createSublist();
    entry.after(elem)
    }





function getCurrentFocusedTable(path){
    let ind = 0;
    while (ind < path.length && path[ind].className != "addableDiv"){
        ind += 1
    }
    console.log(path[ind])
    return path[ind]
}



// getting div positions
function getLeft(elem){
  return getPos(elem).left
}

function getPos(elem){
	var rect = elem.getBoundingClientRect();
  var position = {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset
  };
  return position;
}




function blockClick(e){
  e.stopPropagation();
}


//// For testing/dev
//tableID = "mydiv"
//addEnToTable(tableID, createEntryWithText("Get residence permit"));
//addEnToTable(tableID, createEntryWithText("Other stuff"));
//en = createEntryWithText("Buy a couch");
//addEnToTable(tableID, en);
//entry2Expanded(en)
