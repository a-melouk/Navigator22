function patchStation(id, body) {
  return fetch(baseURI + 'station?id=' + id, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data)
      return data
    })
    .catch((err) => console.log(err))
}

function getSegmentByStationId(destination, id) {
  let uri = 'http://localhost:4000/segment/'
  if (destination === 'from') uri += 'to?id=' + id
  if (destination === 'to') uri += 'from?id=' + id

  return fetch(uri)
    .then((response) => response.json())
    .then((data) => {
      if (data.from != undefined) {
        console.log(data)
        return data
      }
    })
}

async function patchSegment(id, body) {
  await fetch(baseURI + 'segment?id=' + id, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
    .then((data) => data.json())
    .catch((err) => console.log(err))
}
