
import urllib, json, pandas, os
url = 'https://www.theweathernetwork.com/api/data/caab0049/cm'
response = urllib.urlopen(url)
data = json.loads(response.read())


time_stamp = data['obs']['updatetime']
wind_speed = data['obs']['w']
wind_speed_gust = data['obs']['wg']
temperature = data['obs']['t']
humidity = data['obs']['h']
# Assuming wind speed is always a positive integer
power_curve = pandas.read_excel('Power_Curve.xlsx')
theoretical_power = power_curve.loc[power_curve['windspeed (m/s)'].astype(float) == int(wind_speed)]['Theoretical Power (kW)'].iloc[0]
line = ",".join([str(time_stamp), str(wind_speed), str(wind_speed_gust), str(temperature), str(humidity), str(int(theoretical_power))])

filename = 'weather_logs.csv'

if os.path.exists(filename):
    with open(filename, 'r') as f:
        lines = f.read().splitlines()
        last_line = lines[-1]
        if last_line == line:
            exit()
    with open(filename, 'a') as f:
        f.write(line)
        f.write('\n')
else:
    with open(filename, 'w') as f:
        f.write('time_stamp,wind_speed,wind_speed_gust,temperature,humidity,theoretical_power')
        f.write('\n')
        f.write(line)
        f.write('\n')


