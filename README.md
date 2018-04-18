This is an application I made for the position of Junior Software Developer at TransAlta in early April 2018.

All of the code outside of the view folder was written by me.

app.js: the node.js server application. Hosts the pages, sends scheduled plot.ly requests and launches scheduled python API scraper. Launches weather_search.py in response to a request from the user.

weather_search.py: Downloads the requested year's data in CSV format, then filters to the required month and passes the required data to the server app.

update_weather_logs.py: Every hour, accesses Power_Curve.xlsx and a public API to scrape data which it saves in a CSV file. This file is accessed by the main app to create the plot.ly graph and weather log table.

views: the page layouts. A large portion of this is publicly available code with edits by me.

I intend to host this project again shortly.
