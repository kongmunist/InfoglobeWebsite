// Make the DIV element draggable:
dragElement(document.getElementById("mydiv"));
/* dragElement(document.getElementById("mydiv2")); */

var yes = document.getElementById("yes")

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
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}


function createEntry(){
	elem = document.createElement("div");
  elem.className = "entry";
  elem.contentEditable = true;
  /* elem.innerHTML = "Text" */
  return elem;
}

function plusRow(event){
  let pDiv = event.path[1];
  let kids = pDiv.children;
  kids[kids.length - 2].before(createEntry());
}


var nao;
function minusRow(event){
  let pDiv = event.path[1];
  let kids = pDiv.children;

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
    	nao = kids
    	maybeRemove.remove();
      // shrink the entryExpanded too
      shrink = kids[kids.length-3];
			shrink.className = "entry"
    }
  }
}


function focAndAddDot(event){
	let prnt = event.path[0];
  /* console.log(prnt) */

  // set dot location
  left = getLeft(prnt)
	button = document.getElementById("editButton")
  nao = document.getElementById("editButton");

  button.style.left = left + "px";
  console.log(button.style.left);
}

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
