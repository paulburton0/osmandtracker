# OSMAndTracker

OSMAndTracker records track details uploaded via the Trip Recording plugin for the OSMAnd Android app.

# Prerequisites

## Android

In order to record tracks, you must have the OSMAnd app installed on an Android device.

In addition, you must enable and configure the Trip Recording plugin for OSMAnd. Once the Trip Recording plugin is enabled, in Settings, choose Trip Recording. In the Online Recording section, enable Online Tracking. Set the Online Tracking Web Address to the following:

    {URL OF YOUR WEB SERVER}/track?lat={0}&lon={1}&timestamp={2}&altitude={4}&speed={5}

Replace {URL OF YOUR WEB SERVER} with the URL (including the port number, if necessary) of your web server. The other parameters will be automatically inserted by the Trip Recording plugin for each report.

## Node.js Server

You must have MongoDB installed and configured on your local server machine.
All other node packages will be automatically installed when pulling from the repository.

Currently, the server is hardcoded to listen on port 3001, so this port mut be forwarded to the server by your router.

# Starting the server

If you have npm installed on the server, you can cd to the osmandtracker directory and simply run

    npm start

The server is now listening for requests, either by the Android device reporting position, or by a browser.

Navigate to the root of the server address (remember the port number if needed) to see the main page listing the recorded tracks, with some summary information for each track. Click a track start date to see details about the track.

You can select the checkbox next to two tracks and click Merge to merge the two tracks together.

Select the checkbox nex to one or more tracks and click Delete to permanently delete the track(s).
