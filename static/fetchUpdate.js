const intervalID = setInterval(getUpdate, 3000);

async function getUpdate() {
  const recents = document.getElementById("recent_msg")
  const history = document.getElementById("full_history")

  const recentsList = [];
  Array.from(recents.children).forEach((item, i) => {
    recentsList.push(item.innerHTML);
  });


  await fetch('/getupdate', {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'get',
  })
  .then(response => response.json())
  .then(json => {
    if (JSON.stringify(json.values) !=  JSON.stringify(recentsList)) {
      recents.innerHTML = ""

      json.values.forEach((item, i) => {
          const li = document.createElement("li")
          li.innerHTML = item
          recents.appendChild(li)
      });

      history.innerHTML = ""
      json.history.forEach((item, i) => {
          const span = document.createElement("span")
          span.innerHTML = item
          const br = document.createElement("br")
          history.appendChild(span)
          history.appendChild(br)
      });
    }
  });
}
