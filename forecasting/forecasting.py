# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np
import pmdarima as pm
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.io as pio
import plotly.offline as pyo
from plotly import express as px
import plotly.graph_objects as go
import plotly.subplots as sp
from pmdarima import auto_arima
from scipy.stats import mode, norm, skew
import statsmodels.api as sm
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
from statsmodels.tsa.stattools import kpss
from sklearn.metrics import mean_squared_error
from sklearn.metrics import mean_absolute_error
from sklearn.metrics import mean_absolute_percentage_error
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings
import time
import datetime
import pickle

warnings.filterwarnings("ignore")

# Load Dataset
data_path = "D:\\hotel_bookings_r_all.csv"
data = pd.read_csv(data_path)

# Data Cleaning
data['arrival_date'] = pd.to_datetime(data['arrival_date'])
data['Total Guests'] = data['adults'] + data['children']
dataResort = data[data['hotel'] == 'Relax Hotel']
data = data.reset_index(drop=True)
NumberOfGuests_ResortWeekly = dataResort['Total Guests'].groupby(dataResort['arrival_date']).sum()
NumberOfGuests_ResortWeekly = NumberOfGuests_ResortWeekly.resample('w').sum().to_frame()


"""### **Data Visualization**"""

# Occupancy Percentage per Room Type

roomtype = data['room_type'].value_counts()
fig = go.Figure(data=[go.Pie(labels=roomtype.index, values=roomtype, opacity=0.8)])
fig.update_traces(textinfo='percent+label', marker=dict(line=dict(color='#000000', width=2)))
fig.update_layout(title_text='Occupancy Percentage per Room Type', title_x=0.5, title_font=dict(size=24))
#pio.write_image(fig, file="roomtype.png")
#fig.show()

# Guest Type Percentage

roomtype = data['guest_type'].value_counts()
fig = go.Figure(data=[go.Pie(labels=roomtype.index, values=roomtype, opacity=0.8)])
fig.update_traces(textinfo='percent+label', marker=dict(line=dict(color='#000000', width=2)))
fig.update_layout(title_text='Guest Type Percentage', title_x=0.5, title_font=dict(size=24))
#pio.write_image(fig, file="guesttype.png")
#fig.show()

# Number of Guests Daily - Date

NumberOfGuests = data[['arrival_date', 'Total Guests']]
NumberOfGuests_Daily = data['Total Guests'].groupby(data['arrival_date']).sum()
NumberOfGuests_Daily = NumberOfGuests_Daily.resample('d').sum().to_frame()
NumberOfGuests_Daily

NumberOfGuests_Daily.describe()

# Number of Guests Daily - Day

lis=[]
for x in NumberOfGuests_Daily.index:
    lis.append(x.day_name())
days = pd.DataFrame(lis,columns =['Day'])

NumberOfGuestsDaily=NumberOfGuests_Daily.copy()
NumberOfGuestsDaily.reset_index(drop=True, inplace=True)

NumberOfGuestsDaily = NumberOfGuestsDaily.join(days)
NumberOfGuestsDaily

# Total Number of Guests Weekly

dataCityWeekly = data['Total Guests'].groupby(data['arrival_date']).count()
dataCityWeekly = dataCityWeekly.resample('w').sum().to_frame()

fig = px.line(dataCityWeekly, x=dataCityWeekly.index, y=dataCityWeekly['Total Guests'])
fig.update_layout(title_text='Total Number of Guests Weekly',
                  title_x=0.5, title_font=dict(size=30))

fig.update_layout(
    xaxis_title="Months",
    yaxis_title="Total Number of Guests")

# Set the x-axis tick frequency to show more months
fig.update_xaxes(
    tickmode='linear',
    tick0=dataCityWeekly.index.min(),
    dtick='M1',  # Set the interval to 1 month
    tickformat='%b\n%Y'  # Format the tick labels as abbreviated month and year
)

#pio.write_image(fig, file="guest_per_week.png")
#fig.show()

# Average Guests per Week Bar Graph

plt.figure(figsize=(10, 3))
plt.title("Average Guests per Week")

