import pandas
import sys
import json

month = sys.argv[1]
year = sys.argv[2]

url = 'http://climate.weather.gc.ca/climate_data/bulk_data_e.html?format=csv&stationID=49368&Year=' + year + '&Month=' + month + '&Day=1&timeframe=2&submit=Download+Data'

data = pandas.read_csv(url, skiprows=25)
ret = {}


start_date = year + '-' + month + '-' + '01'
end_date = year + '-' + month + '-' + '31'
data = data[(data['Date/Time'] >= start_date) & (data['Date/Time'] <= end_date)]
# Assumption: if there is a tie, we retrieve the first day.
try:
    hot = data.ix[data['Max Temp (\xc2\xb0C)'].idxmax()]
    ret['warmest'] = [hot['Date/Time'], hot['Max Temp (\xc2\xb0C)']]
    cold = data.ix[data['Min Temp (\xc2\xb0C)'].idxmin()]
    ret['coolest'] = [cold['Date/Time'], cold['Min Temp (\xc2\xb0C)']]
    total_precip = data['Total Precip (mm)'].sum()
    total_precip = str(float(("%0.3f"%total_precip)))
    ret['total_precipitation'] = total_precip
    days_above_50 = data['Spd of Max Gust (km/h)']
    # Assumption: all values are either integers or "<31"
    days_above_50 = pandas.to_numeric(days_above_50, errors='coerce')
    days_above_50 = days_above_50 >= 50.0
    days_above_50 = days_above_50.shape[0]
    ret['days_above_50'] = str(days_above_50)
    print(json.dumps(ret))
except TypeError:
    ret = {}
    ret['warmest'] = ['Unknown', 'Unknown']
    ret['coolest'] = ['Unknown', 'Unknown']
    ret['total_precipitation'] = 'Unknown'
    ret['days_above_50'] = 'Unknown'
    print(json.dumps(ret))