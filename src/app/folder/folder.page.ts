import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ViewDidEnter } from '@ionic/angular';
import * as maplibre from 'maplibre-gl';

import { APIDevices, ApiService, Device } from '../services/api.service';
import { LoadingController } from '@ionic/angular';

import { capitalizeWord  } from '../util/utils';
import { isEmpty } from 'rxjs';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit, ViewDidEnter {
  //router properties
  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);
  //variable holds the list of markers currently present in the map
  markers: maplibre.Marker[] = []; 

  @ViewChild('mapcontainer', { static: false }) mapcontainer!: ElementRef;
  map! : maplibre.Map;
  constructor(private apiService: ApiService, private loadingController: LoadingController) {}

  /*
  * Asynchronous function that holds functionality for login to the user account
  * and showing all devices last location
  */
  async ngOnInit() {
    //Application loading indicator
    const loading = await this.loadingController.create({
      spinner: 'circles',
    });
  
    await loading.present();

    //Showing the title for the current view
    const title = this.activatedRoute.snapshot.paramMap.get('id') as string;
    this.folder =  capitalizeWord(title.replace("_", " "));
    //listener for user action of seleting an option for the device.
    this.apiService.menuSelect$.subscribe((event)=>{
      this.submenuSelected(event);
    });
    
    this.apiService.login().subscribe(
      (response) => {
        // console.log('POST Response:', response.success.token);
        this.apiService.token = response.success.token;
        this.getCustomerDetails();
        this.getAllDevices();
        loading.dismiss();
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  /*
  * Adding map control to the application view
  * 
  */
  ionViewDidEnter(): void { 
    // console.log("inside did enter");
    this.map = new maplibre.Map({
      container: 'map', // The id of the map container in the HTML
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // Link to a MapLibre style
      zoom: 2 // Set initial zoom level
    });
  }

  /*
  * Function fetches basic customer details and assigns the user name to menu header
  * 
  */
  getCustomerDetails():void{
    this.apiService.getUserDetails().subscribe(
      (response) => {
        // console.log('POST Response firstname:', response.success.firstname);
        // console.log('POST Response lastname:', response.success.lastname);
        this.apiService.accountName = `${response.success.firstname} ${response.success.lastname}`;
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  /*
  * Function fetches details of all devices for the logged in user
  * 
  */
  getAllDevices():void{
    this.apiService.getAllDevices().subscribe(
      (response) => {
        // console.log('POST Response all devices:', response.success);
        response.success.forEach((item:any) => {
          // console.log(item.id);
          let deviceItem:Device = {  //initialize and load device with essential detials
            id: item.id,
            name:item.name,
            customImgUrl:item.customImgUrl,
            model:item.device_models.model,
            model_nr:item.model_nr,
            lat:0,
            long:0
          }
          this.apiService.deviceData.push(deviceItem); //push all device details to application parameter
        });
        this.plotMarker(this.apiService.deviceData); //add marker in the map for a device
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  /*
  * Function that checkes device prorperty for location availability and 
  * calls add marker function to add marker in the map.
  * If device details not hold the location details then fetch the location detial and then call addmarker function.
  */
  plotMarker(devices:Array<Device>):void{
    devices.forEach((device) => {
      if(0 == device['lat'] && 0 == device['long']){ //if device location not available
        this.apiService.getDeviceLastLocation(device['id'], 1).subscribe( //retrieve device location from API
          (response) => {
            // console.log('POST Response devices location:', response.success);
            if(response.success[0]){
              // console.log('POST Response devices location:', response.success[0].lat);
              device['lat'] = response.success[0].lat;
              device['long'] = response.success[0].lng;
              this.addMarker(response.success[0].lat, response.success[0].lng); //plot the marker for this device location
            }
          },
          (error) => {
            console.error('Error:', error);
          }
        );
      }else{
        if(device['lat'] != 0 && device['long'] != 0)
          this.addMarker(device['lat'], device['long']);
        }
    });
  }

  /*
  * Function simply adds marker to the map.
  */
  addMarker(lat: number, lng: number) {
    // console.log('add marker:' + lat + " : " +lng);
    const ele = document.createElement('div');
    ele.className = 'marker';

    // Add marker to the map at the given coordinates
    const marker = new maplibre.Marker(ele)
      .setLngLat([lng, lat])
      .addTo(this.map);

      this.markers.push(marker); // push the marker to markers variable
  }

  /*
  * Function removes all markes that are presently added into the map
  */
  clearAllMarkers() {
    this.markers.forEach(marker => marker.remove()); // Remove each marker from the map
    this.markers = []; // Clear the array
  }

  /*
  * Function removes the map layer and source
  */
  removeLineLayer() {
    // Check if the layer exists before removing
    if (this.map.getLayer('line-layer')) {
      this.map.removeLayer('line-layer');
    }

    // Check if the source exists before removing
    if (this.map.getSource('line')) {
      this.map.removeSource('line');
    }
  }

  /*
  * Function initiates fly animation to a specified location in the map
  */
  recenterMap( lat: number, lng: number, zoom: number = 1) {
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      essential: true
    });
  }

  /*
  * Function create geojson object and adds the line layer to map control
  * @param deviceCoordinates: coordinates that need to be connected with a polyline
  */
  drawPolyline(deviceCoordinates:number[][]) {
    // console.log("deviceCoordinates:"+deviceCoordinates);
    const lineData:GeoJSON.Feature = { // geojson object holding the coordinates
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: deviceCoordinates
      },
      properties:{}
    };
    // Add the line as a source to the map
    this.map.addSource('line', {  // add the line data to map data source
      type: 'geojson',
      data: lineData
    });

    this.map.addLayer({ // the line layer to the map
      id: 'line-layer',
      type: 'line',
      source: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#00ff00',
        'line-width': 3
      }
    });
    // console.log("Map Layer added");
  }

  /*
  * Function handles the options that the user selects form the submenu for a device
  * @param event: user selected option
  */
  submenuSelected(event:string): void{
    // console.log("Reached router on submenu click:"+event);
    // console.log("Reached router on submenu click:"+this.apiService.currentDeviceName);
    this.folder = this.apiService.currentDeviceName || "";
    this.clearAllMarkers(); // clear all markers before initiating the new request
    this.removeLineLayer(); // clear line layer before initiating the new request
    
    switch(event){
      case "Track Device": // track device's last 50 locations
        this.getCurrentDeviceLastFiftyLocations();
        break;
      case "Last Position": // device's last or current location
        this.apiService.deviceData.forEach(device=>{
          if(this.apiService.currentDeviceID == device['id']){
            if(device['lat'] != 0 && device['long'] != 0){
              this.addMarker(device['lat'], device['long']);
              this.recenterMap(device['lat'], device['long'], 10);
            }
          }
        });
        break;
      case "Device Route": // device's route for the last 50 locations
        this.trackCurrentDeviceLastFiftyLocations();
        break;
    }
  }

  /*
  * Function to get current device last 50 locations
  */
  getCurrentDeviceLastFiftyLocations():void{
    this.apiService.getDeviceLastLocation(this.apiService.currentDeviceID, 50).subscribe(
      (response) => {
        // console.log('POST Response devices last 50 location:', response.success);
        // console.log('POST Response devices last 50 location length:', response.success.length);
        if(response.success[0]){
          for(let i:number = 0; i<response.success.length; i++){
            // console.log('POST Response devices location:',response.success[i].lat, response.success[i].lng);
            this.addMarker(response.success[i].lat, response.success[i].lng); // add marker for device's each location
          }
          this.recenterMap(response.success[0].lat, response.success[0].lng, 8); // fly to starting marker
        }
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  /*
  * Function to get current device last 50 locations and show the route thorugh a line
  */
  trackCurrentDeviceLastFiftyLocations():void{
    this.apiService.getDeviceLastLocation(this.apiService.currentDeviceID, 50).subscribe(
      (response) => {
        // console.log('POST Response track devices last 50 location:', response.success);
        // console.log('POST Response track devices last 50 location length:', response.success.length);
        if(response.success[0]){
          let markerCoordinates:number[][] = []; //marker coordinates
          for(let i:number = 0; i<response.success.length; i++){
            // console.log('POST Response devices location:',response.success[i].lat, response.success[i].lng);
            this.addMarker(response.success[i].lat, response.success[i].lng);
            markerCoordinates.push([response.success[i].lng as number, response.success[i].lat  as number])
          }
          // console.log('POST Response track devices last 50 location coordinates:', markerCoordinates);
          this.recenterMap(response.success[0].lat, response.success[0].lng, 8);
          this.drawPolyline(markerCoordinates); // draw the lines connecting all the coordinates
        }
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

}
