import { Component, Input } from '@angular/core';
import { IconDefinition } from  '@fortawesome/fontawesome-common-types'
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faHourglass } from "@fortawesome/free-solid-svg-icons";
import { NgClass } from "@angular/common";

@Component({
  selector: 'form-small-icon-button',
  standalone: true,
  imports: [FontAwesomeModule, NgClass],
  templateUrl: './form-small-icon-button.component.html',
  styleUrl: './form-small-icon-button.component.scss'
})
export class FormSmallIconButtonComponent {
  //
  // Inputs
  @Input({ required: true }) icon: IconDefinition = faHourglass;
    @Input({ required: false }) iconStyles: string = '';
  

  constructor() {}
}