sns.barplot(x="Day", y="Total Guests", data=NumberOfGuestsDaily, order=NumberOfGuestsDaily['Day'].unique(), ci=None)

plt.xlabel('Day')
plt.ylabel('Average Guests')
#plt.savefig('average_guests_per_week.png')
plt.show()

# Number of Guest per Month

lis=[]
for x in NumberOfGuests_Daily.index:
    lis.append(x.month_name())
days = pd.DataFrame(lis,columns =['Day'])

NumberOfGuestsMonthly=NumberOfGuests_Daily.copy()
NumberOfGuestsMonthly.reset_index(drop=True, inplace=True)

NumberOfGuestsMonthly = NumberOfGuestsMonthly.join(days)
NumberOfGuestsMonthly.rename(columns = {'Day':'Month'}, inplace = True)
NumberOfGuestsMonthly

# Total Number of Guests Monthly

dataCityMonthly = data['arrival_date'].value_counts()
dataCityMonthly = dataCityMonthly.resample('m').sum().to_frame()

fig = go.Figure()
fig.add_trace(go.Scatter(x=dataCityMonthly.index, y=dataCityMonthly.values, name="Hotel",
                         hovertext=dataCityMonthly.values))
fig.update_layout(title_text='Total Number of Guests Monthly',
                  title_x=0.5, title_font=dict(size=30))  # Location and the font size of the main title
fig.update_layout(
    xaxis_title="Months",
    yaxis_title="Total Number of Guests")

#pio.write_image(fig, file="guest_per_month.png")
#fig.show()


# Average Guests per Month Bar Graph

plt.figure(figsize=(12, 3))
plt.title("Average Guests per Month.")

sns.barplot(x="Month", y="Total Guests", data=NumberOfGuestsMonthly, order=NumberOfGuestsMonthly['Month'].unique(), ci=None)

plt.xlabel('Months')
plt.ylabel('Average Guests')
plt.show()

#plt.savefig('average_guests_per_month.png')




NumberOfGuests_Daily.info()

NumberOfGuests_Daily.describe()

sns.set(rc={"figure.figsize":(5, 4)})
sns.distplot(NumberOfGuests_Daily['Total Guests'], fit= norm)
plt.title("target variable distribution")
plt.xlabel("Total Guests")
plt.ylabel("Frequency")

#express to plot entire data
fig = px.line(NumberOfGuests_Daily.reset_index(), x='arrival_date', y='Total Guests', title='Hotel Demand')
#slider
fig.update_xaxes(
    rangeslider_visible = True
)
#pio.write_image(fig, file="hotel_demand.png")
#fig.show()

decomposition = sm.tsa.seasonal_decompose(NumberOfGuests_Daily['Total Guests'],
                                         model = 'additive',
                                         period=53 #52 to 53 weeks in a year
                                         )
fig = decomposition.plot()
#pio.write_image(fig, file="decomposition.png")
plt.show()

# Test if a time series is stationary using Dickey-Fuller Test

def adf_test(timeseries):
    print ('Results of Dickey-Fuller Test:')
    dftest = adfuller(timeseries, autolag='AIC')
    dfoutput = pd.Series(dftest[0:4], index=['Test Statistic','p-value','#Lags Used','Number of Observations Used'])
    for key,value in dftest[4].items():
        dfoutput['Critical Value (%s)'%key] = value
    print (dfoutput)

adf_test(NumberOfGuests_Daily['Total Guests'])

# Test if a time series is stationary using KPSS Test

def kpss_test(timeseries):
    print ('Results of KPSS Test:')
    kpsstest = kpss(timeseries, regression='c', nlags="auto")
    kpss_output = pd.Series(kpsstest[0:3], index=['Test Statistic','p-value','Lags Used'])
    for key,value in kpsstest[3].items():
        kpss_output['Critical Value (%s)'%key] = value
    print (kpss_output)

kpss_test(NumberOfGuests_Daily['Total Guests'])

