import { Component, OnInit } from '@angular/core';

import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-device-submenu',
  templateUrl: './device-submenu.component.html',
  styleUrls: ['./device-submenu.component.scss'],
})
export class DeviceSubmenuComponent  implements OnInit {

  constructor(private popoverController:PopoverController) { }

  ngOnInit() {}

  /*
  * Function to handle user action of option selection
  * @param option : user selected option in the submenu for a device
  */
  selectOption(option: string) {
    // console.log(option);
    this.popoverController.dismiss(option); // Close the popover
  }

}
