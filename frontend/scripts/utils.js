let emptyList = id => {
  document.getElementById(id).replaceChildren()
}

//Upper case first letter of every word
const toTitleCase = string => {
  return string
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function populateList(data, id) {
  let list = document.getElementById(id)
  list.replaceChildren()
  let option = new Option('-- --', '')
  option.disabled = true
  option.selected = true
  list.appendChild(option)
  data.forEach(item => {
    option = new Option(item.name, JSON.stringify(item))
    list.appendChild(option)
  })
}

function removeClosePointsFront(path) {
  let initLength = path.length
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
  if (initLength > path.length) console.log('Removed close points')
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

function middlePolyline(point, path) {
  let distance = Infinity
  let firstHalf = []
  let secondHalf = []
  let index = Infinity
  let temp = {
    latitude: point.getLatLng().lat,
    longitude: point.getLatLng().lng
  }

  for (let i = 0; i < path.length; i++) {
    let tempDistance = map.distance(
      [temp.latitude, temp.longitude],
      [path[i].latitude, path[i].longitude]
    )
    if (tempDistance < distance) {
      distance = tempDistance
      index = i
    }
  }
  if (index !== Infinity) for (let i = 0; i < index; i++) firstHalf.push(path[i])
  firstHalf.push(temp)

  secondHalf = path.filter(x => !firstHalf.includes(x))
  secondHalf.unshift(temp)
  let result = {
    firstHalf: firstHalf,
    secondHalf: secondHalf
  }
  return result
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

    clearMap(false)
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
