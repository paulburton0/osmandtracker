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
