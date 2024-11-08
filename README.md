# Device Navigator
Version # 1.0

Description: Management of GPS device locations associated for a user, in the map view.

Future scope:
-------------
1. To implement login UI that requires the user to provide user name and password to manage the devices
2. Add map controls to change the map mode
3. Move the functionality that shows all device's last location to a separate function that enables reusability
4. Add a splash screen for the application
5. Add a search box above the devices list in the menu to enable user to enter device name from a large list of devices

Resources
----------
Credentials: At present the login credentials are hardcoded inside the api services module present in src/app/services/api.service.ts.

Dependencies
-------------
1. This application relies on map library maplibre-gl