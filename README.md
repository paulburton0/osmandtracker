# OSMAndTracker

OSMAndTracker records track details uploaded via the Trip Recording plugin for the OSMAnd Android app. Tracks are then presented with speed and elevation plots, a map, and statistics about each track. Some basic operations are available for managing tracks (activity tagging, deleting, merging, and splitting).

# Prerequisites

## API keys

You must obtain a Google Maps JavaScript API Key. Go to https://developers.google.com/maps/documentation/javascript/get-api-key to get a key and record the key in routes/index.js as below:

    const googleMapApiKey = 'YOUR KEY HERE';

Also, you must obtain a mapbox API key in order to render the track maps on the track details pages. Once you've created a mapbox account, you can generate/copy your Access Token from your account page. Then paste the key in routes/track.js as below:

    const mapboxApiKey = 'YOUR KEY HERE';

## Android

In order to record tracks, you must have the OSMAnd app installed on an Android device.

In addition, you must enable and configure the Trip Recording plugin for OSMAnd. Once the Trip Recording plugin is enabled, in Settings, choose Trip Recording. In the Online Recording section, enable Online Tracking. Set the Online Tracking Web Address to the following:

    {URL OF YOUR WEB SERVER}/track?lat={0}&lon={1}&timestamp={2}&altitude={4}&speed={5}

Replace {URL OF YOUR WEB SERVER} with the URL (including the port number, if necessary) of your web server. The other parameters will be automatically inserted by the Trip Recording plugin for each report.

## Node.js server

You must have MongoDB installed and configured on your local server machine. All other node packages and dependencies will be automatically installed when you issue the command:

    npm install

Currently, the server is hardcoded to listen on port 3001, so this port mut be forwarded to the server by your router.

# Starting the server

## Using npm

If you have npm installed on the server, you can cd to the osmandtracker directory and simply run

    npm start

## Using the provided shell script

Alternately, you can use the osmandtracker shell script included in the root directory:

    ./osmandtracker start

With this command, you can also use the `stop` and `restart` commands.

The server is now listening for requests, either by the Android device reporting position, or by a browser.

Navigate to the root of the server address (remember the port number if needed) to see the main page listing the recorded tracks, with some summary information for each track. Click a track start date to see details about the track.

# Working with tracks

## Tagging track activity

You can designate each track with its activity (Driving, Walking, Boating). When a track is added, it's activity is tagged by default as "???". Click the arrow and select the correct activity for the track.

## Merging tracks

You can select the checkbox next to exactly two tracks and click Merge to merge the two tracks together. The two tracks will always be merged with the earliest timestamped track being placed at the beginning.

## Deleting tracks

Select the checkbox next to one or more tracks and click Delete to permanently delete the track(s). ***Warning: this cannot be undone***

## Splitting tracks

Currently, osmandtracker will consider any location reports within 2 minutes to be part of the same track. If you want to split a track in two, click the track timestamp to view the track details page. Then, move your mouse over either the elevation or the speed lines in the track chart. A green marker will appear along the track on the map to show the location. When you have chosen a location to split the track, click on either the elevation or speed line on the chart. The Split button
will be enabled. Click Split to create two tracks from the one that was selected.
