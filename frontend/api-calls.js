async function postStation(station) {
  try {
    const response = await fetch(baseURI + 'stations', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(station),
    })
    const data = await response.json()
    console.log(data)
    return data
  } catch (err) {
    return console.log(err)
  }
}

async function postLine(line) {
  try {
    const response = await fetch(baseURI + 'lines', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(line),
    })
    const data = await response.json()
    console.log(data)
    return data
  } catch (err) {
    return console.log(err)
  }
}

async function patchStation(id, body) {
  try {
    const response = await fetch(baseURI + 'station?id=' + id, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    console.log(data)
    return data
  } catch (err) {
    return console.log(err)
  }
}

async function getSegmentByStationId(destination, id) {
  let uri = 'http://localhost:4000/segment/'
  if (destination === 'from') uri += 'to?id=' + id
  if (destination === 'to') uri += 'from?id=' + id

  const response = await fetch(uri)
  const data = await response.json()
  if (data.from != undefined) {
    console.log(data)
    return data
  }
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