def obtain_adf_kpss_results(timeseries, max_d):
    results=[]

    for idx in range(max_d):
        adf_result = adfuller(timeseries, autolag='AIC')
        kpss_result = kpss(timeseries, regression='c', nlags="auto")
        timeseries = timeseries.diff().dropna()
        if adf_result[1] <=0.05:
            adf_stationary = True
        else:
            adf_stationary = False
        if kpss_result[1] <=0.05:
            kpss_stationary = False
        else:
            kpss_stationary = True

        stationary = adf_stationary & kpss_stationary

        results.append((idx,adf_result[1], kpss_result[1],adf_stationary,kpss_stationary, stationary))

    # Construct DataFrame
    results_df = pd.DataFrame(results, columns=['d','adf_stats','p-value', 'is_adf_stationary','is_kpss_stationary','is_stationary' ])

    return results_df


obtain_adf_kpss_results(NumberOfGuests_Daily, 3)

NumberOfGuests_Daily.plot(grid=True,figsize=(8,3), title = "Original timeseries" )
#plt.savefig('original_timeseries.png')
plt.show()

NumberOfGuests_Daily.diff().dropna().plot(grid=True,figsize=(8,3), title = "Stationary timeseries - original timeseries differenced once" )
#plt.savefig('stationary_timeseries.png')
plt.show()

"""### **Forecasting Model**"""

# Dickey-Fuller Test to City Resort Data
ResortWeeklyValues = NumberOfGuests_ResortWeekly.values
result_resort = adfuller(ResortWeeklyValues)
print('ADF Statistic: %f' % result_resort[0])
print('p-value: %f' % result_resort[1])
print('Critical Values:')
for key, value in result_resort[4].items():
    print('\t%s: %.3f' % (key, value))

# Rolling Mean & Rolling Standard Deviation of Resort Hotel
plt.figure(figsize=(15, 8))
rolling_mean = NumberOfGuests_ResortWeekly.rolling(window=4).mean()
rolling_std = NumberOfGuests_ResortWeekly.rolling(window=4).std()
plt.plot(NumberOfGuests_ResortWeekly, color='blue', label='Original')
plt.plot(rolling_mean, color='red', label='Rolling Mean')
plt.plot(rolling_std, color='black', label='Rolling Std')
plt.legend(loc='upper right')
plt.title('Rolling Mean & Rolling Standard Deviation of the Weekly Number of Guests')
#plt.savefig('mean_sd.png')
plt.show()

trainResort = NumberOfGuests_ResortWeekly[:90]
testResort = NumberOfGuests_ResortWeekly[90:]

# Fit auto_arima function to NumberOfGuests_ResortWeekly Dataset
stepwise_fit = auto_arima(trainResort['Total Guests'], start_p=1, start_q=1,
                          max_p=3, max_q=3, m=12,
                          start_P=0, seasonal=True,
                          d=None, D=1, trace=True,
                          error_action='ignore',
                          suppress_warnings=True,
                          stepwise=True)

stepwise_fit.summary()

modelResort = ARIMA(trainResort['Total Guests'],
                    order=(2, 0, 0),
                    seasonal_order=(2, 1, 0, 12))

resultResort = modelResort.fit()

# Prediction of the Test data
predictionsResortTest = resultResort.predict(90, 113, typ='levels').rename("Predictions")

plt.figure(figsize=(15, 8))
testResort['Total Guests'].plot(legend=True)
predictionsResortTest.plot(legend=True)
plt.title('Prediction of Number of Guests (Test Data)', fontsize=16)
plt.xlabel('Arrival Date', fontsize=12)
plt.ylabel('Number of Guests', fontsize=12)
#plt.savefig('test_prediction.png')


plt.figure(figsize=(15, 8))
trainResort['Total Guests'].plot(legend=True)
predictionsResortTest.plot(legend=True)
plt.title('Prediction of Number of Guests', fontsize=16)
plt.xlabel('Arrival Date', fontsize=12)
plt.ylabel('Number of Guests', fontsize=12)
#plt.savefig('prediction1.png')

# Forecast for the next year (365 days)
forecast = resultResort.get_forecast(steps=100)

# Extracting forecasted values and confidence intervals
forecast_values = forecast.predicted_mean
confidence_intervals = forecast.conf_int()

