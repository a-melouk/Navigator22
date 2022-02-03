//Fetching all available lines
let populate = () => {
  getAllLinesNamesIds().then((data) => {
    populateList(data, 'line')
  })
}

let emptyList = (id) => {
  document.getElementById(id).replaceChildren()
}

//Upper case first letter of every word
const toTitleCase = (string) => {
  return string
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

//Automatic pick
function getStationsByLine(line) {
  getStationsOfLine(line).then((data) => {
    populateList(data.from, 'from')
    populateList(data.to, 'to')
  })
}

function populateList(data, id) {
  let list = document.getElementById(id)
  list.replaceChildren()
  let option = new Option('-- --', '')
  option.disabled = true
  option.selected = true
  list.appendChild(option)
  data.forEach((item) => {
    option = new Option(item.name, JSON.stringify(item))
    list.appendChild(option)
  })
}

function addLineToMap(number) {
  clearMap()
  getLineByName(number).then((data) => {
    data.forEach((item) => {
      addStationToMap(item.from, 'line', number)
      addStationToMap(item.to, 'line', number)
      addPolylineToMap(item.path, 'black', 'line')
    })
    linelayer.addTo(map)
    map.fitBounds(linelayer.getBounds())
  })
}

function removeClosePoints(path) {
  for (let i = 0; i < path.length - 2; i++)
    if (
      map.distance(
        [path[i].latitude, path[i].longitude],
        [path[i + 1].latitude, path[i + 1].longitude]
      ) < 4.5
    ) {
      path.splice(i + 1, 1)
      console.log('Removed points from the beginning')
    }
  if (
    map.distance(
      [path[path.length - 2].latitude, path[path.length - 2].longitude],
      [path[path.length - 1].latitude, path[path.length - 1].longitude]
    ) < 4.5
  ) {
    path.splice(path.length - 2, 1)
    console.log('Removed before last point')
  }
  return path
}

function trueIfDifferent(a, b) {
  if (
    Math.fround(a.latitude) === Math.fround(b.latitude) &&
    Math.fround(a.longitude) === Math.fround(b.longitude)
  )
    return false
  return true
}

function displayNotification(identifier, text) {
  let notification = document.getElementById('notification')
  let notificationIdentifier = document.getElementById('notification-identifier')
  let notificationText = document.getElementById('notification-text')
  const myPromise = new Promise((resolve, reject) => {
    notification.hidden = false
    notification.classList.remove('fadeOut')

    notificationIdentifier.innerHTML = identifier
    notificationText.innerHTML = text
    notification.classList.add('shake-top')
    notificationIdentifier.classList.add('focus-in-expand')
    notificationText.classList.add('focus-in-expand')

    clearMapWithoutDrawControl()
    resolve('foo')
  })
  myPromise.then(() => {
    setTimeout(() => {
      notification.classList.remove('shake-top')
      notificationIdentifier.classList.remove('focus-in-expand')
      notificationText.classList.remove('focus-in-expand')
      notification.classList.add('fadeOut')
      // notification.hidden = true
    }, 5000)
  })
}

function cleanPath(line) {
  console.log(line)
  getLineByName(line).then((data) => {
    console.log(data)
    data.forEach((item) => {
      let toUpdate = false
      // console.log(item)
      let id = item._id
      let from = item.from
      let to = item.to
      if (removeClosePoints(item.path).length < item.path) {
        toUpdate = true
        item.path = [...removeClosePoints]
      }
      if (toUpdate) {
        const finalResult = {
          from: from,
          to: to,
          path: item.path,
          _id: id,
        }
        patchSegment(id, finalResult).then(() => console.log('Removed tight points'))
      }
    })
  })
}
