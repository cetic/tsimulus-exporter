/**
 *
 * tsimulus-exporter: InfluxDB Client for Node.js (https://github.com/node-influx/node-influx)
 * We exoprt here timeseries from tsimulus-ms into an influxdb
 *
 */
const Influx = require('influx')
const express = require('express')
const http = require('http')
const os = require('os')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser())

/**
 * Create a new Influx client. We tell it to use the
 * `tsimulus` database by default, and give
 * it some information about the schema we're writing.
 */
const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: 'tsimulus',
  schema: [
    {
      measurement: 'time_series',
	  fields: {
        value: Influx.FieldType.FLOAT
      },
      tags: [
        'host',
        'serie'
      ]
    }
  ]
})

app.post('/sendToInflux', function (req, res) {

console.log(req.body);
console.log('POST /');

   influx.getDatabaseNames()
     .then(names => {
       if (!names.includes('tsimulus')) {
         influx.createDatabase('tsimulus')
       }
     })
	 
   influx.getDatabaseNames()
     .then(names => {
       if (names.includes('tsimulus')) {
	 influx.writePoints([
      {
        measurement: 'time_series',
        tags: { host: os.hostname(), serie: req.body.serie },
        fields: { value: req.body.value }
      }
    ]).catch(err => {
      console.error(`Error saving data to InfluxDB! ${err.stack}`),
	  res.end(`Error saving data to InfluxDB! ${err.stack}`)
    })
    res.end(`stored in influxdb ;)`)
	   }
	res.end(`not stored in influxdb ;(`)
  })
})
  
//remove tsimulus database
app.post('/cleanUpDB', function (req, res) {

console.log('Delete database...');
console.log(req.body);

  influx.query(`
    drop database tsimulus
  `).catch(err => {
    console.error(`Error  deleting Influx database!`)
})
})

/**
 * make sure the database exists and boot the app.
 */
influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('tsimulus')) {
      return influx.createDatabase('tsimulus')
    }
  })
  .then(() => {
    http.createServer(app).listen(3001, function () {
      console.log('Listening on port 3001')
    })
  })
  .catch(err => {
    console.error(`Error creating Influx database!`)
})