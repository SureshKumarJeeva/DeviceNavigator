import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { FormBuilder, FormGroup } from '@angular/forms';

import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  //Application properties accessed across the components
  private apiUrl:string = 'https://connect.paj-gps.de/api/v1';
  private email:string = 'testkunde@paj-gps.de';
  private password:string = "App123%23%23%23...";
  public token: string = "";
  public refreshtoken: string = "";
  public accountName: string = "";
  public deviceData:Array<Device> = [];
  public currentDeviceID!: string;
  public currentDeviceName!:string;
  
  constructor(private http: HttpClient, private fb: FormBuilder) { }

  //variable holding the observable instance
  private menuSelectSubject = new Subject<string>();
  menuSelect$ = this.menuSelectSubject.asObservable();

  /*
  * Function get triggered from main app, when a submenu item/device is selected.
  * It triggers the next operation that returns the control to observable subscribers.
  * @param data: The option seleted by the user for a device
  */
  subMenuSelect(data:string){
    this.menuSelectSubject.next(data);
  }

  /*
  * API Function that calls the login end point
  *
  */
  login(): Observable<any> {
    // console.log("login");
    return this.http.post(`${this.apiUrl}/login?email=${this.email}&password=${this.password}`, {
      headers: new HttpHeaders({})
    });
  }
  
  /*
  * API Function that gets the basic user details
  *
  */
  getUserDetails(): Observable<any> {
    return this.http.get(`${this.apiUrl}/customer`, {
      headers: new HttpHeaders({
        "Authorization" : `Bearer ${this.token}`
      })
    });
  }

  /*
  * API Function that retrieves all the devices associated for the current user logged in
  *
  */
  getAllDevices(): Observable<any> {
    return this.http.get(`${this.apiUrl}/device`,{
        headers: new HttpHeaders({
          "Authorization" : `Bearer ${this.token}`
        })
      }
    );
  }

  /*
  * API Function that gets last location of all the devices.
  * @param devices: custom variable/interface that hold the list of device IDs
  */
  getAllDevicesLastLocation(devices: APIDevices): Observable<any> {
    return this.http.post(`${this.apiUrl}/device`,devices,{
        headers: new HttpHeaders({
          "Authorization" : `Bearer ${this.token}`,
          "Content-Type" : "application/json"
        })
      }
    );
  }

  /*
  * API Function that gets last n location of a device, where n provides the number of last locations to retrieve
  * @param devices: custom variable/interface that hold the list of device IDs
  */
  getDeviceLastLocation(deviceID: string, lastpoints:number, gps: number = 0, wifi:number = 0): Observable<any> {
    return this.http.get(`${this.apiUrl}/trackerdata/${deviceID}/last_points?lastPoints=${lastpoints}&gps=${gps}&wifi=${wifi}`, {
        headers: new HttpHeaders({
          "Authorization" : `Bearer ${this.token}`
        })
      }
    );
  }
}

/*
* custom interface for holding list of device ids while calling the getAllDevicesLastLocation API
*/
export interface APIDevices{
  deviceIDs:Array<number>,
  fromLastPoint: boolean
}

/*
* custom interface for holding essential detials of a device
*/
export interface Device{
  id:string,
  name:string,
  customImgUrl:string,
  model:string,
  model_nr:string,
  lat:number,
  long:number
}