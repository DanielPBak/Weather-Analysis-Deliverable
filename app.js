/*******************************************************
    Copyright 2018, Daniel Bak, All rights reserved.
 *******************************************************/

const express = require('express')
const app = express()
const PythonShell = require('python-shell')
const path = require("path")
const schedule = require("node-schedule")
const fs = require('fs');
var morgan = require('morgan')
var nocache = require('nocache')


var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
app.use(nocache())
app.use(morgan('combined', {stream: accessLogStream}))



config = {
  username: "TransAlta-Test",
  plotly_api_key: "lLtIbZ4vlITuy3civGT4"
}
const plotly = require('plotly')(config['username'], config['plotly_api_key'])

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.locals.basedir = path.join(__dirname, 'views');



app.listen(3000, () => console.log('Server open on port 3000'))
app.set('view engine', 'pug')
month = ""
year = ""

var passed_results = { warmest: [' ', ' '], coolest: [' ', ' ',], total_precipitation: ' ', days_above_50: ' ' }
var weather_data = []


var j = schedule.scheduleJob('00 * * * *', function () {
  console.log("Running weather update!");
  PythonShell.run('update_weather_network.py', function (err, results) {
    if (err) throw err;
  })
});

var i = schedule.scheduleJob('02 * * * *', function () {
  chart_data = []
  console.log('before file read');
  fs.readFile('weather_logs.csv', 'utf-8', function (err, data) {
    console.log('reading weather logs!');
    if (err) {
      if (err.code == "ENOENT") {
        console.log("ENOENT");
        chart_data = []
        return
      }
      else {
        throw err
      }
    }
    console.log('before lines');
    var lines = data.trim().split('\n').reverse().slice(0, -1);
    console.log('after lines');
    console.log("lines", lines);

    lines.forEach(function (line) {
      l = line.split(",")
      chart_data.push(l)
      console.log(chart_data)
    })

    chart_data = chart_data.reverse()
    x = []
    y = []
    chart_data.forEach(function (item) {
      x.push(item[0])
      y.push(item[5])
    })
    var data = [
      {
        x: x,
        y: y,
        type: "scatter"
      }
    ];
    console.log("data!");
    console.log(data);
    console.log(chart_data);
    var layout = {
      automargin: true,
      title: "Theoretical Power Over Time",
      xaxis: {
        position: 0,
        title: "TIMESTAMP",
        autotick: true,
        titlefont: {
          family: "Arial, sans-serif",
          size: 18,
          color: "black"
        }
      },
      yaxis: {
        title: "THEORETICAL POWER (kW)",
        position: -1,
        titlefont: {
          family: "Arial, sans-serif",
          size: 18,
          color: "black"
        }
      },
      autosize: false,
      width: 800,
      height: 800,
      margin: {
        l: 50,
        r: 50,
        b: 200,
        t: 100,
        pad: 4
      },
      paper_bgcolor: "#E6E6FA",
      plot_bgcolor: "white"
    }
    var graphOptions = { layout: layout, filename: "transalta-chart", fileopt: "overwrite" };
    plotly.plot(data, graphOptions, function (err, msg) {
      console.log(msg);
      console.log(err);
    });


  });


})

function update_from_weather_log() {
  new_weather_data = []
  fs.readFile('weather_logs.csv', 'utf-8', function (err, data) {
    if (err) {
      if (err.code == "ENOENT") {
        weather_data = []
        return
      }
      else {
        throw err
      }
    }

    var lines = data.trim().split('\n');
    lines = lines.slice(-6).reverse();

    if (lines.slice(-1)[0].startsWith("time_stamp")) {
      lines = lines.slice(0, -1)
    }

    lines.forEach(function (line) {
      l = line.split(",")
      new_weather_data.push(l)
    })

    weather_data = new_weather_data

  });
}

update_from_weather_log()




console.log("read weather data")

function search_weather(options, req, res) {
  console.log(options['month'], options['year'])
  PythonShell.run('weather_search.py', options, function (err, results) {
    if (err) throw err;
    // results is an array consisting of messages collected during execution
    results.forEach(result => {
      passed_results = result
    });
    console.log(passed_results)
    res.render('scenario_1', {
      coolest: passed_results['coolest'], warmest: passed_results['warmest'],
      days_above_50: passed_results['days_above_50'], total_precipitation: passed_results['total_precipitation'], weather_data: weather_data
    })
  });

}

app.get('/', function (req, res) {
  res.redirect('scenario_1')

});


app.get('/weather_logs.csv', function (req, res) {
  console.log('sending weather log')
  filePath = 'weather_logs.csv'
  res.download(filePath)
})

app.get('/scenario_2', function (req, res) {
  res.render('scenario_2')
  res.end()
})

app.get('/assumptions', function (req, res) {
  res.render('assumptions')
  res.end()
})

app.get('/scenario_1', function (req, res) {
  update_from_weather_log()
  console.log(weather_data)



  res.render('scenario_1', {
    coolest: passed_results['coolest'], warmest: passed_results['warmest'],
    days_above_50: passed_results['days_above_50'], total_precipitation: passed_results['total_precipitation'], weather_data: weather_data
  })
  console.log('done rendering')
  console.log(passed_results)
});


app.post('/weather_query', function (req, res) {
  console.log('query!')
  year = req.body['year']
  month = req.body['month']
  console.log(req.body)
  console.log(year, month)
  console.log(req.body)
  var options = {
    mode: 'json',
    pythonOptions: ['-u'], // get print results in real-time
    scriptPath: '.',
    args: [month, year]
  };
  search_weather(options, req, res);

});