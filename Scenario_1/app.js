/*******************************************************
    Copyright 2018, Daniel Bak, All rights reserved.
 *******************************************************/

const express = require('express')
const app = express()
const PythonShell = require('python-shell')
const morgan = require("morgan")
const path = require("path")
const schedule = require("node-schedule")
const read_last_lines = require("read-last-line")
const fs = require('fs');


config = {
  username:"DanielPBak",
  plotly_api_key:"CENSORED"
}
const plotly = require('plotly')(config['username'], config['plotly_api_key'])


app.use(morgan('tiny'))
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.locals.basedir = path.join(__dirname, 'views');



app.listen(3000, () => console.log('Example app listening on port 3000!'))
app.set('view engine', 'pug')
month = ""
year = ""

var passed_results = {warmest: [' ', ' '], coldest: [' ',' ',], sum_precip:' ', days_above:' '}
var weather_data = []


var j = schedule.scheduleJob('00 * * * *', function(){
  console.log("Running weather update!");
  PythonShell.run('update_weather_network.py', function(err, results){
    if (err) throw err;
  })
});

function update_from_weather_log(){
  new_weather_data = []
  fs.readFile('weather_log.csv', 'utf-8', function(err, data) {
    if (err){
      if (err.code == "ENOENT"){
        weather_data = []
        return
      }
      else{
        throw err
      }
    }
  
    var lines = data.trim().split('\n');
    lines = lines.slice(-6).reverse();
    
    if (lines.slice(-1)[0].startsWith("update")){
      lines = lines.slice(0,-1)
    }

    lines.forEach(function(line){
      l = line.split(",")
      new_weather_data.push(l)
    })
  
    weather_data = new_weather_data
    
  });
}

update_from_weather_log()




console.log("read weather data")

function search_weather(options, req, res){
  console.log(options['month'], options['year'])
  PythonShell.run('weather_search.py', options, function (err, results) {
    console.log('running python scripto')
    if (err) throw err;
    // results is an array consisting of messages collected during execution
    results.forEach(result => {
      passed_results = result
      
    });
    res.render('scenario_1', {coldest: passed_results['coldest'], warmest:passed_results['warmest'],
    days_above:passed_results['max_gust_speed'], precipitation:passed_results['sum_precip'], weather_data:weather_data})
  });

}

app.get('/', function(req, res){
  res.send('<p><a href="/scenario_1">Scenario 1</a></p>\n')

});


app.get('/weather_log.csv', function(req, res){
  console.log('sending weather log')
  filePath = 'weather_log.csv'
  res.download(filePath)
})

app.get('/scenario_2', function(req, res){
  res.render('scenario_2')
  res.end()
})

app.get('/scenario_1', function (req, res) {
  update_from_weather_log()
  console.log(weather_data)
  chart_data = weather_data.reverse()
  x = []
  y = []
  chart_data.forEach(function(item){
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
  var layout = {
    title: "Theoretical Power Over Time",
    xaxis: {
      title: "TIMESTAMP",
      titlefont: {
        family: "Arial, sans-serif",
        size: 18,
        color: "black"
      }},
    yaxis: {
      title: "THEORETICAL POWER (kW/h)",
      titlefont: {
        family: "Arial, sans-serif",
        size: 18,
        color: "black"
      }},
    autosize: false,
    width: 800,
    height: 600,
    margin: {
      l: 50,
      r: 50,
      b: 100,
      t: 100,
      pad: 4
    },
    paper_bgcolor: "#E6E6FA",
    plot_bgcolor: "white"
  }
  var graphOptions = {layout: layout, filename: "transalta-chart", fileopt: "overwrite"};
  plotly.plot(data, graphOptions, function (err, msg) {
      console.log(msg);
  });
  

  res.render('scenario_1', {coldest: passed_results['coldest'], warmest:passed_results['warmest'],
   days_above:passed_results['max_gust_speed'], precipitation:passed_results['sum_precip'], weather_data:weather_data})
  console.log('done rendering')
});


app.post('/weather_query', function (req, res) {
  //update_from_weather_log()
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