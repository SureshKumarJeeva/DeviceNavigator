import { Component, OnInit , ViewChild, ElementRef} from '@angular/core';
import { ViewDidEnter } from '@ionic/angular';

import { ApiService } from './services/api.service';

import { PopoverController } from '@ionic/angular';

import { DeviceSubmenuComponent } from './device-submenu/device-submenu.component';

import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements ViewDidEnter, OnInit {
  public appPages = [
    { title: 'All Devices', url: '/folder/all_devices', icon: 'location' },
  ];

  constructor(public apiservice:ApiService, 
    private popoverController: PopoverController, 
    private menuCtrl: MenuController,
    private router: Router,
    private location: Location
  ) {  }

  /*
  * Asynchronous function that is responsible for showing popover menu when selecting the device options
  */
  async presentPopover(event: Event) {
    const element = event.target as HTMLElement;
    
    const popover = await this.popoverController.create({
      component: DeviceSubmenuComponent,
      event: event,
      translucent: true
    });
    await popover.present();

    //on popover dismiss trigger the observable listener
    const { data } = await popover.onDidDismiss();
    this.menuCtrl.close();
    if(data){
      this.apiservice.currentDeviceID = element.getAttribute("data-device-id") || "";
      this.apiservice.currentDeviceName = element.getAttribute("data-device-name") || "";
      this.apiservice.subMenuSelect(data);
    }
  }

  ngOnInit() { }

  ionViewDidEnter(): void {  }

  /*
  * Function that is responsible for reloading the current router to show all devices of the current user
  */
  showAllDevices(){
    window.location.pathname = "/";
  }
}