# Plotting the historical data and forecast
plt.figure(figsize=(12, 6))
plt.plot(NumberOfGuests_ResortWeekly.index, NumberOfGuests_ResortWeekly, label='Historical Data', color='blue')
plt.plot(forecast_values.index, forecast_values, label='Forecast', color='red')
plt.title('Total Number of Guests Weekly Forecast')
plt.xlabel('Date')
plt.ylabel('Total Guests')
plt.legend()
plt.show()
#plt.savefig('prediction_weekly.png')

MeanAbsPercentageErrResort_test = mean_absolute_percentage_error(testResort, predictionsResortTest)
print('Test MAPE Resort Hotel: %f' % MeanAbsPercentageErrResort_test)


# Assuming 'arrival_date' is in the correct datetime format
fig = px.line(NumberOfGuests_ResortWeekly.reset_index(), x='arrival_date', y='Total Guests', title='Total Number of Guests Weekly Forecast')

# Add a line for the forecast
forecast = resultResort.get_forecast(steps=100)
forecast_values = forecast.predicted_mean.round().astype(int)  # Round to integers
fig.add_trace(go.Scatter(x=forecast_values.index, y=forecast_values, mode='lines', name='Forecast', line=dict(color='red')))

# Add a line for historical data with legend
fig.add_trace(go.Scatter(x=NumberOfGuests_ResortWeekly.index, y=NumberOfGuests_ResortWeekly['Total Guests'], mode='lines', name='Historical Data', line=dict(color='blue')))

# Add a slider for adjusting and zooming
fig.update_xaxes(
    rangeslider_visible=True,
)

# Show the figure
fig.show()

# Save the HTML content
plot_html = pyo.plot(fig, output_type='div', include_plotlyjs='cdn', auto_open=False)

# Write the HTML content to a file or pass it to the Pug template
with open('plot.html', 'w') as file:
    file.write(plot_html)







modelResort = ARIMA(trainResort['Total Guests'],
                    order=(2, 0, 0),
                    seasonal_order=(2, 1, 0, 12))

resultResort = modelResort.fit()

# Prediction of the Test data
predictionsResortTest = resultResort.predict(90, 113, typ='levels').rename("Predictions")

# Forecast for the next year (365 days)
forecast = resultResort.get_forecast(steps=100)
forecast_values = forecast.predicted_mean.round().astype(int)

# Create a DataFrame for the forecast values
forecast_df = pd.DataFrame({'Date': forecast_values.index, 'Forecast': forecast_values})

# Extract the month and year from the date
forecast_df['Month'] = forecast_df['Date'].dt.month
forecast_df['Year'] = forecast_df['Date'].dt.year

# Filter the DataFrame for the year 2023
forecast_2023 = forecast_df[forecast_df['Year'] == 2023]

# Create a separate table for each month
figs = []
for month in range(1, 13):
    monthly_forecast = forecast_2023[forecast_2023['Month'] == month]
    table = go.Figure(data=[go.Table(
        header=dict(values=['Date per Week', 'Forecast Number of Guest']),
        cells=dict(values=[monthly_forecast['Date'].dt.strftime('%Y-%m-%d'), monthly_forecast['Forecast']])
    )])
    table.update_layout(title=f'Forecast for {pd.to_datetime(month, format="%m").strftime("%B")} {2023}')
    figs.append(table)


# Set a common height for all tables
table_height = 300

# Create a subplot with 12 tables
all_tables_subplot = sp.make_subplots(rows=12, cols=1, subplot_titles=[
    f'Forecast for {pd.to_datetime(month, format="%m").strftime("%B")} {2023}' for month in range(1, 13)
])

# Add each table to the subplot
for i, fig in enumerate(figs, start=1):
    fig.update_layout(
        margin=dict(b=10),  # Adjust the bottom margin
        height=table_height  # Set the height of each table
    )
    all_tables_subplot.add_trace(fig.data[0], row=i, col=1)

# Update the layout of the subplot
all_tables_subplot.update_layout(height=table_height * 12, showlegend=False)

# Display the compiled subplot
all_tables_subplot.show()